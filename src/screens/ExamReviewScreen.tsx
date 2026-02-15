import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ExamHistoryEntry } from '../types/statistics';

const ExamReviewScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  
  // Pobieramy wynik przekazany z ekranu statystyk
  const result: ExamHistoryEntry = route.params?.result;

  if (!result) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Błąd ładowania wyników.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Podgląd Egzaminu</Text>
          <Text style={[styles.headerDate, { color: theme.subText }]}>
            {new Date(result.timestamp).toLocaleString()}
          </Text>
        </View>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Podsumowanie */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.score, { color: result.passed ? theme.success : theme.danger }]}>
            {result.score} / {result.totalQuestions}
          </Text>
          <Text style={[styles.status, { color: theme.subText }]}>
            {result.passed ? 'Egzamin Zdany' : 'Egzamin Niezdany'}
          </Text>
        </View>

        {/* Lista Pytań */}
        <Text style={[styles.sectionHeader, { color: theme.text }]}>Szczegóły pytań:</Text>
        
        {result.answers?.map((item, index) => (
          <View key={index} style={[styles.questionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.questionHeader}>
              <Text style={[styles.qIndex, { color: theme.subText }]}>#{index + 1}</Text>
              {item.isCorrect ? (
                <Ionicons name="checkmark-circle" size={24} color={theme.success} />
              ) : (
                <Ionicons name="close-circle" size={24} color={theme.danger} />
              )}
            </View>
            
            <Text style={[styles.questionText, { color: theme.text }]}>{item.questionText}</Text>

            {/* Odpowiedzi */}
            <View style={styles.answersContainer}>
               {/* Jeśli odpowiedź była błędna, pokazujemy co wybrał użytkownik */}
               {!item.isCorrect && item.userAnswerIndex !== null && (
                 <View style={styles.answerRow}>
                   <Text style={[styles.label, { color: theme.danger }]}>Twoja odpowiedź:</Text>
                   <Text style={[styles.answerText, { color: theme.text }]}>
                     {item.answerOptions ? item.answerOptions[item.userAnswerIndex] : 'Błąd danych'}
                   </Text>
                 </View>
               )}

               {/* Zawsze pokazujemy poprawną odpowiedź */}
               <View style={styles.answerRow}>
                 <Text style={[styles.label, { color: theme.success }]}>Poprawna odpowiedź:</Text>
                 <Text style={[styles.answerText, { color: theme.text }]}>
                   {item.correctAnswerIndex !== null && item.answerOptions 
                      ? item.answerOptions[item.correctAnswerIndex] 
                      : 'Nieznana'}
                 </Text>
               </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50, // na status bar
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  headerDate: { fontSize: 12, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  score: { fontSize: 32, fontWeight: 'bold' },
  status: { fontSize: 16, marginTop: 4 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  questionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  qIndex: { fontWeight: 'bold' },
  questionText: { fontSize: 16, marginBottom: 12, lineHeight: 22 },
  answersContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  answerRow: { marginBottom: 6 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  answerText: { fontSize: 14 },
});

export default ExamReviewScreen;