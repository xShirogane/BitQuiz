import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore'; // ➕ Dodano writeBatch, doc, increment

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  // Dodano examId do destrukturyzacji (było w komentarzu, teraz jest kluczowe)
  const { score, total, questions, userAnswers, mode, examId } = route.params; 
  
  const { user, userProfile } = useAuth(); // ➕ userProfile przyda się później do sprawdzania PRO
  const savedRef = useRef(false);

  useEffect(() => {
    const saveResult = async () => {
      if (!user || savedRef.current) return;
      savedRef.current = true;

      try {
        // 1. Zapis historii (tak jak było)
        const historyData = {
          score: score,
          total: total,
          percentage: total > 0 ? Math.round((score / total) * 100) : 0,
          mode: mode || 'standard',
          date: serverTimestamp(),
          examId: examId,
          details: {
            questions: questions,
            userAnswers: userAnswers
          }
        };

        await addDoc(collection(db, 'users', user.uid, 'history'), historyData);
        console.log("✅ Wynik historii zapisany!");

        // --- NOWOŚĆ: INTELIGENTNY TRENER BŁĘDÓW ---
        // Tylko jeśli użytkownik ma wersję PRO (opcjonalnie, lub zbieramy dane każdemu, a dostęp blokujemy w menu)
        // Dla MVP zbierajmy każdemu, żeby mieli gotową bazę jak kupią PRO.
        
        const batch = writeBatch(db); // Tworzymy paczkę operacji
        let mistakeCount = 0;

        questions.forEach((q, index) => {
          const userAnswerIndex = userAnswers[index];
          // Sprawdzamy czy odpowiedź jest błędna (lub brak odpowiedzi)
          // UWAGA: Zakładamy, że brak odpowiedzi (null) też jest błędem do nauki
          if (q && userAnswerIndex !== q.correctAnswerIndex) {
            mistakeCount++;
            
            // Unikalne ID dokumentu: kategoria_IDpytania (np. "inf03_2024_15")
            // Jeśli examId nie jest podane, używamy 'unknown' (ale powinno być)
            const safeExamId = examId || 'general';
            const docId = `${safeExamId}_${q.id}`;
            
            const mistakeRef = doc(db, 'users', user.uid, 'mistakes', docId);

            // Dane do zapisu/aktualizacji
            batch.set(mistakeRef, {
              questionId: q.id,
              examId: safeExamId, // Żebyśmy wiedzieli z jakiego to działu
              text: q.text,
              answers: q.answers,
              correctAnswerIndex: q.correctAnswerIndex,
              // Media/obrazki też warto zachować jeśli są
              media: (q as any).media || null, 
              
              lastMistakeDate: serverTimestamp(),
              mistakeCount: increment(1), // Zwiększamy licznik błędów o 1
              consecutiveCorrect: 0, // Resetujemy postęp, bo znowu błąd!
            }, { merge: true }); // merge: true łączy dane, nie nadpisuje całego dokumentu
          }
        });

        if (mistakeCount > 0) {
            await batch.commit();
            console.log(`🧠 Trener: Zapisano ${mistakeCount} błędów do bazy.`);
        }

      } catch (error) {
        console.error("❌ Błąd zapisu:", error);
      }
    };

    saveResult();
  }, [user, score, total, mode, examId, questions, userAnswers]);

  // --- UI BEZ ZMIAN (Poniżej) ---
  if (mode === 'onelife') {
    return (
      <View style={styles.darkContainer}>
        <View style={styles.gameOverCard}>
          <Text style={styles.gameOverTitle}>💀 GAME OVER</Text>
          <Text style={styles.streakLabel}>TWOJA SERIA</Text>
          <Text style={styles.streakScore}>{score}</Text>
          <Text style={styles.subText}>
            {score > 10 ? "Niesamowity wynik!" : "Spróbuj pobić ten rekord!"}
          </Text>
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, isPassed ? styles.cardSuccess : styles.cardFail]}>
          <Text style={styles.resultTitle}>{isPassed ? "ZDAŁEŚ!" : "NIEZALICZONY"}</Text>
          <Text style={styles.scoreText}>{score} / {total}</Text>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
        
        {/* Informacja o trenerze */}
        <View style={styles.infoBox}>
            <Text style={styles.infoText}>
                {isPassed 
                    ? "Świetna robota! " 
                    : "Nie martw się! "}
                Błędne odpowiedzi zostały dodane do Twojego Trenera.
            </Text>
        </View>

        <Text style={styles.sectionHeader}>Szczegółowa analiza:</Text>
        {questions.map((q, index) => {
          const userAnswerIndex = userAnswers[index];
          if (!q) return null; 
          const isCorrect = userAnswerIndex === q.correctAnswerIndex;
          const isSkipped = userAnswerIndex === null;
          return (
            <View key={index} style={[styles.questionBox, isCorrect ? styles.boxCorrect : styles.boxWrong]}>
              <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
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
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
          <Text style={styles.buttonText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { padding: 20, paddingBottom: 20 },
  darkContainer: { flex: 1, backgroundColor: '#1c1c1e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  gameOverCard: { alignItems: 'center', marginBottom: 50 },
  gameOverTitle: { fontSize: 40, fontWeight: '900', color: '#FF3B30', marginBottom: 40, letterSpacing: 2 },
  streakLabel: { color: '#888', fontSize: 16, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 10 },
  streakScore: { color: '#fff', fontSize: 120, fontWeight: 'bold', lineHeight: 120 },
  subText: { color: '#666', fontSize: 18, marginTop: 20 },
  retryButton: { backgroundColor: '#FF3B30', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
  retryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  card: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 25, backgroundColor: '#fff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardSuccess: { borderTopWidth: 5, borderTopColor: '#4CAF50' },
  cardFail: { borderTopWidth: 5, borderTopColor: '#F44336' },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  scoreText: { fontSize: 40, fontWeight: 'bold', color: '#333' },
  percentText: { fontSize: 18, color: '#666' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', marginLeft: 5 },
  questionBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  boxCorrect: { borderColor: '#A5D6A7', backgroundColor: '#F1F8E9' },
  boxWrong: { borderColor: '#EF9A9A', backgroundColor: '#FFEBEE' },
  questionText: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
  answerRow: { marginTop: 5 },
  label: { fontSize: 12, color: '#777', fontWeight: 'bold', textTransform: 'uppercase' },
  answerText: { fontSize: 15, fontWeight: '500' },
  textGreen: { color: '#2E7D32', fontWeight: 'bold' },
  textRed: { color: '#C62828', textDecorationLine: 'line-through' },
  textGray: { color: '#777', fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  button: { backgroundColor: '#333', paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  // Nowy styl dla info boxa
  infoBox: { backgroundColor: '#E3F2FD', padding: 10, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#2196F3' },
  infoText: { color: '#0D47A1', textAlign: 'center', fontSize: 14 }
});