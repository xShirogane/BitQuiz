import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore';
import { saveMistakes, addToHistory } from '../utils/historyManager';
import { completeDailyExam } from '../utils/streakManager';
import { awardExamXP, awardStreakXP } from '../utils/xpManager';
import { checkDailyChallengeAfterExam } from '../utils/dailyChallengeManager';
import { awardExamCoins, addCoins, COIN_REWARDS } from '../utils/coinManager';
import { Ionicons } from '@expo/vector-icons';

interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number | null;
  media?: any;
}

type ResultScreenProps = {
  route: {
    params: {
      score: number;
      total: number;
      questions: Question[];
      userAnswers: (number | null)[];
      mode: string;
      examId?: string;
      timeSpent?: number;
    };
  };
  navigation: any;
};

export default function ResultScreen({ route, navigation }: ResultScreenProps) {
  const { score, total, questions, userAnswers, mode, examId, timeSpent } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const savedRef = useRef(false);
  const [xpBreakdown, setXpBreakdown] = useState<string[]>([]);
  const [totalXPGained, setTotalXPGained] = useState(0);
  const [coinsGained, setCoinsGained] = useState(0);
  const [coinBreakdown, setCoinBreakdown] = useState<string[]>([]);

  useEffect(() => {
    const saveResult = async () => {
      if (savedRef.current) return;
      savedRef.current = true;

      // --- 1. ZALICZANIE SERII (STREAK) ---
      if (total >= 40 && mode !== 'onelife') {
        try {
          const streakData = await completeDailyExam();
          // XP za streak
          if (streakData.currentStreak > 0) {
            await awardStreakXP(streakData.currentStreak);
          }
        } catch (streakError) {
          console.error('Błąd aktualizacji serii:', streakError);
        }
      }

      // --- 2. OBSŁUGA BŁĘDÓW (LOCAL STORAGE) ---
      const wrongQuestionIds: number[] = [];
      questions.forEach((q, index) => {
        if (q && userAnswers[index] !== q.correctAnswerIndex) {
          wrongQuestionIds.push(q.id);
        }
      });

      if (wrongQuestionIds.length > 0) {
        await saveMistakes(examId || 'general', wrongQuestionIds);
      }

      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

      // --- 2.5 ZAPIS LOKALNY DO ASYNC STORAGE (Dla Szybkich Akcji) ---
      const localHistoryData = {
        examId: examId || 'unknown',
        timestamp: Date.now(),
        mode: mode || 'standard',
        score: score,
        totalQuestions: total,
        passed: percentage >= 50,
        timeSpentSeconds: timeSpent || 0,
      };

      await addToHistory(localHistoryData);

      // --- XP ZA EGZAMIN ---
      if (mode !== 'onelife') {
        const xpResult = await awardExamXP(score, total, mode);
        let finalXP = xpResult.totalXPGained;
        const finalBreakdown = [...xpResult.breakdown];

        // --- SPRAWDŹ WYZWANIE DNIA (jedna wspólna funkcja) ---
        let challengeCompleted = false;
        if (examId) {
          const challengeResult = await checkDailyChallengeAfterExam(
            examId, percentage, total, timeSpent
          );
          if (challengeResult.xpAwarded > 0) {
            finalXP += challengeResult.xpAwarded;
            finalBreakdown.push(`🎯 Wyzwanie dnia: +${challengeResult.xpAwarded} XP`);
          }
          challengeCompleted = challengeResult.challengeCompleted;
        }

        setTotalXPGained(finalXP);
        setXpBreakdown(finalBreakdown);

        // --- MONETY ZA EGZAMIN ---
        const coinResult = await awardExamCoins(percentage);
        if (challengeCompleted) {
          await addCoins(COIN_REWARDS.DAILY_CHALLENGE, 'Wyzwanie dnia');
          coinResult.coinsGained += COIN_REWARDS.DAILY_CHALLENGE;
          coinResult.breakdown.push(`🎯 Wyzwanie dnia: +${COIN_REWARDS.DAILY_CHALLENGE} 💎`);
        }
        setCoinsGained(coinResult.coinsGained);
        setCoinBreakdown(coinResult.breakdown);
      }

      // --- 3. ZAPIS FIREBASE ---
      if (!user) return;

      try {
        const detailedAnswers = questions.map((q, index) => {
          const userAnswerIndex = userAnswers[index];
          if (!q) return null;

          return {
            questionId: q.id,
            questionText: q.text,
            userAnswerIndex: userAnswerIndex ?? null,
            correctAnswerIndex: q.correctAnswerIndex,
            isCorrect: userAnswerIndex === q.correctAnswerIndex,
            answerOptions: q.answers
          };
        }).filter(item => item !== null);

        const historyData = {
          examId: examId || 'unknown',
          userId: user.uid,
          date: serverTimestamp(),
          timestamp: Date.now(),
          mode: mode || 'standard',
          score: score,
          totalQuestions: total,
          passed: percentage >= 50,
          timeSpentSeconds: timeSpent || 0,
          answers: detailedAnswers
        };

        await addDoc(collection(db, 'users', user.uid, 'history'), historyData);

        // Zapis do Trenera Błędów w Firebase
        const batch = writeBatch(db);
        let mistakeCount = 0;

        questions.forEach((q, index) => {
          const userAnswerIndex = userAnswers[index];
          if (q && userAnswerIndex !== q.correctAnswerIndex) {
            mistakeCount++;
            const safeExamId = examId || 'general';
            const docId = `${safeExamId}_${q.id}`;
            const mistakeRef = doc(db, 'users', user.uid, 'mistakes', docId);
            batch.set(mistakeRef, {
              questionId: q.id, examId: safeExamId, text: q.text, answers: q.answers,
              correctAnswerIndex: q.correctAnswerIndex, media: (q as any).media || null,
              lastMistakeDate: serverTimestamp(), mistakeCount: increment(1), consecutiveCorrect: 0,
            }, { merge: true });
          }
        });
        if (mistakeCount > 0) await batch.commit();
      } catch (error) { console.error("Błąd zapisu Firebase:", error); }
    };

    saveResult();
  }, [user, score, total, mode, examId, questions, userAnswers]);

  if (mode === 'onelife') {
    return (
      <View style={[styles.darkContainer, { backgroundColor: '#1c1c1e' }]}>
        <View style={styles.gameOverCard}>
          <Text style={styles.gameOverTitle}>💀 GAME OVER</Text>
          <Text style={styles.streakLabel}>TWOJA SERIA</Text>
          <Text style={styles.streakScore}>{score}</Text>
          <Text style={styles.subText}>{score > 10 ? "Niesamowity wynik!" : "Spróbuj pobić ten rekord!"}</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.retryButtonText}>WRÓĆ DO MENU</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const isPassed = percentage >= 50;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, isPassed ? styles.cardSuccess : styles.cardFail, { backgroundColor: theme.card }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>{isPassed ? "ZDAŁEŚ!" : "NIEZALICZONY"}</Text>
          <Text style={[styles.scoreText, { color: theme.text }]}>{score} / {total}</Text>
          <Text style={styles.percentText}>{percentage}%</Text>

          {timeSpent !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, opacity: 0.7 }}>
              <Ionicons name="time-outline" size={18} color={theme.text} />
              <Text style={{ color: theme.text, marginLeft: 5, fontSize: 16 }}>
                Czas: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
              </Text>
            </View>
          )}

        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.primary }]}>
          <Text style={[styles.infoText, { color: theme.primary }]}>
            {isPassed ? "Świetna robota! " : "Nie martw się! "}
            Błędne odpowiedzi trafiły do Trenera.
          </Text>
        </View>

        {/* XP GAINED */}
        {totalXPGained > 0 && (
          <View style={[styles.xpBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.xpTitle, { color: '#FFD700' }]}>🏅 +{totalXPGained} XP</Text>
            {xpBreakdown.map((line, i) => (
              <Text key={i} style={[styles.xpLine, { color: theme.subText }]}>{line}</Text>
            ))}
          </View>
        )}

        {/* COINS GAINED */}
        {coinsGained > 0 && (
          <View style={[styles.xpBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.xpTitle, { color: '#7F00FF' }]}>💎 +{coinsGained} monet</Text>
            {coinBreakdown.map((line, i) => (
              <Text key={i} style={[styles.xpLine, { color: theme.subText }]}>{line}</Text>
            ))}
          </View>
        )}

        <Text style={[styles.sectionHeader, { color: theme.text }]}>Szczegółowa analiza:</Text>

        {questions.map((q, index) => {
          const userAnswerIndex = userAnswers[index];
          if (!q) return null;
          const isCorrect = userAnswerIndex === q.correctAnswerIndex;
          const isSkipped = userAnswerIndex === null;

          return (
            <View key={index} style={[
              styles.questionBox,
              { backgroundColor: theme.card, borderColor: isCorrect ? '#4CAF50' : theme.danger }
            ]}>
              <Text style={[styles.questionText, { color: theme.text }]}>{index + 1}. {q.text}</Text>

              <View style={styles.answerRow}>
                <Text style={styles.label}>Twoja odp:</Text>
                <Text style={[styles.answerText, isCorrect ? styles.textGreen : styles.textRed, isSkipped && styles.textGray]}>
                  {isSkipped ? "(Brak odpowiedzi)" : `${String.fromCharCode(65 + userAnswerIndex!)}. ${q.answers[userAnswerIndex!]}`}
                </Text>
              </View>

              {!isCorrect && q.correctAnswerIndex !== null && (
                <View style={styles.answerRow}>
                  <Text style={styles.label}>Poprawna:</Text>
                  <Text style={[styles.answerText, styles.textGreen]}>
                    {String.fromCharCode(65 + q.correctAnswerIndex)}. {q.answers[q.correctAnswerIndex]}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => navigation.popToTop()}>
          <Text style={styles.buttonText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 20 },
  darkContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  gameOverCard: { alignItems: 'center', marginBottom: 50 },
  gameOverTitle: { fontSize: 40, fontWeight: '900', color: '#FF3B30', marginBottom: 40, letterSpacing: 2 },
  streakLabel: { color: '#888', fontSize: 16, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 10 },
  streakScore: { color: '#fff', fontSize: 120, fontWeight: 'bold', lineHeight: 120 },
  subText: { color: '#666', fontSize: 18, marginTop: 20 },
  retryButton: { backgroundColor: '#FF3B30', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
  retryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

  card: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 25, elevation: 4 },
  cardSuccess: { borderTopWidth: 5, borderTopColor: '#4CAF50' },
  cardFail: { borderTopWidth: 5, borderTopColor: '#F44336' },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  scoreText: { fontSize: 40, fontWeight: 'bold' },
  percentText: { fontSize: 18, color: '#666' },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  questionBox: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1 },

  questionText: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  answerRow: { marginTop: 5 },
  label: { fontSize: 12, color: '#777', fontWeight: 'bold', textTransform: 'uppercase' },
  answerText: { fontSize: 15, fontWeight: '500' },
  textGreen: { color: '#4CAF50', fontWeight: 'bold' },
  textRed: { color: '#F44336', textDecorationLine: 'line-through' },
  textGray: { color: '#777', fontStyle: 'italic' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
  button: { paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  infoBox: { padding: 10, borderRadius: 8, marginBottom: 20, borderWidth: 1 },
  infoText: { textAlign: 'center', fontSize: 14 },
  xpBox: { padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  xpTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  xpLine: { fontSize: 13, marginBottom: 2 },
});