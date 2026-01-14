import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackParamList } from '../../App'; // Import typów (opcjonalny, ale dobra praktyka)
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Definicja typów dla propsów (dla TypeScripta)
type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  // Odbieramy bogatszy zestaw danych
  const { score, total, questions, userAnswers } = route.params;

  const percentage = Math.round((score / total) * 100);
  const isPassed = percentage >= 50;

  return (
    <View style={styles.container}>
      {/* ScrollView pozwala przewijać zawartość, gdy jest jej dużo */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- SEKCJA GŁÓWNA (WYNIK) --- */}
        <View style={[styles.card, isPassed ? styles.cardSuccess : styles.cardFail]}>
          <Text style={styles.resultTitle}>
            {isPassed ? "ZDAŁEŚ!" : "NIEZALICZONY"}
          </Text>
          <Text style={styles.scoreText}>{score} / {total}</Text>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>

        <Text style={styles.sectionHeader}>Szczegółowa analiza:</Text>

        {/* --- LISTA PYTAŃ --- */}
        {questions.map((q, index) => {
          const userAnswerIndex = userAnswers[index];
          const isCorrect = userAnswerIndex === q.correctAnswerIndex;
          const isSkipped = userAnswerIndex === null;

          return (
            <View key={index} style={[styles.questionBox, isCorrect ? styles.boxCorrect : styles.boxWrong]}>
              
              {/* Treść pytania */}
              <Text style={styles.questionText}>
                {index + 1}. {q.text}
              </Text>

              {/* Twoja odpowiedź */}
              <View style={styles.answerRow}>
                <Text style={styles.label}>Twoja odp:</Text>
                <Text style={[
                  styles.answerText, 
                  isCorrect ? styles.textGreen : styles.textRed,
                  isSkipped && styles.textGray
                ]}>
                  {isSkipped 
                    ? "(Brak odpowiedzi)" 
                    : `${String.fromCharCode(65 + userAnswerIndex!)}. ${q.answers[userAnswerIndex!]}`}
                </Text>
              </View>

              {/* Poprawna odpowiedź (pokazujemy tylko jeśli użytkownik się pomylił) */}
              {!isCorrect && (
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

        {/* Pusty element na dole, żeby przycisk nie zasłaniał ostatniego pytania */}
        <View style={{ height: 80 }} />

      </ScrollView>

      {/* --- PRZYCISK POWROTU (Pływający na dole) --- */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.buttonText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  // Style karty głównej (bez zmian)
  card: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardSuccess: { borderTopWidth: 5, borderTopColor: '#4CAF50' },
  cardFail: { borderTopWidth: 5, borderTopColor: '#F44336' },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  scoreText: { fontSize: 40, fontWeight: 'bold', color: '#333' },
  percentText: { fontSize: 18, color: '#666' },

  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    marginLeft: 5,
  },

  // Style poszczególnych pytań w liście
  questionBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  boxCorrect: {
    borderColor: '#A5D6A7', // Jasny zielony obrys
    backgroundColor: '#F1F8E9',
  },
  boxWrong: {
    borderColor: '#EF9A9A', // Jasny czerwony obrys
    backgroundColor: '#FFEBEE',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  answerRow: {
    marginTop: 5,
  },
  label: {
    fontSize: 12,
    color: '#777',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  answerText: {
    fontSize: 15,
    fontWeight: '500',
  },
  textGreen: { color: '#2E7D32', fontWeight: 'bold' },
  textRed: { color: '#C62828', textDecorationLine: 'line-through' },
  textGray: { color: '#777', fontStyle: 'italic' },

  // Pływający przycisk na dole
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});