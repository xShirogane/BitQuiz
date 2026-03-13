import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, StatusBar, FlatList, ScrollView, Dimensions, RefreshControl, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Context & Utils
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { QUALIFICATIONS_DATA, Qualification } from '../data/categories';
import { runBackgroundSync } from '../utils/offlineManager';
import { getHistory } from '../utils/historyManager';
import { checkStreakStatus, StreakData } from '../utils/streakManager';
import { getDailyChallenge, DailyChallengeData } from '../utils/dailyChallengeManager';

// Components
import GlowCard from '../components/GlowCard';
import { StreakCard } from '../components/StreakCard';
import { DailyChallengeCard } from '../components/DailyChallengeCard';
import { ExamQuickActionCard } from '../components/ExamQuickActionCard';
import { RecentExamCard } from '../components/RecentExamCard';
import { XPInfoModal } from '../components/XPInfoModal';
import { ExamHistoryEntry } from '../types/statistics';

const { width } = Dimensions.get('window');

const GRADIENT_PALETTE = [
  ['#4facfe', '#00f2fe'], ['#00c6ff', '#0072ff'], ['#43e97b', '#38f9d7'],
  ['#11998e', '#38ef7d'], ['#DA22FF', '#9733EE'], ['#f6d365', '#fda085'],
  ['#fc4a1a', '#f7b733']
];

const getRandomGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) { hash += id.charCodeAt(i); }
  return GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length];
};

