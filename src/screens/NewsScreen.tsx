import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Typy wiadomości
type NewsType = 'UPDATE' | 'INFO' | 'ALERT' | 'PROMO';

interface NewsItem {
  id: string;
  date: string;
  title: string;
  message: string;
  type: NewsType;
}

// DANE (Później możesz to pobierać z Firebase)
const NEWS_DATA: NewsItem[] = [
  {
    id: '1',
    date: 'dziś',
    title: 'Wielka Aktualizacja Bazy!',
    message: 'Dodaliśmy 150 nowych pytań do kwalifikacji INF.03. Sprawdź swoją wiedzę w trybie Egzaminu!',
    type: 'UPDATE',
  },
  {
    id: '2',
    date: 'wczoraj',
    title: 'Wyzwanie Tygodnia',
    message: 'Zdobądź 500 punktów w ten weekend i otrzymaj darmowe "Zamrożenie Serii". Powodzenia!',
    type: 'PROMO',
  },
  {
    id: '3',
    date: '10 paź',
    title: 'Wersja 2.1 dostępna',
    message: 'Poprawiliśmy błędy zgłaszane w trybie One Life. Aplikacja działa teraz 20% szybciej.',
    type: 'INFO',
  },
  {
    id: '4',
    date: '01 paź',
    title: 'Witaj w nowym BitQuiz!',
    message: 'Cieszymy się, że jesteś z nami. To początek Twojej drogi do zdania egzaminu zawodowego.',
    type: 'INFO',
  },
];

// Helper do kolorów i ikon
const getNewsStyle = (type: NewsType) => {
  switch (type) {
    case 'UPDATE': return { color: '#00C6FF', icon: 'cloud-upload' };
    case 'ALERT': return { color: '#FF416C', icon: 'warning' };
    case 'PROMO': return { color: '#FFD700', icon: 'gift' };
    default: return { color: '#8E8E93', icon: 'information-circle' };
  }
};

export default function NewsScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Centrum Aktualności</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {NEWS_DATA.map((item, index) => {
          const style = getNewsStyle(item.type);
          const isFirst = index === 0;

          return (
            <View key={item.id} style={styles.timelineItem}>
              {/* Lewa strona: Linia czasu */}
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, { backgroundColor: style.color, width: isFirst ? 16 : 12, height: isFirst ? 16 : 12 }]} />
                {index !== NEWS_DATA.length - 1 && (
                  <View style={[styles.line, { backgroundColor: theme.border }]} />
                )}
              </View>

              {/* Prawa strona: Karta wiadomości */}
              <View style={[styles.cardContainer, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { backgroundColor: style.color + '20' }]}>
                    <Ionicons name={style.icon as any} size={12} color={style.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.badgeText, { color: style.color }]}>{item.type}</Text>
                  </View>
                  <Text style={[styles.dateText, { color: theme.subText }]}>{item.date}</Text>
                </View>
                
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.message, { color: theme.subText }]}>{item.message}</Text>
              </View>
            </View>
          );
        })}

        {/* Stopka */}
        <Text style={[styles.footerText, { color: theme.subText }]}>
          To wszystko na teraz. Wróć wkrótce! 👋
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  
  content: { padding: 20 },
  
  timelineItem: { flexDirection: 'row', marginBottom: 25 },
  timelineLeft: { alignItems: 'center', width: 30, marginRight: 10 },
  dot: { borderRadius: 10, marginTop: 5 },
  line: { width: 2, flex: 1, marginTop: 5, borderRadius: 1 },

  cardContainer: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  dateText: { fontSize: 12 },
  
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  message: { fontSize: 14, lineHeight: 20 },
  
  footerText: { textAlign: 'center', marginTop: 20, marginBottom: 40, opacity: 0.6 },
});