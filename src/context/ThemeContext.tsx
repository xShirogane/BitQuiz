import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native'; // <--- To wykrywa ustawienia telefonu
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // Potrzebujemy tego, żeby sprawdzać status PRO

const lightTheme = {
  dark: false,
  background: '#F3F4F6', // Nieco cieplejszy szary
  card: '#FFFFFF',
  text: '#111827',
  subText: '#6B7280',
  primary: '#2563EB',
  border: '#E5E7EB',
  danger: '#EF4444',
  success: '#10B981',
  // Nowe właściwości dla kafelków
  cardGradient: ['#FFFFFF', '#F9FAFB'], // Delikatny gradient dla jasnego
  cardBorder: '#E5E7EB',
  glowColor: '#3B82F6', // Kolor podświetlenia (niebieski)
  iconBg: '#EFF6FF',
};

const darkTheme = {
  dark: true,
  background: '#0F172A', // Głęboki granat/czarny (Slate 900)
  card: '#1E293B', // Slate 800
  text: '#F9FAFB',
  subText: '#9CA3AF',
  primary: '#3B82F6',
  border: '#334155',
  danger: '#EF4444',
  success: '#10B981',
  // Nowe właściwości dla kafelków
  cardGradient: ['#1E293B', '#111827'], // Ciemny gradient
  cardBorder: '#334155',
  glowColor: '#60A5FA', // Jaśniejszy niebieski dla glow
  iconBg: 'rgba(59, 130, 246, 0.15)', // Przezroczysty niebieski
};

type ThemeType = typeof lightTheme;

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const { userProfile } = useAuth(); // Pobieramy dane użytkownika (czy jest PRO)
  
  const [isDark, setIsDark] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Główna logika ładowania motywu
  useEffect(() => {
    loadTheme();
  }, [userProfile, systemScheme]); // Uruchom, gdy zmieni się profil (np. kupi PRO) lub systemowy motyw

  const loadTheme = async () => {
    try {
      // 1. Sprawdź, czy użytkownik ręcznie nadpisał motyw
      const savedTheme = await AsyncStorage.getItem('theme');
      
      if (savedTheme !== null) {
        // Użytkownik ma zapisane preferencje
        const wantsDark = savedTheme === 'dark';
        
        // Zastosuj, ale TYLKO jeśli ma PRO (dla bezpieczeństwa)
        if (wantsDark && userProfile?.isPro) {
          setIsDark(true);
        } else {
          setIsDark(false);
        }
      } else {
        // 2. Brak zapisu ręcznego -> Bierzemy z ustawień telefonu (System Default)
        const systemIsDark = systemScheme === 'dark';
        
        // Jeśli telefon jest ciemny I użytkownik ma PRO -> włącz ciemny
        if (systemIsDark && userProfile?.isPro) {
          setIsDark(true);
        } else {
          setIsDark(false);
        }
      }
    } catch (error) {
      console.log('Błąd ładowania motywu:', error);
    } finally {
      setLoaded(true);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    // Zapisz wybór użytkownika na stałe
    await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const theme = isDark ? darkTheme : lightTheme;

  // Opcjonalnie: Uniknięcie "mignięcia" przy ładowaniu, ale w tym przypadku renderujemy od razu
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};