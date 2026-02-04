import React from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { School } from '../data/categories'; //

interface SchoolCardProps {
  school: School;
  isActive: boolean;
  onPress: () => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({ school, isActive, onPress }) => {
  const { theme } = useTheme();

  // Kolor aktywny (np. niebieski) vs nieaktywny (karta)
  const backgroundColor = isActive ? theme.primary : theme.card;
  const textColor = isActive ? '#FFFFFF' : theme.text;
  const borderColor = isActive ? 'transparent' : theme.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor,
          borderColor,
          transform: [{ scale: pressed ? 0.95 : 1 }], // Animacja wciśnięcia
          elevation: isActive ? 8 : 2, // Większy cień dla aktywnego
          shadowColor: isActive ? theme.primary : '#000',
        }
      ]}
    >
      <Text style={styles.icon}>{school.icon}</Text>
      <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
        {school.name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 20,
    padding: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
});