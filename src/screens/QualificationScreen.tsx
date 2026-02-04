import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, StatusBar, FlatList, ScrollView, Dimensions, RefreshControl, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Context & Utils
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { QUALIFICATIONS_DATA, Qualification, SCHOOLS } from '../data/categories';
import { runBackgroundSync } from '../utils/offlineManager';
import { getHistory } from '../utils/historyManager';
import { checkStreakStatus, StreakData } from '../utils/streakManager';

// Components
import GlowCard from '../components/GlowCard';
import { StreakCard } from '../components/StreakCard';
import { ProUpgradeCard } from '../components/ProUpgradeCard';
import { SchoolCard } from '../components/SchoolCard';
import { QuickActionTile } from '../components/QuickActionTile';

const { width } = Dimensions.get('window');

// Paleta gradientów
const GRADIENT_PALETTE = [
  ['#4facfe', '#00f2fe'], ['#00c6ff', '#0072ff'], ['#43e97b', '#38f9d7'], 
  ['#11998e', '#38ef7d'], ['#13547a', '#80d0c7'], ['#4c669f', '#3b5998', '#192f6a'], 
  ['#667eea', '#764ba2'], ['#c471f5', '#fa71cd'], ['#b721ff', '#21d4fd'], 
  ['#a18cd1', '#fbc2eb'], ['#DA22FF', '#9733EE'], ['#fa709a', '#fee140'], 
  ['#ff9a9e', '#fecfef'], ['#ff0844', '#ffb199'], ['#f6d365', '#fda085'], 
  ['#fc4a1a', '#f7b733'], ['#0f2027', '#203a43', '#2c5364'], ['#232526', '#414345'], 
  ['#434343', '#000000'], ['#cc2b5e', '#753a88'], 
];

const getRandomGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) { hash += id.charCodeAt(i); }
  return GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length];
};

export default function QualificationScreen({ navigation }: any) {
  const { userProfile } = useAuth();
  const { theme, isDark } = useTheme();

  // STANY
  const [carouselData, setCarouselData] = useState<Qualification[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');

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
      updateExamList(selectedSchoolId); 
    } catch (e) {
      console.error("Błąd w loadData:", e);
    }
  };

  const updateExamList = async (schoolId: string) => {
    if (schoolId === 'all') {
      const history = await getHistory();
      if (history.length < 5) {
        const needed = 5 - history.length;
        const availablePool = QUALIFICATIONS_DATA.filter(q => !history.find(h => h.id === q.id));
        const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
        setCarouselData([...history, ...shuffled.slice(0, needed)]);
      } else {
        setCarouselData(history.slice(0, 5));
      }
    } else {
      const filtered = QUALIFICATIONS_DATA.filter(q => q.schoolIds.includes(schoolId));
      setCarouselData(filtered);
    }
  };

  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    updateExamList(schoolId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Handler dla przycisku Aktualności
  const handleNewsPress = () => {
    Alert.alert("Aktualności", "Wersja 2.0 już dostępna! Dodaliśmy tryb Multiplayer i nowe pytania INF.03. Dziękujemy, że jesteś z nami! 🚀");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        
        {/* NAGŁÓWEK */}
        <View style={styles.header}>
          <Text style={[styles.greetingMsg, { color: theme.text }]}>
            Cześć, {userProfile?.username || 'Uczniu'}! 👋
          </Text>
          <Text style={[styles.subMsg, { color: theme.subText }]}>
            Dziś dobry dzień na naukę.
          </Text>
        </View>

        {/* KARTA PRO */}
        <ProUpgradeCard onPress={() => navigation.navigate('Settings')} />
        
        {/* STATYSTYKI (SERIA) */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
           {streakData ? <StreakCard data={streakData} /> : null}
        </View>

        {/* --- NOWE: SZYBKIE AKCJE (GRID 2x2) --- */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 24, marginBottom: 10 }]}>Szybkie akcje</Text>
          
          <View style={styles.gridContainer}>
            {/* Rząd 1 */}
            <View style={styles.row}>
              <QuickActionTile 
                title="Sklep" 
                iconName="cart" 
                color="#E040FB" 
                onPress={() => navigation.navigate('Settings')} 
              />
              <QuickActionTile 
                title="Aktualności" 
                iconName="newspaper" 
                color="#FF9800" 
                onPress={handleNewsPress} 
              />
            </View>

            {/* Rząd 2 */}
            <View style={styles.row}>
              <QuickActionTile 
                title="Wesprzyj nas" 
                iconName="cafe" 
                color="#F44336" 
                onPress={() => navigation.navigate('Contact')} 
              />
              <QuickActionTile 
                title="Kontakt" 
                iconName="chatbubbles" 
                color="#2196F3" 
                onPress={() => navigation.navigate('Contact')} 
              />
            </View>
          </View>
        </View>

        {/* KATEGORIE (SZKOŁY) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 24 }]}>Kategorie</Text>
          <FlatList
            data={SCHOOLS}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 15 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SchoolCard 
                school={item} 
                isActive={selectedSchoolId === item.id}
                onPress={() => handleSchoolSelect(item.id)}
              />
            )}
          />
        </View>

        {/* LISTA EGZAMINÓW */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={selectedSchoolId === 'all' ? "star" : "funnel"} size={20} color={theme.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {selectedSchoolId === 'all' ? "Polecane dla Ciebie" : "Wybrane Egzaminy"}
              </Text>
            </View>
            
            {carouselData.length > 0 ? (
              <FlatList
                data={carouselData}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 10 }}
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
            ) : (
              <Text style={{ textAlign: 'center', color: theme.subText, marginTop: 20 }}>
                Brak egzaminów w tej kategorii.
              </Text>
            )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 15 },
  greetingMsg: { fontSize: 28, fontWeight: '800', marginBottom: 5 },
  subMsg: { fontSize: 16, fontWeight: '500' },
  
  // Kontener dla Grida Szybkich Akcji
  gridContainer: {
    paddingHorizontal: 19, // Margines dopasowany do QuickActionTile (marginHorizontal: 5)
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10, // Odstęp między rzędami
  },
  
  section: { marginTop: 10 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    marginBottom: 5 
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
});