import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, StatusBar, FlatList, ScrollView, Dimensions, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Context & Utils
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { QUALIFICATIONS_DATA, Qualification } from '../data/categories';
import { runBackgroundSync } from '../utils/offlineManager';
import { getHistory } from '../utils/historyManager';

// --- WAŻNE: Importujemy checkStreakStatus (tylko odczyt), a nie updateStreak ---
import { checkStreakStatus, StreakData } from '../utils/streakManager';
import { StreakCard } from '../components/StreakCard';

// Components
import GlowCard from '../components/GlowCard';

const { width } = Dimensions.get('window');

// 1. DEFINICJA PALETY KOLORÓW (Tablica gradientów)
const GRADIENT_PALETTE = [
  // --- NIEBIESKIE & MORSKIE ---
  ['#4facfe', '#00f2fe'], 
  ['#00c6ff', '#0072ff'], 
  ['#43e97b', '#38f9d7'], 
  ['#11998e', '#38ef7d'], 
  ['#13547a', '#80d0c7'], 
  ['#4c669f', '#3b5998', '#192f6a'], 

  // --- FIOLETY & RÓŻE ---
  ['#667eea', '#764ba2'], 
  ['#c471f5', '#fa71cd'], 
  ['#b721ff', '#21d4fd'], 
  ['#a18cd1', '#fbc2eb'], 
  ['#DA22FF', '#9733EE'], 

  // --- CIEPŁE ---
  ['#fa709a', '#fee140'], 
  ['#ff9a9e', '#fecfef'], 
  ['#ff0844', '#ffb199'], 
  ['#f6d365', '#fda085'], 
  ['#fc4a1a', '#f7b733'], 

  // --- CIEMNE ---
  ['#0f2027', '#203a43', '#2c5364'], 
  ['#232526', '#414345'], 
  ['#434343', '#000000'], 
  ['#cc2b5e', '#753a88'], 
];

// 2. FUNKCJA LOSUJĄCA
const getRandomGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash += id.charCodeAt(i);
  }
  return GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length];
};

export default function QualificationScreen({ navigation }: any) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();

  // Stan na dane do karuzeli
  const [carouselData, setCarouselData] = useState<Qualification[]>([]);
  // Stan na dane o serii (Streak)
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  // Stan odświeżania (pull-to-refresh)
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      runBackgroundSync();
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // 1. Ładowanie Serii - używamy checkStreakStatus (nie nalicza, tylko sprawdza stan)
      const streak = await checkStreakStatus();
      setStreakData(streak);

      // 2. Ładowanie Historii i Karuzeli
      const history = await getHistory();
      
      if (history.length < 5) {
        const needed = 5 - history.length;
        
        // Filtrujemy, żeby nie dublować tego co w historii
        const availablePool = QUALIFICATIONS_DATA.filter(
          q => !history.find(h => h.id === q.id)
        );

        // Losujemy resztę
        const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
        const randomPicks = shuffled.slice(0, needed);
        
        setCarouselData([...history, ...randomPicks]);
      } else {
        setCarouselData(history.slice(0, 5));
      }
    } catch (e) {
      console.error("Błąd w loadData:", e);
      // Fallback w razie błędu
      setCarouselData(QUALIFICATIONS_DATA.slice(0, 5));
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        
        {/* NAGŁÓWEK */}
        <View style={styles.header}>
          <Text style={[styles.greetingMsg, { color: theme.text }]}>
            Cześć, {userProfile?.username || 'Uczniu'}! 👋
          </Text>
          <Text style={[styles.subMsg, { color: theme.subText }]}>
            Gotowy na naukę? Wybierz kwalifikacje.
          </Text>
        </View>

        {/* SEKCJA 1: STATYSTYKI I SERIA (STREAK) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 24, marginBottom: 15 }]}>
            Twoje Postępy
          </Text>
          
          <View style={{ paddingHorizontal: 24 }}>
             {streakData ? (
               <StreakCard data={streakData} />
             ) : (
               // Placeholder podczas ładowania
               <View style={[styles.statsBox, { backgroundColor: theme.card }]}>
                 <Text style={{color: theme.subText, textAlign: 'center'}}>Synchronizacja danych...</Text>
               </View>
             )}
          </View>
        </View>

        {/* SEKCJA 2: KARUZELA KWALIFIKACJI */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school" size={24} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Ostatnie kwalifikacje</Text>
            </View>
            
            <FlatList
              data={carouselData}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
              
              // Efekt przyciągania (Snap)
              snapToInterval={width * 0.75 + 20} 
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
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  greetingMsg: { fontSize: 28, fontWeight: '800', marginBottom: 5 },
  subMsg: { fontSize: 16, fontWeight: '500' },
  
  section: { marginTop: 25 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 5 
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  
  statsBox: { 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    justifyContent: 'center',
    height: 100 
  }
});