import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface QuickActionTileProps {
  title: string;
  iconName: any;
  color: string;
  onPress: () => void;
}

export const QuickActionTile: React.FC<QuickActionTileProps> = ({ title, iconName, color, onPress }) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.card,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        }
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}> 
        {/* + '20' dodaje przezroczystość do hex koloru */}
        <Ionicons name={iconName} size={24} color={color} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <View style={[styles.arrow, { backgroundColor: theme.background }]}>
        <Ionicons name="chevron-forward" size={14} color={theme.subText} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Rozciągnij na pół ekranu
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 5, // Odstęp między kafelkami
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  }
});