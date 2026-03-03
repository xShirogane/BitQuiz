import React, { useState, useCallback } from 'react';
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

// Components
import GlowCard from '../components/GlowCard';
import { StreakCard } from '../components/StreakCard';
import { DailyChallengeCard } from '../components/DailyChallengeCard';
import { ProUpgradeCard } from '../components/ProUpgradeCard';
import { QuickActionTile } from '../components/QuickActionTile';
import { ExamQuickActionCard } from '../components/ExamQuickActionCard';

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
    } catch (e) {
      console.error("Błąd w loadData:", e);
    }
  };

  const updateExamList = async () => {
    // Pokaż "Polecane" (Historia + Losowe)
    const history = await getHistory();
    if (history.length < 5) {
      const needed = 5 - history.length;
      const availablePool = QUALIFICATIONS_DATA.filter(q => !history.find((h: any) => h.id === q.id));
      const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
      setCarouselData([...history, ...shuffled.slice(0, needed)]);
    } else {
      setCarouselData(history.slice(0, 5));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
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
        <View style={{ paddingHorizontal: 24, marginBottom: 10 }}>
           {streakData ? <StreakCard data={streakData} /> : null}
           <DailyChallengeCard />
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
              <Text style={{ textAlign: 'center', color: theme.subText, marginTop: 20 }}>
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
                subtitle="10 losowych pytań" 
                emoji="⚡" 
                iconBg="rgba(50,200,120,0.15)" 
                onPress={() => navigation.navigate('Exam', { apiUrl: carouselData[0].apiUrl, limit: 10, time: 15, examData: carouselData[0] })} 
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

         {/* SZYBKIE AKCJE */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, {marginBottom: 10}]}>
             <Ionicons name="flash" size={20} color="#FF9800" style={{ marginRight: 8 }} />
             <Text style={[styles.sectionTitle, { color: theme.text }]}>Szybkie akcje</Text>
          </View>

          {/* KARTA PRO */}
          <ProUpgradeCard onPress={() => navigation.navigate('Settings')} />
          
          <View style={styles.gridContainer}>
            <View style={styles.row}>
              <QuickActionTile 
                title="Sklep" 
                description="Wydaj punkty" 
                iconName="cart" 
                color="#E040FB" 
                onPress={() => navigation.navigate('Sklep')} 
              />
              <QuickActionTile 
                title="Aktualności" 
                description="Co nowego?" 
                iconName="newspaper" 
                color="#FF9800" 
                onPress={() => navigation.navigate('Aktualności')}
              />
            </View>

            <View style={styles.row}>
              <QuickActionTile 
                title="Wesprzyj nas" 
                description="Postaw kawę" 
                iconName="cafe" 
                color="#F44336" 
                onPress={() => navigation.navigate('Wsparcie❤️')} 
              />
              <QuickActionTile 
                title="Kontakt" 
                description="Napisz do nas" 
                iconName="chatbubbles" 
                color="#2196F3" 
                onPress={() => navigation.navigate('Kontakt')} 
              />
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 10,
  },
});