import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

// --- DEFINICJE MOTYWÓW ---

const lightTheme = {
  dark: false,
  background: '#F3F4F6',
  card: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  primary: '#2563EB',
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981',
  cardGradient: ['#FFFFFF', '#F9FAFB'] as string[],
  cardBorder: '#E5E7EB',
  glowColor: '#3B82F6',
  iconBg: '#EFF6FF',
};

const darkTheme = {
  dark: true,
  background: '#0F172A',
  card: '#1E293B',
  text: '#F9FAFB',
  subText: '#9CA3AF',
  primary: '#3B82F6',
  border: '#334155',
  danger: '#EF4444',
  success: '#10B981',
  cardGradient: ['#1E293B', '#111827'] as string[],
  cardBorder: '#334155',
  glowColor: '#60A5FA',
  iconBg: 'rgba(59, 130, 246, 0.15)',
};

// --- MOTYWY SKLEPOWE (dark-based z kolorowymi akcentami) ---

const goldTheme = {
  dark: true,
  background: '#1A1408',
  card: '#2A2010',
  text: '#FFF8E1',
  subText: '#BFA76A',
  primary: '#D4AF37',
  border: '#3D3418',
  danger: '#EF4444',
  success: '#10B981',
  cardGradient: ['#2A2010', '#1A1408'] as string[],
  cardBorder: '#3D3418',
  glowColor: '#FFD700',
  iconBg: 'rgba(212, 175, 55, 0.15)',
};

const oceanTheme = {
  dark: true,
  background: '#0A1628',
  card: '#112240',
  text: '#E0F2FE',
  subText: '#7DB8D8',
  primary: '#0077B6',
  border: '#1A3A5C',
  danger: '#EF4444',
  success: '#10B981',
  cardGradient: ['#112240', '#0A1628'] as string[],
  cardBorder: '#1A3A5C',
  glowColor: '#00B4D8',
  iconBg: 'rgba(0, 119, 182, 0.15)',
};

const neonTheme = {
  dark: true,
  background: '#0D0D0D',
  card: '#1A1A2E',
  text: '#E0FFE0',
  subText: '#80FF80',
  primary: '#39FF14',
  border: '#2A2A3E',
  danger: '#FF1744',
  success: '#00E676',
  cardGradient: ['#1A1A2E', '#0D0D0D'] as string[],
  cardBorder: '#2A2A3E',
  glowColor: '#39FF14',
  iconBg: 'rgba(57, 255, 20, 0.15)',
};

type ThemeType = typeof lightTheme;

export type ThemeKey = 'light' | 'dark' | 'gold' | 'ocean' | 'neon';

export const THEME_MAP: Record<ThemeKey, ThemeType> = {
  light: lightTheme,
  dark: darkTheme,
  gold: goldTheme,
  ocean: oceanTheme,
  neon: neonTheme,
};

// Mapowanie itemId ze sklepu na klucz motywu
export const SHOP_THEME_MAP: Record<string, ThemeKey> = {
  'theme_gold': 'gold',
  'theme_ocean': 'ocean',
  'theme_neon': 'neon',
};

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  currentThemeKey: ThemeKey;
  toggleTheme: () => void;
  setThemeByKey: (key: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const { userProfile } = useAuth();

  const [currentThemeKey, setCurrentThemeKey] = useState<ThemeKey>('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTheme();
  }, [userProfile, systemScheme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');

      if (savedTheme && savedTheme in THEME_MAP) {
        const key = savedTheme as ThemeKey;

        // Sklepowe motywy (gold, ocean, neon) — dostępne dla wszystkich po zakupie
        if (key === 'gold' || key === 'ocean' || key === 'neon') {
          setCurrentThemeKey(key);
        } else if (key === 'dark') {
          // Dark mode — tylko PRO
          if (userProfile?.isPro) {
            setCurrentThemeKey('dark');
          } else {
            setCurrentThemeKey('light');
          }
        } else {
          setCurrentThemeKey('light');
        }
      } else {
        // Brak zapisu — domyślnie z ustawień systemu
        if (systemScheme === 'dark' && userProfile?.isPro) {
          setCurrentThemeKey('dark');
        } else {
          setCurrentThemeKey('light');
        }
      }
    } catch (error) {
      console.log('Błąd ładowania motywu:', error);
    } finally {
      setLoaded(true);
    }
  };

  const toggleTheme = async () => {
    const newKey: ThemeKey = currentThemeKey === 'light' ? 'dark' : 'light';
    setCurrentThemeKey(newKey);
    await AsyncStorage.setItem('theme', newKey);
  };

  const setThemeByKey = async (key: ThemeKey) => {
    setCurrentThemeKey(key);
    await AsyncStorage.setItem('theme', key);
  };

  const theme = THEME_MAP[currentThemeKey];
  const isDark = theme.dark;

  return (
    <ThemeContext.Provider value={{ theme, isDark, currentThemeKey, toggleTheme, setThemeByKey }}>
      {children}
    </ThemeContext.Provider>
  );
};