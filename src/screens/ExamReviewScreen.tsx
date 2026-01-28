import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // <--- Theme
import MultiplayerGameScreen from './MultiplayerGameScreen';
import MultiplayerSetupScreen from './MultiplayerSetupScreen';
import QualificationScreen from './QualificationScreen';
import StatisticsScreen from './StatisticsScreen';

export default function ExamReviewScreen({ route, navigation }: any) {
  const { questions, userAnswers, score, total } = route.params;
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
         <Text style={[styles.headerTitle, { color: theme.text }]}>Podgląd Testu</Text>
         <Text style={[styles.headerScore, { color: theme.primary }]}>Wynik: {score}/{total}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {questions.map((q: any, index: number) => {
          const userAnswerIndex = userAnswers[index];
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
      </ScrollView>

      <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.card }]} onPress={() => navigation.goBack()}>
        <Text style={[styles.closeButtonText, { color: theme.text }]}>Zamknij podgląd</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerScore: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 80 },
  questionBox: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  questionText: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  answerRow: { marginTop: 5 },
  label: { fontSize: 12, color: '#777', fontWeight: 'bold', textTransform: 'uppercase' },
  answerText: { fontSize: 15, fontWeight: '500' },
  textGreen: { color: '#2E7D32', fontWeight: 'bold' },
  textRed: { color: '#C62828', textDecorationLine: 'line-through' },
  textGray: { color: '#777', fontStyle: 'italic' },
  closeButton: { padding: 15, margin: 20, borderRadius: 10, alignItems: 'center' },
  closeButtonText: { fontWeight: 'bold' }
});