import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- IMPORT
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { score, total, questions, userAnswers, mode, examId } = route.params; 
  const { user } = useAuth();
  const { theme } = useTheme(); // <--- UŻYCIE
  const savedRef = useRef(false);

  useEffect(() => {
    // ... (TWOJA LOGIKA ZAPISU DO FIREBASE - BEZ ZMIAN) ...
    const saveResult = async () => {
      if (!user || savedRef.current) return;
      savedRef.current = true;
      try {
        const historyData = {
          score, total, percentage: total > 0 ? Math.round((score / total) * 100) : 0,
          mode: mode || 'standard', date: serverTimestamp(), examId,
          details: { questions, userAnswers }
        };
        await addDoc(collection(db, 'users', user.uid, 'history'), historyData);
        
        // Trener błędów
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
      } catch (error) { console.error(error); }
    };
    saveResult();
  }, [user, score, total, mode, examId, questions, userAnswers]);

  if (mode === 'onelife') {
    // OneLife ma swój unikalny ciemny styl, ale przycisk powrotu dostosujemy
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
        {/* KARTA WYNIKU */}
        <View style={[styles.card, isPassed ? styles.cardSuccess : styles.cardFail, { backgroundColor: theme.card }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>{isPassed ? "ZDAŁEŚ!" : "NIEZALICZONY"}</Text>
          <Text style={[styles.scoreText, { color: theme.text }]}>{score} / {total}</Text>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
        
        <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.primary }]}>
            <Text style={[styles.infoText, { color: theme.primary }]}>
                {isPassed ? "Świetna robota! " : "Nie martw się! "}
                Błędne odpowiedzi trafiły do Trenera.
            </Text>
        </View>

        <Text style={[styles.sectionHeader, { color: theme.text }]}>Szczegółowa analiza:</Text>
        
        {questions.map((q, index) => {
          const userAnswerIndex = userAnswers[index];
          if (!q) return null; 
          const isCorrect = userAnswerIndex === q.correctAnswerIndex;
          const isSkipped = userAnswerIndex === null;

          return (
            <View key={index} style={[
              styles.questionBox, 
              // W trybie ciemnym używamy ciemnego tła z kolorową ramką
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

      {/* FOOTER */}
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
  infoText: { textAlign: 'center', fontSize: 14 }
});