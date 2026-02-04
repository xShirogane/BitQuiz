import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface ProUpgradeCardProps {
  onPress: () => void;
}

export const ProUpgradeCard: React.FC<ProUpgradeCardProps> = ({ onPress }) => {
  const { userProfile } = useAuth();
  const { theme } = useTheme();

  // Jeśli użytkownik już ma PRO, nie wyświetlamy tego kafelka w ogóle
  if (userProfile?.isPro) {
    return null;
  }

  // Złoty gradient dla wersji PRO
  const gradientColors = ['#FDC830', '#F37335'] as const;

  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        styles.container,
        { 
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowOpacity: pressed ? 0.4 : 0.2,
        }
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Ikona korony */}
        <View style={styles.iconContainer}>
          <Ionicons name="diamond" size={32} color="#FFF" />
        </View>

        {/* Teksty */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>ODBLOKUJ WERSJĘ PRO</Text>
          <Text style={styles.subtitle} >
            Brak reklam, tryb offline i inne!
          </Text>
        </View>

        {/* Strzałka */}
        <Ionicons name="chevron-forward" size={24} color="#FFF" style={{ opacity: 0.8 }} />
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24, // Taki sam margines jak reszta sekcji
    marginBottom: 25,     // Odstęp od dołu
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#F37335',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
});