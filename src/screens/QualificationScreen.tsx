import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

// Tutaj definiujemy dostępne egzaminy.
// Możesz tu łatwo dodać kolejne, np. EE.08, INF.04 itd.
const EXAMS = [
  { 
    id: 'inf03', 
    title: 'Technik Informatyk (INF.03)', 
    description: 'Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych.',
    // Twój link do pytań INF.03:
    apiUrl: "https://gist.githubusercontent.com/xShirogane/4891f45cdabb89fd31f56d38e2a42d3f/raw/questions.json" 
  },
  { 
    id: 'inf02', 
    title: 'Technik Informatyk (INF.02)', 
    description: 'Administracja i eksploatacja systemów komputerowych, urządzeń peryferyjnych...',
    // Tymczasowo ten sam link, dopóki nie dodasz nowej bazy
    apiUrl: "https://gist.githubusercontent.com/xShirogane/4891f45cdabb89fd31f56d38e2a42d3f/raw/questions.json" 
  },
];

export default function QualificationScreen({ navigation }: any) {
  
  const handleSelectExam = (exam: any) => {
    // --- ZMIANA ---
    // Zamiast od razu do 'Home', idziemy do ekranu wyboru trybu ('ModeSelection').
    // Przekazujemy tam obiekt 'examData', żeby kolejne ekrany wiedziały, co wybrałeś.
    navigation.navigate('ModeSelection', { examData: exam });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Wybierz Kwalifikację</Text>
      <Text style={styles.headerSubtitle}>Z czego chcesz się sprawdzić?</Text>

      <View style={styles.list}>
        {EXAMS.map((exam) => (
          <TouchableOpacity 
            key={exam.id} 
            style={styles.card} 
            onPress={() => handleSelectExam(exam)}
          >
            <View style={styles.iconPlaceholder}>
              <Text style={styles.iconText}>{exam.id.toUpperCase()}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{exam.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {exam.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 40, marginBottom: 5 },
  headerSubtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  list: { gap: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 15
  },
  iconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: { color: '#007AFF', fontWeight: '900', fontSize: 14 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  description: { fontSize: 12, color: '#888' },
});