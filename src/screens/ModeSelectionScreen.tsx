import React, { useEffect } from 'react'; // <--- Dodano useEffect
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveToHistory } from '../utils/historyManager'; // <--- Dodano import funkcji zapisu

export default function ModeSelectionScreen({ route, navigation }: any) {
  const { examData } = route.params;
  const { userProfile } = useAuth();
  const { theme } = useTheme();

  // --- LOGIKA ZAPISU DO HISTORII ---
  useEffect(() => {
    if (examData) {
      saveToHistory(examData);
    }
  }, [examData]);
  // ---------------------------------

  // Helper dla karty (Bez zmian)
  const ModeCard = ({ title, desc, color, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderLeftColor: color }]}
      onPress={onPress}
    >
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.cardDesc, { color: theme.subText }]}>{desc}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      
      <Text style={[styles.title, { color: theme.text }]}>Wybierz tryb nauki</Text>
      <Text style={[styles.subtitle, { color: theme.subText }]}>{examData.id.toUpperCase()}</Text>

      <ModeCard 
        title="🎓 Egzamin Zawodowy"
        desc="40 pytań • 60 minut • Wynik na końcu"
        color="#007AFF"
        // Upewnij się, że w App.tsx masz ekran 'Exam' lub 'Home' obsługujący te parametry.
        // W poprzednich krokach sugerowałem nazwę 'Exam', ale zostawiam Twój kod:
        onPress={() => navigation.navigate('Exam', { examData, mode: 'exam', limit: 40, time: 60, title: 'Egzamin Zawodowy' })}
      />

      <ModeCard 
        title="⚡ Test Skrócony"
        desc="20 pytań • 30 minut • Wynik na końcu"
        color="#FF9500"
        onPress={() => navigation.navigate('Exam', { examData, mode: 'short', limit: 20, time: 30, title: 'Szybka Powtórka' })}
      />

      <ModeCard 
        title="📚 Tryb Nauki"
        desc="Po jednym pytaniu • Natychmiastowe odpowiedzi"
        color="#34C759"
        onPress={() => navigation.navigate('TrainingScreen', { examData })}
      />

      {userProfile?.isPro && (
        <ModeCard 
          title="💎 Trener Błędów"
          desc="Inteligentna powtórka • Tylko twoje pomyłki"
          color="#FFD700"
          onPress={() => navigation.navigate('MistakeReview')}
        />
      )}

      <ModeCard 
        title="💀 Nagła Śmierć"
        desc="0 błędów • Liczy się seria • Hardcore"
        color="#FF3B30"
        onPress={() => navigation.navigate('OneLifeScreen', { examData })}
      />

      <ModeCard 
        title="⚔️ Pojedynek 1vs1"
        desc="Zagraj ze znajomym • Czas rzeczywisty"
        color="#9C27B0"
        onPress={() => navigation.navigate('MultiplayerSetup', { examData })}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, marginTop: 10 },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  
  card: { padding: 25, borderRadius: 16, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, borderLeftWidth: 6 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  cardDesc: { fontSize: 14 },
});