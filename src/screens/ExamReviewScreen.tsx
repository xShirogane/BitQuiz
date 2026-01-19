import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ExamReviewScreen({ route, navigation }: any) {
  const { questions, userAnswers, score, total } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <Text style={styles.headerTitle}>Podgląd Testu</Text>
         <Text style={styles.headerScore}>Wynik: {score}/{total}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {questions.map((q: any, index: number) => {
          const userAnswerIndex = userAnswers[index];
          const isCorrect = userAnswerIndex === q.correctAnswerIndex;
          const isSkipped = userAnswerIndex === null;

          return (
            <View key={index} style={[styles.questionBox, isCorrect ? styles.boxCorrect : styles.boxWrong]}>
              <Text style={styles.questionText}>{index + 1}. {q.text}</Text>
              
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

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Zamknij podgląd</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerScore: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  scrollContent: { padding: 20, paddingBottom: 80 },
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
  closeButton: { backgroundColor: '#333', padding: 15, margin: 20, borderRadius: 10, alignItems: 'center' },
  closeButtonText: { color: '#fff', fontWeight: 'bold' }
});