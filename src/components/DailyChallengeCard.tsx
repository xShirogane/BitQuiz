import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowOrb } from './GlowOrb'; // <--- DODANY IMPORT

export const DailyChallengeCard: React.FC = () => {
  // MOCKI DANYCH - w przyszłości przekażemy je przez propsy
  const title = "Zdobądź 80% w teście INF.05";
  const rewardXP = 150;
  const currentProgress = 2;
  const maxProgress = 3;
  const timeLeft = "08:42:00"; // Tu potem zrobimy żywy odliczający timer

  // Obliczamy procent zapełnienia paska
  const progressPercentage = (currentProgress / maxProgress) * 100;

  return (
    <LinearGradient
      colors={['#1a1228', '#141022']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Miękkie rozmycie (Glow) zamiast twardego kółka */}
      <GlowOrb color="#ffb428" size={120} top={-40} right={-30} />

      {/* GÓRNA SEKCJA: Odznaka i Nagroda */}
      <View style={styles.topRow}>
        <Text style={styles.badgeText}>⚔️ WYZWANIE DNIA</Text>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>+{rewardXP} XP</Text>
        </View>
      </View>

      {/* TYTUŁ WYZWANIA */}
      <Text style={styles.title}>{title}</Text>

      {/* PASEK POSTĘPU */}
      <View style={styles.barBackground}>
        <LinearGradient
          colors={['#f0a830', '#ffe066']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${progressPercentage}%` }]}
        />
      </View>

      {/* DOLNA SEKCJA: Postęp i Czas */}
      <View style={styles.bottomRow}>
        <Text style={styles.progressText}>{currentProgress} / {maxProgress} zadań</Text>
        <Text style={styles.timeText}>⏱ {timeLeft}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 190, 50, 0.2)',
    overflow: 'hidden', // Chowa nadmiar poświaty (glow)
    position: 'relative',
  },
  // Usunięto stary styl glowRight!
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f0a830',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rewardBadge: {
    backgroundColor: 'rgba(255,180,40,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,180,40,0.3)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 9,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f0c050',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e0e0e0',
    marginBottom: 9,
  },
  barBackground: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 7,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 11,
    color: '#777',
  },
  timeText: {
    fontSize: 11,
    color: '#f0a830',
    fontWeight: '600',
  },
});