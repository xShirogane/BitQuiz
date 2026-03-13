import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Pobieramy motyw

interface ExamQuickActionCardProps {
  title: string;
  subtitle: string;
  emoji: string;
  iconBg: string;
  onPress: () => void;
}

export const ExamQuickActionCard: React.FC<ExamQuickActionCardProps> = React.memo(({
  title, subtitle, emoji, iconBg, onPress
}) => {
  const { theme } = useTheme(); // Używamy motywu

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]} // TŁO Z MOTYWU
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      {/* TEKSTY Z MOTYWU */}
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.subText }]} numberOfLines={2}>{subtitle}</Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  }
});