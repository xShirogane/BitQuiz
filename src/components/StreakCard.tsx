import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StreakData } from '../utils/streakManager';
import { GlowOrb } from './GlowOrb';

interface StreakCardProps {
  data: StreakData;
}

export const StreakCard: React.FC<StreakCardProps> = ({ data }) => {
  // MOCKI DANYCH
  const level = 7;
  const levelName = "Technik IT";
  const currentXP = 840;
  const requiredXP = 1200;
  
  // Obliczamy procent zapełnienia paska
  const progressPercentage = (currentXP / requiredXP) * 100;

  return (
    <View style={styles.card}>
      {/* Piękne, miękkie rozmycie (Glow) */}
      <GlowOrb color="#A050FF" size={160} top={-40} left={-40} />
      <GlowOrb color="#3278FF" size={140} top={-10} right={-30} />

      {/* GÓRNA SEKCJA */}
      <View style={styles.topSection}>
        
        {/* Lewa strona: Poziom */}
        <View style={styles.levelBlock}>
          <Text style={styles.levelLabel}>Twój poziom</Text>
          <Text style={styles.levelNumber}>{level}</Text>
          <Text style={styles.levelName}>{levelName}</Text>
        </View>

        {/* Prawa strona: Odznaka XP i Seria */}
        <View style={styles.rightBlock}>
          
          {/* OBRAMÓWKA DLA XP */}
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>🏅 {currentXP} XP</Text>
          </View>
          
          {/* OBRAMÓWKA DLA SERII */}
          <View style={styles.streakBlock}>
            <Ionicons name="flame" size={24} color="#FF9500" style={styles.streakIcon} />
            <Text style={styles.streakNumber}>{data.currentStreak}</Text>
            
            <View style={styles.streakInfo}>
              <Text style={styles.streakLabel}>Seria</Text>
              <Text style={styles.streakSub}>dni</Text>
            </View>
          </View>

        </View>
      </View>

      {/* DOLNA SEKCJA: Pasek postępu */}
      <View style={styles.xpRow}>
        <Text style={styles.xpLabel}>Postęp do poziomu {level + 1}</Text>
        <Text style={styles.xpVal}>{currentXP} / {requiredXP} XP</Text>
      </View>
      
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progressPercentage}%` }]} />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E2D',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden', 
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  levelBlock: {
    justifyContent: 'center',
  },
  levelLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  levelNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 40,
    marginVertical: 4,
  },
  levelName: {
    fontSize: 14,
    color: '#A050FF',
    fontWeight: '700',
  },
  rightBlock: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  
  // --- DODANE OBRAMÓWKI ---
  rankBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, // Grubość ramki
    borderColor: 'rgba(255,255,255,0.2)', // Kolor ramki
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  rankBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
  },
  streakBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, // Grubość ramki
    borderColor: 'rgba(255,255,255,0.2)', // Kolor ramki
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  // -----------------------

  streakIcon: {
    marginRight: 4,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 6,
  },
  streakInfo: {
    justifyContent: 'center',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  streakSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  xpVal: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '700',
  },
  barBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3278FF',
    borderRadius: 4,
  },
});