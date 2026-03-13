import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface QuickActionTileProps {
  title: string;
  description?: string; // Opcjonalny opis
  iconName: any;
  color: string;
  onPress: () => void;
}

export const QuickActionTile: React.FC<QuickActionTileProps> = React.memo(({ title, description, iconName, color, onPress }) => {
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
      {/* IKONA */}
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>

      {/* TEKSTY */}
      <View style={styles.textContainer}>
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit={true} // TO JEST KLUCZOWE: Zmniejsza tekst zamiast ucinać
          minimumFontScale={0.85}     // ...ale nie bardziej niż do 85%
        >
          {title}
        </Text>
        {description && (
          <Text
            style={[styles.description, { color: theme.subText }]}
            numberOfLines={1}
          >
            {description}
          </Text>
        )}
      </View>

      {/* STRZAŁKA */}
      <View style={[styles.arrow, { backgroundColor: theme.background }]}>
        <Ionicons name="chevron-forward" size={12} color={theme.subText} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10, // Lekko mniejszy padding, żeby zyskać miejsce na tekst
    borderRadius: 16,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    height: 65, // Kompaktowa wysokość
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 1,
  },
  description: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
  },
  arrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
});