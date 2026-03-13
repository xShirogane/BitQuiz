import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StreakData } from '../utils/streakManager';
import { getXPData, getLevelInfo } from '../utils/xpManager';
import { GlowOrb } from './GlowOrb';

interface StreakCardProps {
  data: StreakData;
  onInfoPress?: () => void;
}

export const StreakCard: React.FC<StreakCardProps> = ({ data, onInfoPress }) => {
  const [levelInfo, setLevelInfo] = useState({
    level: 1, levelName: 'Początkujący', totalXP: 0,
    currentLevelXP: 0, requiredLevelXP: 300, nextLevelTotalXP: 300,
    progress: 0, isMaxLevel: false,
  });

  useEffect(() => {
    const loadXP = async () => {
      const xpData = await getXPData();
      setLevelInfo(getLevelInfo(xpData.totalXP));
    };
    loadXP();
  }, []);

  const { level, levelName, totalXP, currentLevelXP, requiredLevelXP, progress, nextLevelTotalXP } = levelInfo;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onInfoPress} style={styles.card}>
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
            <Text style={styles.rankBadgeText}>🏅 {totalXP} XP</Text>
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
        <Text style={styles.xpVal}>{totalXP} / {nextLevelTotalXP} XP</Text>
      </View>

      <View style={styles.barBackground}>
        <LinearGradient
          colors={['#A050FF', '#5B7FFF', '#3278FF'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${progress}%` }]}
        />
      </View>

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151525',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#6B3FA0',
    shadowColor: '#7B4FBF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoBtn: {
    marginLeft: 6,
    padding: 2,
  },
});