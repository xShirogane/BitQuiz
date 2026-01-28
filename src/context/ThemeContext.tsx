import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native'; // <--- To wykrywa ustawienia telefonu
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext'; // Potrzebujemy tego, żeby sprawdzać status PRO

// Definicja kolorów (odtworzona na podstawie Twoich plików)
const lightTheme = {
  dark: false,
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  subText: '#8E8E93',
  primary: '#007AFF',
  border: '#E5E5EA',
  danger: '#FF3B30',
  success: '#34C759',
};

const darkTheme = {
  dark: true,
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  subText: '#8E8E93',
  primary: '#0A84FF',
  border: '#38383A',
  danger: '#FF453A',
  success: '#32D74B',
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