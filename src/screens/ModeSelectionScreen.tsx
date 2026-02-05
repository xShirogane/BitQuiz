import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Qualification } from '../data/categories';
import { getMistakes } from '../utils/historyManager';

const { width } = Dimensions.get('window');

// Komponent Karty Trybu
const ModeCard = ({ title, description, icon, colors, onPress, disabled = false }: any) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.9} 
      disabled={disabled}
      style={[styles.cardContainer, disabled && { opacity: 0.6 }]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={32} color="#FFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function ModeSelectionScreen({ route, navigation }: any) {
  const { theme, isDark } = useTheme();
  const { examData } = route.params as { examData: Qualification };
  
  const [mistakesCount, setMistakesCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const checkMistakes = async () => {
        try {
          const mistakes = await getMistakes(examData.id);
          setMistakesCount(mistakes.length);
        } catch (e) {
          console.log("Błąd sprawdzania błędów:", e);
        }
      };
      checkMistakes();
    }, [examData.id])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wybierz Tryb</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* INFO O KWALIFIKACJI */}
        <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
          <View style={[styles.infoIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="school" size={28} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoLabel, { color: theme.subText }]}>WYBRANA KWALIFIKACJA</Text>
            <Text style={[styles.infoTitle, { color: theme.text }]}>{examData.title}</Text>
            <Text style={[styles.infoSubtitle, { color: theme.text }]} numberOfLines={1}>
              {examData.fullName}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.subText }]}>DOSTĘPNE TRYBY</Text>

        {/* 1. TRYB NAUKI */}
        <ModeCard
          title="Tryb Nauki"
          description="Ucz się we własnym tempie. Sprawdzaj odpowiedzi na bieżąco, bez stresu."
          icon="book"
          colors={['#4facfe', '#00f2fe']} // Niebieski
          onPress={() => navigation.navigate('Training', { examData })}
        />

        {/* 2. PEŁNY EGZAMIN (40 pytań) */}
        <ModeCard
          title="Pełny Egzamin"
          description="Symulacja CKE. 40 pytań, 60 minut. Prawdziwe wyzwanie."
          icon="stopwatch"
          colors={['#FF416C', '#FF4B2B']} // Czerwony
          onPress={() => navigation.navigate('Exam', { examData, isShortExam: false })}
        />

        {/* 3. SZYBKI TEST (20 pytań - NOWOŚĆ) */}
        <ModeCard
          title="Szybki Test"
          description="Brak czasu? 20 pytań, 30 minut. Idealne na krótką przerwę."
          icon="flash"
          colors={['#F7971E', '#FFD200']} // Pomarańczowo-Żółty (Energia)
          // Przekazujemy flagę isShortExam: true
          onPress={() => navigation.navigate('Exam', { examData, isShortExam: true })}
        />

        {/* 4. ONE LIFE */}
        <ModeCard
          title="One Life"
          description="Tryb Hardcore. Jeden błąd kończy grę. Jak daleko zajdziesz?"
          icon="skull"
          colors={['#434343', '#000000']} // Ciemny
          onPress={() => navigation.navigate('OneLife', { examData })}
        />

        {/* 5. POPRAWA BŁĘDÓW (Tylko jeśli są błędy) */}
        {mistakesCount > 0 && (
          <ModeCard
            title="Poprawa Błędów"
            description={`Masz ${mistakesCount} pytań do poprawy. Powtórz to, co sprawia trudność.`}
            icon="refresh-circle"
            colors={['#11998e', '#38ef7d']} // Zielony
            onPress={() => navigation.navigate('MistakeReview', { examData })}
          />
        )}
        
        {/* 6. MULTIPLAYER */}
        <ModeCard
          title="Pojedynek 1vs1"
          description="Rzuć wyzwanie znajomemu na jednym telefonie."
          icon="game-controller"
          colors={['#DA22FF', '#9733EE']} // Fioletowy
          onPress={() => navigation.navigate('MultiplayerSetup', { examData })}
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800' 
  },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  infoIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  infoTitle: { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  infoSubtitle: { fontSize: 14, opacity: 0.8 },

  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
    opacity: 0.6,
  },

  cardContainer: {
    marginBottom: 15,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    minHeight: 110,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1 },
  cardTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  arrowContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
});