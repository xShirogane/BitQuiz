import React from 'react';
import { Pressable, Text, View, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface GlowCardProps {
  title: string;
  subtitle: string;
  iconName: any;
  colors?: string[];
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75; 

export default function GlowCard({ title, subtitle, iconName, colors, onPress }: GlowCardProps) {
  const { theme } = useTheme();
  // Animacja skali przy wciśnięciu
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const activeGradient = colors || theme.cardGradient;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.cardContainer,
          { 
            // Tutaj jest "magia" obramowania
            borderColor: pressed ? theme.text : 'rgba(255,255,255,0.2)', // Subtelna ramka normalnie, mocna przy kliku
            backgroundColor: theme.card, // Tło pod spodem dla cienia
            shadowColor: pressed ? activeGradient[0] : '#000', // Kolorowy cień przy kliknięciu (iOS)
            shadowOpacity: pressed ? 0.6 : 0.3,
            shadowRadius: pressed ? 15 : 8,
            elevation: pressed ? 10 : 5, // Android glow
          }
        ]}
      >
        <LinearGradient
          // @ts-ignore
          colors={activeGradient} 
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Efekt "szkła" - jasna poświata u góry */}
          <View style={styles.glassShine} />

          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Ionicons name={iconName} size={28} color="#FFFFFF" />
            </View>
            <View style={styles.badge}>
               <Text style={styles.badgeText}>START</Text>
            </View>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          </View>

        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: 200, // Wyższa karta wygląda nowocześniej
    borderRadius: 26,
    marginRight: 20, // Większy odstęp
    borderWidth: 2, // Grubsza ramka
    
    // Bazowy cień
    shadowOffset: { width: 0, height: 8 },
  },
  gradient: {
    flex: 1,
    borderRadius: 24, // Odrobinę mniejszy niż kontener żeby ramka była widoczna
    padding: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ skewY: '-15deg' }, { translateY: -40 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: { marginTop: 10 },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
});