import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

// 1. Definicja kolorów (Paleta)
export const themeColors = {
  light: {
    background: '#F5F7FA',
    card: '#FFFFFF',
    text: '#333333',
    subText: '#666666',
    border: '#dddddd',
    primary: '#007AFF',
    danger: '#FF3B30',
    iconBg: '#F5F7FA',
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#E0E0E0',
    subText: '#AAAAAA',
    border: '#333333',
    primary: '#0A84FF', // Jaśniejszy niebieski dla trybu ciemnego
    danger: '#FF453A',
    iconBg: '#2C2C2E',
  },
};

// 2. Typy
type ThemeType = 'light' | 'dark';

interface ThemeContextProps {
  theme: typeof themeColors.light; // Aktualne kolory
  isDark: boolean;                 // Czy ciemny?
  toggleTheme: () => void;         // Funkcja zmiany
  setThemeManual: (isDark: boolean) => void; // Ręczne ustawienie
}

const ThemeContext = createContext<ThemeContextProps>({} as ThemeContextProps);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Domyślnie startujemy z jasnym, ale w przyszłości możemy czytać z pamięci telefonu
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark(!isDark);
  const setThemeManual = (value: boolean) => setIsDark(value);

  const theme = isDark ? themeColors.dark : themeColors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setThemeManual }}>
      {children}
    </ThemeContext.Provider>
  );
};