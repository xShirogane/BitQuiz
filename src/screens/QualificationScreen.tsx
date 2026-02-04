import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, StatusBar, FlatList, ScrollView, Dimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Context & Utils
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { QUALIFICATIONS_DATA, Qualification } from '../data/categories';
import { runBackgroundSync } from '../utils/offlineManager';
import { getHistory } from '../utils/historyManager';

// Components
import GlowCard from '../components/GlowCard';

const { width } = Dimensions.get('window');

// 1. DEFINICJA PALETY KOLORÓW (Tablica gradientów)
const GRADIENT_PALETTE = [
  // --- NIEBIESKIE & MORSKIE (Spokój, technologia) ---
  ['#4facfe', '#00f2fe'], // Cyan
  ['#00c6ff', '#0072ff'], // Vivid Blue
  ['#43e97b', '#38f9d7'], // Mint Green
  ['#11998e', '#38ef7d'], // Deep Teal
  ['#13547a', '#80d0c7'], // Aqua Splash
  ['#4c669f', '#3b5998', '#192f6a'], // Classic Navy

  // --- FIOLETY & RÓŻE (Kreatywność, nowoczesność) ---
  ['#667eea', '#764ba2'], // Deep Purple
  ['#c471f5', '#fa71cd'], // Soft Pink
  ['#b721ff', '#21d4fd'], // Electric Purple-Blue
  ['#a18cd1', '#fbc2eb'], // Lavender
  ['#DA22FF', '#9733EE'], // Neon Purple

  // --- CIEPŁE: POMARAŃCZ, CZERWIEŃ, ZŁOTO (Energia) ---
  ['#fa709a', '#fee140'], // Peach / Sunset
  ['#ff9a9e', '#fecfef'], // Cotton Candy
  ['#ff0844', '#ffb199'], // Crimson Red
  ['#f6d365', '#fda085'], // Warm Sun
  ['#fc4a1a', '#f7b733'], // Fire Orange

  // --- CIEMNE & ELEGANCKIE (Premium) ---
  ['#0f2027', '#203a43', '#2c5364'], // Nordic Night
  ['#232526', '#414345'], // Midnight
  ['#434343', '#000000'], // Pure Dark
  ['#cc2b5e', '#753a88'], // Grape Dark
];

// 2. FUNKCJA LOSUJĄCA (Deterministyczna - zawsze ten sam kolor dla tego samego ID)
const getRandomGradient = (id: string) => {
  let hash = 0;
  // Sumujemy kody ASCII znaków w ID
  for (let i = 0; i < id.length; i++) {
    hash += id.charCodeAt(i);
  }
  // Wybieramy kolor z palety używając reszty z dzielenia
  return GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length];
};

export default function QualificationScreen({ navigation }: any) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();

  // Stan na dane do karuzeli
  const [carouselData, setCarouselData] = useState<Qualification[]>([]);

  useFocusEffect(
    useCallback(() => {
      runBackgroundSync();
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const history = await getHistory();
      console.log(`📥 Wczytano historię: ${history.length} elementów`);

      if (history.length < 5) {
        const needed = 5 - history.length;
        
        // Filtrujemy pulę wszystkich dostępnych
        const availablePool = QUALIFICATIONS_DATA.filter(
          q => !history.find(h => h.id === q.id)
        );

        // Mieszamy losowo
        const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
        const randomPicks = shuffled.slice(0, needed);
        
        setCarouselData([...history, ...randomPicks]);
      } else {
        setCarouselData(history.slice(0, 5));
      }
    } catch (e) {
      console.error("Błąd w loadData:", e);
      setCarouselData(QUALIFICATIONS_DATA.slice(0, 5));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* NAGŁÓWEK */}
        <View style={styles.header}>
          <Text style={[styles.greetingMsg, { color: theme.text }]}>
            Cześć, {userProfile?.username || 'Uczniu'}! 👋
          </Text>
          <Text style={[styles.subMsg, { color: theme.subText }]}>
            Gotowy na naukę? Wybierz kwalifikacje.
          </Text>
        </View>

        {/* KARUZELA EGZAMINÓW */}
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
                
                // --- TUTAJ JEST POPRAWKA ---
                // Używamy nowej funkcji getRandomGradient zamiast starej getGradientForTitle
                colors={getRandomGradient(item.id)} 
                
                onPress={() => navigation.navigate('ModeSelection', { examData: item })}
              />
            )}
          />
        </View>

        {/* Placeholder na statystyki */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 24 }]}>Twoje Postępy</Text>
          <View style={[styles.statsBox, { backgroundColor: theme.card }]}>
             <Text style={{color: theme.subText}}>Rozwiązałeś dzisiaj 0 pytań.</Text>
          </View>
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
  
  section: { marginTop: 10 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 5 
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  
  statsBox: { marginHorizontal: 24, padding: 20, borderRadius: 20, marginTop: 10 }
});