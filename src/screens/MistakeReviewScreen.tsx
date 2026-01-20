import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Upewnij się, że masz expo-vector-icons (standard w Expo)

type Props = NativeStackScreenProps<RootStackParamList, 'MistakeReview'>;

interface MistakeQuestion {
  docId: string; // ID dokumentu w Firebase (potrzebne do usuwania)
  questionId: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
  consecutiveCorrect: number; // Ile razy już odpowiedziano dobrze
}

export default function MistakeReviewScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<MistakeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1. Pobieranie błędów z Firestore
  useEffect(() => {
    const fetchMistakes = async () => {
      if (!user) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'mistakes'));
        const loadedQuestions: MistakeQuestion[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          loadedQuestions.push({
            docId: doc.id,
            questionId: data.questionId,
            text: data.text,
            answers: data.answers,
            correctAnswerIndex: data.correctAnswerIndex,
            consecutiveCorrect: data.consecutiveCorrect || 0,
          });
        });

        // Mieszamy kolejność, żeby nie było nudno (opcjonalne)
        setQuestions(loadedQuestions.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error("Błąd pobierania błędów:", error);
        Alert.alert("Błąd", "Nie udało się pobrać pytań do poprawy.");
      } finally {
        setLoading(false);
      }
    };

    fetchMistakes();
  }, [user]);

  // 2. Obsługa wyboru odpowiedzi
  const handleAnswer = async (index: number) => {
    if (isAnswerChecked) return; // Blokada podwójnego kliknięcia
    setSelectedAnswer(index);
    setIsAnswerChecked(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correctAnswerIndex;
    const mistakeRef = doc(db, 'users', user!.uid, 'mistakes', currentQ.docId);

    if (isCorrect) {
      const newConsecutive = currentQ.consecutiveCorrect + 1;
      
      // LOGIKA: Wymagamy 2 poprawnych odpowiedzi, żeby usunąć
      if (newConsecutive >= 2) {
        setStatusMessage("🎉 Brawo! Pytanie opanowane i usunięte.");
        await deleteDoc(mistakeRef);
      } else {
        setStatusMessage("Dobrze! Jeszcze raz i zniknie.");
        await updateDoc(mistakeRef, {
          consecutiveCorrect: newConsecutive
        });
      }
    } else {
      setStatusMessage("❌ Błąd. Licznik postępu zresetowany.");
      await updateDoc(mistakeRef, {
        consecutiveCorrect: 0,
        mistakeCount: increment(1)
      });
    }

    // Automatyczne przejście dalej po 1.5 sekundy
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setStatusMessage(null);
    } else {
      // Koniec sesji
      Alert.alert("Koniec treningu!", "Przejrzałeś wszystkie zaległości na teraz.", [
        { text: "Wróć do menu", onPress: () => navigation.goBack() }
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Szukam Twoich błędów...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle-outline" size={80} color="#4CAF50" />
        <Text style={styles.emptyTitle}>Czysto!</Text>
        <Text style={styles.emptyText}>Nie masz żadnych pytań do poprawy. Świetna robota!</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <View style={styles.container}>
      {/* Pasek postępu */}
      <View style={styles.header}>
        <Text style={styles.counterText}>
          Pytanie {currentIndex + 1} / {questions.length}
        </Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>
             Postęp: {currentQ.consecutiveCorrect}/2
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.questionText}>{currentQ.text}</Text>
        </View>

        <View style={styles.answersContainer}>
          {currentQ.answers.map((ans, idx) => {
            // Logika kolorowania przycisków po sprawdzeniu
            let btnStyle = styles.answerButton;
            if (isAnswerChecked) {
              if (idx === currentQ.correctAnswerIndex) btnStyle = styles.answerCorrect;
              else if (idx === selectedAnswer) btnStyle = styles.answerWrong;
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[btnStyle, isAnswerChecked && idx !== currentQ.correctAnswerIndex && idx !== selectedAnswer && { opacity: 0.5 }]}
                onPress={() => handleAnswer(idx)}
                disabled={isAnswerChecked}
              >
                <Text style={[
                    styles.answerText, 
                    isAnswerChecked && (idx === currentQ.correctAnswerIndex || idx === selectedAnswer) && { color: '#fff', fontWeight: 'bold' }
                ]}>
                  {String.fromCharCode(65 + idx)}. {ans}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Komunikat statusu */}
        {statusMessage && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  counterText: { fontSize: 16, fontWeight: '600', color: '#666' },
  streakBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  streakText: { color: '#2196F3', fontWeight: 'bold', fontSize: 12 },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  questionText: { fontSize: 18, fontWeight: '600', color: '#333', lineHeight: 26 },
  answersContainer: { gap: 12 },
  answerButton: { backgroundColor: '#fff', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  answerCorrect: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  answerWrong: { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
  answerText: { fontSize: 16, color: '#333' },
  statusBox: { marginTop: 30, padding: 15, borderRadius: 8, backgroundColor: '#333', alignItems: 'center' },
  statusText: { color: '#fff', fontWeight: 'bold' },
  emptyTitle: { fontSize: 28, fontWeight: 'bold', marginVertical: 10, color: '#333' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 25 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});