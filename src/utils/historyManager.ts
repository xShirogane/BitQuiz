import AsyncStorage from '@react-native-async-storage/async-storage';
import { Qualification } from '../data/categories';

const HISTORY_KEY = 'recent_exams_v1';

// Zapisuje egzamin do historii
export const saveToHistory = async (exam: Qualification) => {
  try {
    // 1. Pobierz obecną historię
    const existing = await AsyncStorage.getItem(HISTORY_KEY);
    let history: Qualification[] = existing ? JSON.parse(existing) : [];

    // 2. Usuń ten egzamin, jeśli już tam jest (żeby nie było duplikatów i żeby wskoczył na początek)
    history = history.filter(item => item.id !== exam.id);

    // 3. Dodaj nowy na początek listy
    history.unshift(exam);

    // 4. Utnij listę do max 5 elementów
    if (history.length > 5) {
      history = history.slice(0, 5);
    }

    // 5. Zapisz
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Błąd zapisu historii:', error);
  }
};

// Pobiera historię
export const getHistory = async (): Promise<Qualification[]> => {
  try {
    const existing = await AsyncStorage.getItem(HISTORY_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Błąd odczytu historii:', error);
    return [];
  }
};