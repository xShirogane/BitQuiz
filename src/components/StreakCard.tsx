import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StreakData } from '../utils/streakManager';

interface StreakCardProps {
  data: StreakData;
}

export const StreakCard: React.FC<StreakCardProps> = ({ data }) => {
  const isDoneToday = data.didPracticeToday;

  const activeColors = ['#FF416C', '#FF4B2B'] as const;
  const inactiveColors = ['#485563', '#29323c'] as const;

  return (
    <LinearGradient
      colors={isDoneToday ? activeColors : inactiveColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      {/* Lewa strona: Ikona i Licznik */}
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="flame" size={32} color="#FFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.countText}>
            {data.currentStreak}
          </Text>
          <Text style={styles.label}>
            DNI Z RZĘDU
          </Text>
        </View>
      </View>

      {/* Prawa strona: Status */}
      <View style={styles.rightSection}>
        <View style={styles.badge}>
          <Text style={styles.recordText}>
            REKORD: {data.bestStreak}
          </Text>
        </View>
        
        {/* TUTAJ ZMIANA: Jedna linia + autoskalowanie */}
        <Text 
          style={styles.statusText} 
          numberOfLines={1} 
          adjustsFontSizeToFit={true} // Zmniejsz czcionkę jeśli się nie mieści
          minimumFontScale={0.7}      // Ale nie mniej niż 70% oryginału
        >
          {isDoneToday 
            ? "Ogień podtrzymany! 🔥" 
            : "Ukończ egzamin, aby zaliczyć!"} 
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20, // Zmniejszyłem lekko padding
    paddingVertical: 18,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#FF4B2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    // Usunąłem sztywną szerokość, żeby lewa strona zajmowała tyle ile musi
  },
  iconContainer: {
    width: 46, // Troszkę mniejsze kółko
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    justifyContent: 'center',
  },
  countText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 30,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: {
    fontSize: 9, // Mniejszy label
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightSection: {
    flex: 1, // Ważne: zajmuje resztę miejsca
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 4,
  },
  recordText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 13, // Wyjściowy rozmiar
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'right',
    width: '100%', // Musi mieć szerokość, żeby adjustsFontSizeToFit wiedziało do czego równać
  },
});