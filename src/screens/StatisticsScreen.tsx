import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useExamStats } from '../hooks/useExamStats'; 
import { ExamHistoryEntry } from '../types/statistics';

// Definicja typów dla parametrów nawigacji
type StatisticsRouteParams = {
  Statistics: {
    examId?: string;
    schoolId?: string;
    id?: string;
    title?: string;
    examData?: {
      id: string;
      title?: string;
      schoolIds?: string[];
    }
  };
};

const StatisticsScreen = () => {
  const { theme, isDark } = useTheme(); 
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StatisticsRouteParams, 'Statistics'>>();

  // 1. INTELIGENTNE WYKRYWANIE ID (POPRAWIONE)
  const params = route.params || {};
  
  // Używamy optional chaining (?.) zamiast || {}, co eliminuje błąd TypeScript
  const rawId = params.examId || params.schoolId || params.id || params.examData?.id;
  const rawTitle = params.title || params.examData?.title;

  const examId = rawId || null;
  const examTitle = rawTitle || (examId ? examId.toUpperCase() : 'Statystyki');

  // Logowanie diagnostyczne
  useEffect(() => {
    console.log('[StatisticsScreen] Otrzymane parametry:', JSON.stringify(params, null, 2));
    console.log('[StatisticsScreen] Finalne ID:', examId);
  }, [params]);

  const { history, stats, loading } = useExamStats(user?.uid, examId || '');

  // ... (RESZTA PLIKU BEZ ZMIAN - skopiuj resztę od tego momentu z poprzedniej wersji)
  // Jeśli nie masz reszty pod ręką, poniżej wklejam resztę pliku dla pewności:

  // --- DANE DO WYKRESU ---
  const pieData = [
    { value: stats.questionsKnown, color: theme.success || '#4CAF50', text: '' },
    { value: stats.questionsMistakes, color: theme.danger || '#F44336', text: '' },
    { value: stats.questionsToDiscover, color: isDark ? '#334155' : '#E0E0E0', text: '' }
  ];
  
  const totalDiscovered = stats.questionsKnown + stats.questionsMistakes + stats.questionsToDiscover;
  const masteryPercent = totalDiscovered > 0 
    ? Math.round((stats.questionsKnown / totalDiscovered) * 100) 
    : 0;

  const formatTime = (seconds: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const StatBox = ({ icon, color, value, label }: any) => (
    <View style={[styles.smallTile, { backgroundColor: theme.card }]}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 4 }} />
      <Text style={[styles.midValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.miniLabel, { color: theme.subText }]}>{label}</Text>
    </View>
  );

  const LegendItem = ({ color, label, value, textColor }: any) => (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View>
        <Text style={{ color: textColor, fontWeight: 'bold' }}>{value}</Text>
        <Text style={{ color: textColor, opacity: 0.7, fontSize: 10 }}>{label}</Text>
      </View>
    </View>
  );

  // --- OBSŁUGA BŁĘDÓW ---
  if (!examId) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, padding: 20 }]}>
        <Ionicons name="alert-circle" size={50} color={theme.danger} />
        <Text style={{ color: theme.text, marginTop: 10, textAlign: 'center' }}>
          Nie udało się pobrać ID egzaminu.
        </Text>
        <Text style={{ color: theme.subText, marginTop: 5, fontSize: 12 }}>
          Spróbuj wrócić i wejść ponownie.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.primary, fontSize: 16 }}>Wróć</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.customHeader, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text },]}>{examTitle}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Baza Pytań</Text>
          
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <PieChart
              data={pieData}
              donut
              showGradient
              sectionAutoFocus
              radius={90}
              innerRadius={65}
              innerCircleColor={theme.card}
              centerLabelComponent={() => (
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.text }}>
                    {masteryPercent}%
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.subText }}>Opanowania</Text>
                </View>
              )}
            />
          </View>

          <View style={styles.legendContainer}>
            <LegendItem color={theme.success || '#4CAF50'} label="Znane" value={stats.questionsKnown} textColor={theme.text} />
            <LegendItem color={theme.danger || '#F44336'} label="Błędne" value={stats.questionsMistakes} textColor={theme.text} />
            <LegendItem color={isDark ? '#334155' : '#E0E0E0'} label="Do odkrycia" value={stats.questionsToDiscover} textColor={theme.text} />
          </View>
        </View>

        <Text style={[styles.header, { color: theme.text }]}>Postępy w egzaminach</Text>

        <View style={[styles.rowCard, { backgroundColor: theme.card }]}>
          <View style={styles.statColumn}>
            <Text style={[styles.bigValue, { color: theme.text }]}>{stats.totalExams}</Text>
            <Text style={[styles.label, { color: theme.subText }]}>Podejścia</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statColumn}>
            <Text style={[styles.bigValue, { color: theme.success }]}>{stats.passedCount}</Text>
            <Text style={[styles.label, { color: theme.subText }]}>Zdane</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statColumn}>
            <Text style={[styles.bigValue, { color: theme.danger }]}>{stats.failedCount}</Text>
            <Text style={[styles.label, { color: theme.subText }]}>Niezdane</Text>
          </View>
        </View>

        <View style={styles.threeColsContainer}>
          <StatBox icon="trophy" color="#FFC107" value={`${stats.bestScore}/40`} label="Najlepszy" />
          <StatBox icon="stats-chart" color="#2196F3" value={stats.averageScore} label="Średnia" />
          <StatBox icon="warning" color="#FF5722" value={`${stats.worstScore}/40`} label="Najgorszy" />
        </View>

        <View style={[styles.rowCard, { backgroundColor: theme.card, justifyContent: 'flex-start', paddingHorizontal: 20 }]}>
          <View style={[styles.iconBox, { backgroundColor: '#E0F7FA' }]}>
            <Ionicons name="timer-outline" size={24} color="#00BCD4" />
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={[styles.bigValue, { color: theme.text, fontSize: 20 }]}>
              {formatTime(stats.averageTimeSeconds)}
            </Text>
            <Text style={[styles.label, { color: theme.subText }]}>Średni czas egzaminu</Text>
          </View>
        </View>

        <Text style={[styles.header, { color: theme.text, marginTop: 20 }]}>Historia Egzaminów</Text>
        
        {history.length === 0 ? (
          <Text style={{ textAlign: 'center', color: theme.subText, marginTop: 20 }}>
            Brak historii dla tej kwalifikacji.
          </Text>
        ) : (
          history.map((exam: ExamHistoryEntry, index: number) => (
            <TouchableOpacity
              key={exam.id || index}
              style={[styles.historyItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('ExamReviewScreen', { result: exam })}
            >
              <View style={[styles.statusStrip, { backgroundColor: exam.passed ? (theme.success || '#4CAF50') : (theme.danger || '#F44336') }]} />
              <View style={styles.historyContent}>
                <View>
                  <Text style={[styles.historyDate, { color: theme.text }]}>
                    {new Date(exam.timestamp).toLocaleDateString()} • {new Date(exam.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.historyScore, { color: exam.passed ? (theme.success || '#4CAF50') : (theme.danger || '#F44336') }]}>
                    {exam.score} / {exam.totalQuestions} pkt
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.subText} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  customHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 20, paddingBottom: 15, paddingHorizontal: 16, borderBottomWidth: 1
  },

  headerTitle: { fontSize: 25, fontWeight: 'bold', textAlign: 'center', flex: 1, paddingLeft: 30 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  card: { padding: 20, borderRadius: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  rowCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 1 },
  statColumn: { alignItems: 'center', flex: 1 },
  divider: { width: 1, height: '80%', backgroundColor: '#E0E0E0' },
  bigValue: { fontSize: 22, fontWeight: 'bold' },
  label: { fontSize: 12, marginTop: 4 },
  threeColsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  smallTile: { width: '31%', paddingVertical: 15, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  midValue: { fontSize: 18, fontWeight: 'bold' },
  miniLabel: { fontSize: 11, marginTop: 2 },
  iconBox: { padding: 10, borderRadius: 12 },
  historyItem: { flexDirection: 'row', marginBottom: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, height: 70 },
  statusStrip: { width: 6, height: '100%' },
  historyContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  historyDate: { fontSize: 12, opacity: 0.7, marginBottom: 4 },
  historyScore: { fontWeight: 'bold', fontSize: 15 }
});

export default StatisticsScreen;