// src/components/RecentExamCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface RecentExamCardProps {
  examName: string;
  score: number;
  maxScore: number;
  date: string;
  passed?: boolean;
  iconName?: string;
  onPress?: () => void;
}

export const RecentExamCard: React.FC<RecentExamCardProps> = React.memo(({
  examName,
  score,
  maxScore,
  date,
  passed = true,
  iconName = 'document-text-outline',
  onPress,
}) => {
  const { theme } = useTheme();

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  // Pasek max 100% wizualnie, nawet jeśli wynik > 100%
  const barWidth = Math.min(percentage, 100);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* GÓRNA LINIA: Ikona + Nazwa + Badge */}
      <View style={styles.topRow}>
        {/* Ikona po lewej */}
        <View style={[styles.iconBox, { backgroundColor: 'rgba(79,172,254,0.15)' }]}>
          <Ionicons name={iconName as any} size={22} color="#4facfe" />
        </View>

        {/* Nazwa egzaminu */}
        <Text style={[styles.examName, { color: theme.text }]} numberOfLines={1}>
          {examName}
        </Text>

        {/* Badge Zdany/Niezdany */}
        <View style={[
          styles.badge,
          { backgroundColor: passed ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)' }
        ]}>
          <Text style={[
            styles.badgeText,
            { color: passed ? '#4CAF50' : '#F44336' }
          ]}>
            {passed ? 'Zdany' : 'Niezdany'}
          </Text>
        </View>
      </View>

      {/* PASEK POSTĘPU – gradientowy */}
      <View style={styles.barBackground}>
        <LinearGradient
          colors={['#A050FF', '#5B7FFF', '#3278FF'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${barWidth}%` }]}
        />
      </View>

      {/* DOLNA LINIA: Data + Wynik */}
      <View style={styles.bottomRow}>
        <Text style={[styles.dateText, { color: theme.subText }]}>{date}</Text>
        <Text style={[styles.scoreText, { color: theme.subText }]}>
          {score}/{maxScore} pkt – {percentage}%
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconEmoji: {
    fontSize: 20,
  },
  examName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  barBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});