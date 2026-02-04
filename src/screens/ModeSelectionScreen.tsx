import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // <--- WAŻNE: Do odświeżania

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveToHistory } from '../utils/historyManager';
import { getStatsForExam, ExamStats } from '../utils/statisticsManager'; // <--- Import logiki

export default function ModeSelectionScreen({ route, navigation }: any) {
  const { examData } = route.params;
  const { userProfile } = useAuth();
  const { theme } = useTheme();

  // Stan na statystyki (domyślnie zera)
  const [stats, setStats] = useState<ExamStats>({
    solvedQuestions: 0,
    averageAccuracy: 0,
    bestScore: '0/0'
  });

  // 1. Zapis historii + Pobranie świeżych statystyk przy każdym wejściu
  useFocusEffect(
    useCallback(() => {
      // Zapisz, że tu byliśmy
      if (examData) saveToHistory(examData);

      // Pobierz prawdziwe dane
      const loadStats = async () => {
        const data = await getStatsForExam(examData.id);
        setStats(data);
      };
      loadStats();
    }, [examData])
  );

  // --- WIDGET STATYSTYK (TERAZ KLIKALNY!) ---
  const StatsWidget = () => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Statistics', { filterId: examData.id })} // Przekazujemy ID do filtrowania
    >
      <View style={[styles.statsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15}}>
           <Text style={[styles.statsHeader, { color: theme.subText, marginBottom: 0, marginRight: 5 }]}>
             TWOJE WYNIKI ({examData.title})
           </Text>
           <Ionicons name="chevron-forward" size={12} color={theme.subText} />
        </View>
        
        <View style={styles.statsRow}>
          {/* 1. Rozwiązane Pytania */}
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.solvedQuestions}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Rozwiązane</Text>
          </View>

          {/* Separator */}
          <View style={[styles.vertLine, { backgroundColor: theme.border }]} />

          {/* 2. Skuteczność */}
          <View style={styles.statBox}>
            <Ionicons name="pie-chart-outline" size={24} color={stats.averageAccuracy > 50 ? (theme.success || '#10B981') : (theme.danger || '#EF4444')} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.averageAccuracy}%</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Poprawne</Text>
          </View>

          {/* Separator */}
          <View style={[styles.vertLine, { backgroundColor: theme.border }]} />

          {/* 3. Najlepszy Egzamin */}
          <View style={styles.statBox}>
            <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.bestScore}</Text>
            <Text style={[styles.statLabel, { color: theme.subText }]}>Rekord</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Helper dla przycisków
  const ModeCard = ({ title, desc, color, icon, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.cardDesc, { color: theme.subText }]}>{desc}</Text>
        </View>
        <Ionicons name={icon} size={28} color={color} style={{ opacity: 0.8 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      
      <Text style={[styles.title, { color: theme.text }]}>Wybierz tryb nauki</Text>
      <Text style={[styles.subtitle, { color: theme.subText }]}>{examData.fullName}</Text>

      {/* Wyświetlamy widget */}
      <StatsWidget />

      <View style={styles.modesList}>
        <ModeCard 
          title="🎓 Egzamin Zawodowy"
          desc="40 pytań • 60 minut • Oficjalny format"
          color="#007AFF"
          icon="clipboard-outline"
          onPress={() => navigation.navigate('Exam', { examData, mode: 'exam', limit: 40, time: 60, title: 'Egzamin Zawodowy' })}
        />

        <ModeCard 
          title="⚡ Test Skrócony"
          desc="20 pytań • 30 minut • Szybka powtórka"
          color="#FF9500"
          icon="flash-outline"
          onPress={() => navigation.navigate('Exam', { examData, mode: 'short', limit: 20, time: 30, title: 'Szybka Powtórka' })}
        />

        <ModeCard 
          title="📚 Tryb Nauki"
          desc="Bez stresu • Natychmiastowe odpowiedzi"
          color="#34C759"
          icon="book-outline"
          onPress={() => navigation.navigate('Training', { examData })}
        />

        {userProfile?.isPro && (
          <ModeCard 
            title="💎 Trener Błędów"
            desc="Tylko to, co sprawia Ci trudność"
            color="#FFD700"
            icon="construct-outline"
            onPress={() => navigation.navigate('MistakeReview')}
          />
        )}

        <ModeCard 
          title="💀 Nagła Śmierć"
          desc="Jeden błąd i koniec gry"
          color="#FF3B30"
          icon="skull-outline"
          onPress={() => navigation.navigate('OneLife', { examData })}
        />

        <ModeCard 
          title="⚔️ Pojedynek 1vs1"
          desc="Zagraj ze znajomym na jednym telefonie"
          color="#9C27B0"
          icon="people-outline"
          onPress={() => navigation.navigate('MultiplayerSetup', { examData })}
        />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, marginTop: 10 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 25, fontWeight: '500' },
  
  // Style Widgetu
  statsContainer: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  statsHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  vertLine: {
    width: 1,
    height: 30,
    backgroundColor: '#ccc',
  },

  modesList: { gap: 15 },
  card: { 
    padding: 20, 
    borderRadius: 16, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 4, 
    shadowOffset: { width: 0, height: 2 }, 
    borderLeftWidth: 5 
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { fontSize: 13 },
});