export default function QualificationScreen({ navigation }: any) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();
  const [carouselData, setCarouselData] = useState<Qualification[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentExams, setRecentExams] = useState<ExamHistoryEntry[]>([]);
  const [showXPInfo, setShowXPInfo] = useState(false);
  const [challengeData, setChallengeData] = useState<DailyChallengeData | null>(null);

  useFocusEffect(
    useCallback(() => {
      runBackgroundSync();
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const streak = await checkStreakStatus();
      setStreakData(streak);
      await updateExamList();

      // Ładuj wyzwanie dnia (na podstawie ulubionych kwalifikacji ucznia)
      const favQuals = userProfile?.favoriteQualifications;
      const challenge = await getDailyChallenge(favQuals);
      setChallengeData(challenge);
    } catch (e) {
      console.error("Błąd w loadData:", e);
    }
  };

  const updateExamList = async () => {
    const history = await getHistory();
    console.log("Pobrana historia z AsyncStorage:", history);

    // Zapisujemy 4 najnowsze wyniki dla sekcji "Ostatnie wyniki"
    setRecentExams(history.slice(0, 4));

    // --- NAPRAWA KARUZELI "POLECANE" ---

    // 1. Wyciągamy unikalne ID egzaminów z historii (żeby się nie powtarzały na karuzeli)
    const historyExamIds = [...new Set(history.map((h: any) => h.examId))];

    // 2. Szukamy pełnych danych o tych egzaminach w Twojej bazie QUALIFICATIONS_DATA
    const historyQualifications = historyExamIds
      .map(id => QUALIFICATIONS_DATA.find(q => q.id === id))
      .filter(q => q !== undefined) as Qualification[];

    // 3. Uzupełniamy karuzelę do 5 elementów
    if (historyQualifications.length < 5) {
      const needed = 5 - historyQualifications.length;

      // Filtrujemy bazę, odrzucając te egzaminy, które już mamy w historii
      const availablePool = QUALIFICATIONS_DATA.filter(q => !historyExamIds.includes(q.id));

      // Tasujemy resztę, żeby były losowe
      const shuffled = [...availablePool].sort(() => 0.5 - Math.random());

      setCarouselData([...historyQualifications, ...shuffled.slice(0, needed)]);
    } else {
      setCarouselData(historyQualifications.slice(0, 5));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          showsVerticalScrollIndicator={false}
        >

          {/* NAGŁÓWEK */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greetingMsg, { color: theme.text }]}>
                Cześć, {userProfile?.username || 'Uczniu'}! 👋
              </Text>
              <Text style={[styles.subMsg, { color: theme.subText }]}>
                Dziś dobry dzień na naukę.
              </Text>
            </View>

            {/* PRZYCISK PROFILU (Prawy górny róg) */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')} // Zakładam, że tak nazywa się ekran Profilu w nawigacji
              style={[styles.profileBtn, { backgroundColor: theme.card }]}
              activeOpacity={0.8}
            >
              <Ionicons name="person" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* STATYSTYKI I WYZWANIE DNIA */}
          <View style={styles.statsSection}>
            {streakData ? <StreakCard data={streakData} onInfoPress={() => setShowXPInfo(true)} /> : null}
            <DailyChallengeCard
              challenge={challengeData}
              onPress={() => {
                if (!challengeData || challengeData.completed) return;

                switch (challengeData.type) {
                  case 'score_target': {
                    // Pełny egzamin (40 pytań, 60 min)
                    const examData = QUALIFICATIONS_DATA.find(q => q.id === challengeData.examId);
                    navigation.navigate('Exam', {
                      apiUrl: challengeData.apiUrl,
                      limit: 40,
                      time: 60,
                      examData: examData || { id: challengeData.examId, title: challengeData.examTitle },
                    });
                    break;
                  }
                  case 'speed_challenge': {
                    // Szybki test z limitem czasu wyzwania
                    const examData2 = QUALIFICATIONS_DATA.find(q => q.id === challengeData.examId);
                    navigation.navigate('Exam', {
                      apiUrl: challengeData.apiUrl,
                      limit: 10,
                      time: challengeData.maxMinutes,
                      examData: examData2 || { id: challengeData.examId, title: challengeData.examTitle },
                    });
                    break;
                  }
                  case 'multiplayer_win': {
                    const firstExam = carouselData[0] || QUALIFICATIONS_DATA[0];
                    navigation.navigate('MultiplayerSetup', { examData: firstExam });
                    break;
                  }
                  case 'exam_count':
                  case 'question_count':
                  case 'perfect_score':
                  default: {
                    const fallbackExam = carouselData[0] || QUALIFICATIONS_DATA[0];
                    navigation.navigate('Exam', {
                      apiUrl: fallbackExam.apiUrl,
                      limit: 40,
                      time: 60,
                      examData: fallbackExam,
                    });
                    break;
                  }
                }
              }}
            />
          </View>

          {/* POLECANE EGZAMINY (Przeniesione wyżej, zastępują kategorie) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Polecane dla Ciebie</Text>
            </View>

            {carouselData.length > 0 ? (
              <FlatList
                data={carouselData}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
                snapToInterval={width * 0.75 + 16}
                decelerationRate="fast"
                snapToAlignment="start"
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <GlowCard
                    title={item.title}
                    subtitle={item.fullName}
                    iconName={item.iconName || 'school-outline'}
                    colors={getRandomGradient(item.id)}
                    onPress={() => navigation.navigate('ModeSelection', { examData: item })}
                  />
                )}
              />
            ) : (
              <Text style={[styles.emptyText, { color: theme.subText }]}>
                Brak egzaminów.
              </Text>
            )}
          </View>

          {/* SZYBKI START (Dla ostatniego egzaminu) */}
          {carouselData.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="rocket" size={20} color="#5b8fff" style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Szybki start: {carouselData[0].title}
                </Text>
              </View>

              <View style={styles.quickGrid}>
                <ExamQuickActionCard
                  title="Pełny egzamin"
                  subtitle="Symulacja oficjalnego egzaminu"
                  emoji="📋"
                  iconBg="rgba(80,130,255,0.15)"
                  onPress={() => navigation.navigate('Exam', { apiUrl: carouselData[0].apiUrl, limit: 40, time: 60, examData: carouselData[0] })}
                />
                <ExamQuickActionCard
                  title="Tryb nauki"
                  subtitle="Ucz się we własnym tempie"
                  emoji="🎓"
                  iconBg="rgba(160,80,255,0.15)"
                  onPress={() => navigation.navigate('Training', { apiUrl: carouselData[0].apiUrl })}
                />
                <ExamQuickActionCard
                  title="Szybki test"
                  subtitle="20 losowych pytań"
                  emoji="⚡"
                  iconBg="rgba(50,200,120,0.15)"
                  onPress={() => navigation.navigate('Exam', { apiUrl: carouselData[0].apiUrl, limit: 20, time: 30, examData: carouselData[0] })}
                />
                <ExamQuickActionCard
                  title="Pojedynek 1vs1"
                  subtitle="Zagraj z innym uczniem"
                  emoji="⚔️"
                  iconBg="rgba(255,100,80,0.15)"
                  onPress={() => navigation.navigate('MultiplayerSetup', { examData: carouselData[0] })}
                />
              </View>
            </View>
          )}



          {/* OSTATNIE WYNIKI (Zawsze widoczne do testów) */}
          <View style={[styles.section, { marginBottom: 30 }]}>
            <View style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
              <Ionicons name="time" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Twoje ostatnie wyniki</Text>
            </View>

            <View style={styles.recentExamsContainer}>
              {recentExams.length > 0 ? (
                recentExams.map((exam, index) => {
                  const examData = QUALIFICATIONS_DATA.find(q => q.id === exam.examId);
                  const title = examData ? examData.title : (exam.examId || 'Nieznany egzamin');

                  const dateString = exam.timestamp
                    ? new Date(exam.timestamp).toLocaleDateString('pl-PL')
                    : 'Brak daty';

                  return (
                    <RecentExamCard
                      key={index}
                      examName={title}
                      score={exam.score}
                      maxScore={exam.totalQuestions}
                      date={dateString}
                      passed={exam.passed}
                      iconName={examData?.iconName}
                    />
                  );
                })
              ) : (
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                  Nie rozwiązałeś jeszcze żadnego egzaminu.
                </Text>
              )}
            </View>
          </View>

        </ScrollView>
      </View>

      {/* MODAL INFO XP */}
      <XPInfoModal visible={showXPInfo} onClose={() => setShowXPInfo(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20
  },
  greetingMsg: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subMsg: { fontSize: 15, fontWeight: '500' },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridContainer: { paddingHorizontal: 19 },
  row: { flexDirection: 'row', marginBottom: 10 },
  section: { marginTop: 15 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 5
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 100 },
  statsSection: { paddingHorizontal: 24, marginBottom: 10 },
  emptyText: { textAlign: 'center', marginTop: 10 },
  sectionHeaderSpaced: { marginBottom: 10 },
  recentExamsContainer: { paddingHorizontal: 24 },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 10,
  },
});