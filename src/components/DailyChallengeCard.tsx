import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlowOrb } from './GlowOrb';
import {
  DailyChallengeData,
  getSecondsUntilReset,
  getChallengeProgress,
  getChallengeProgressText,
} from '../utils/dailyChallengeManager';

interface DailyChallengeCardProps {
  challenge: DailyChallengeData | null;
  onPress: () => void;
}

const formatTimer = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const DailyChallengeCard: React.FC<DailyChallengeCardProps> = ({ challenge, onPress }) => {
  const [timeLeft, setTimeLeft] = useState(getSecondsUntilReset());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getSecondsUntilReset());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!challenge) {
    return (
      <LinearGradient
        colors={['#1a1228', '#141022']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.loadingText}>Ładowanie wyzwania...</Text>
      </LinearGradient>
    );
  }

  const isCompleted = challenge.completed;
  const progressPercent = getChallengeProgress(challenge);
  const progressText = getChallengeProgressText(challenge);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={isCompleted ? 1 : 0.85}
      disabled={isCompleted}
    >
      <LinearGradient
        colors={isCompleted ? ['#0d2818', '#0a1f14'] : ['#1a1228', '#141022']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isCompleted && styles.cardCompleted]}
      >
        <GlowOrb color={isCompleted ? '#4CAF50' : '#ffb428'} size={120} top={-40} right={-30} />

        {/* GÓRNA SEKCJA */}
        <View style={styles.topRow}>
          <Text style={[styles.badgeText, isCompleted && styles.badgeTextCompleted]}>
            {isCompleted ? '✅ UKOŃCZONE' : `${challenge.icon} WYZWANIE DNIA`}
          </Text>
          <View style={[styles.rewardBadge, isCompleted && styles.rewardBadgeCompleted]}>
            <Text style={[styles.rewardText, isCompleted && styles.rewardTextCompleted]}>
              {isCompleted ? `✓ ${challenge.rewardXP} XP` : `+${challenge.rewardXP} XP`}
            </Text>
          </View>
        </View>

        {/* TYTUŁ */}
        <Text style={styles.title}>{challenge.title}</Text>

        {/* PASEK POSTĘPU */}
        <View style={styles.barBackground}>
          <LinearGradient
            colors={isCompleted ? ['#4CAF50', '#81C784'] : ['#f0a830', '#ffe066']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${progressPercent}%` }]}
          />
        </View>

        {/* DOLNA SEKCJA */}
        <View style={styles.bottomRow}>
          <Text style={styles.progressText}>{progressText}</Text>
          <Text style={[styles.timeText, isCompleted && styles.timeTextCompleted]}>
            ⏱ {formatTimer(timeLeft)}
          </Text>
        </View>

        {!isCompleted && (
          <View style={styles.arrowHint}>
            <Ionicons name="chevron-forward" size={16} color="rgba(240,168,48,0.4)" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
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
    overflow: 'hidden',
    position: 'relative',
  },
  cardCompleted: { borderColor: 'rgba(76, 175, 80, 0.3)' },
  loadingText: { color: '#777', fontSize: 13, textAlign: 'center', paddingVertical: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#f0a830', textTransform: 'uppercase', letterSpacing: 1 },
  badgeTextCompleted: { color: '#4CAF50' },
  rewardBadge: { backgroundColor: 'rgba(255,180,40,0.12)', borderWidth: 1, borderColor: 'rgba(255,180,40,0.3)', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 9 },
  rewardBadgeCompleted: { backgroundColor: 'rgba(76,175,80,0.12)', borderColor: 'rgba(76,175,80,0.3)' },
  rewardText: { fontSize: 11, fontWeight: '700', color: '#f0c050' },
  rewardTextCompleted: { color: '#4CAF50' },
  title: { fontSize: 13, fontWeight: '600', color: '#e0e0e0', marginBottom: 9 },
  barBackground: { height: 5, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginBottom: 7 },
  barFill: { height: '100%', borderRadius: 3 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 11, color: '#777' },
  timeText: { fontSize: 11, color: '#f0a830', fontWeight: '600' },
  timeTextCompleted: { color: '#4CAF50' },
  arrowHint: { position: 'absolute', right: 12, top: '50%', marginTop: -8 },
});