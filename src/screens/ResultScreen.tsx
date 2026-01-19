import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { score, total, questions, userAnswers, mode, examId } = route.params; // upewnij się, że odbierasz examId
  
  const { user } = useAuth();
  const savedRef = useRef(false);

  useEffect(() => {
    const saveResult = async () => {
      if (!user || savedRef.current) return;
      savedRef.current = true;

      try {
        // Przygotowujemy dane do zapisu (zapisujemy też pytania i odpowiedzi!)
        // UWAGA: Firestore ma limity, ale tekstowe pytania zajmują mało miejsca.
        const historyData = {
          score: score,
          total: total,
          percentage: total > 0 ? Math.round((score / total) * 100) : 0,
          mode: mode || 'standard',
          date: serverTimestamp(),
          examId: examId,
          // NOWOŚĆ: Zapisujemy szczegóły dla podglądu
          details: {
            questions: questions, // Zapisujemy całą tablicę pytań
            userAnswers: userAnswers // I odpowiedzi użytkownika
          }
        };

        await addDoc(collection(db, 'users', user.uid, 'history'), historyData);
        console.log("✅ Wynik ze szczegółami zapisany!");
      } catch (error) {
        console.error("❌ Błąd zapisu historii:", error);
      }
    };

    saveResult();
  }, [user, score, total, mode, examId, questions, userAnswers]);

  // --- Reszta kodu bez zmian (skopiowana z Twojego pliku) ---
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
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});