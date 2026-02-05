import AsyncStorage from '@react-native-async-storage/async-storage';
import { Qualification } from '../data/categories';

const HISTORY_KEY = 'recent_exams_v1';
const MISTAKES_KEY_PREFIX = 'mistakes_v1_'; // Prefiks klucza dla błędów

// --- HISTORIA (Ostatnio używane) ---

// Zapisuje egzamin do historii
export const saveToHistory = async (exam: Qualification) => {
  try {
    const existing = await AsyncStorage.getItem(HISTORY_KEY);
    let history: Qualification[] = existing ? JSON.parse(existing) : [];

    // Usuń duplikat (żeby przenieść na górę)
    history = history.filter(item => item.id !== exam.id);

    // Dodaj na początek
    history.unshift(exam);

    // Limit do 5 ostatnich
    if (history.length > 5) {
      history = history.slice(0, 5);
    }

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

// --- BŁĘDY (Do trybu "Poprawa błędów") ---

// Pobiera listę błędów dla konkretnego egzaminu (np. "INF.03")
export const getMistakes = async (examId: string): Promise<any[]> => {
  try {
    const key = `${MISTAKES_KEY_PREFIX}${examId}`;
    const existing = await AsyncStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Błąd odczytu błędów:', error);
    return [];
  }
};

// Zapisuje listę błędów (nadpisuje poprzednią listę dla tego egzaminu)
export const saveMistakes = async (examId: string, mistakes: any[]) => {
  try {
    const key = `${MISTAKES_KEY_PREFIX}${examId}`;
    await AsyncStorage.setItem(key, JSON.stringify(mistakes));
  } catch (error) {
    console.error('Błąd zapisu błędów:', error);
  }
};

// Dodaje pojedynczy błąd do listy (przydatne w trakcie nauki)
export const addMistake = async (examId: string, question: any) => {
  try {
    const currentMistakes = await getMistakes(examId);
    
    // Sprawdź, czy to pytanie już jest w błędach (po treści pytania lub ID)
    const exists = currentMistakes.find(m => m.question === question.question);
    
    if (!exists) {
      const newMistakes = [...currentMistakes, question];
      await saveMistakes(examId, newMistakes);
    }
  } catch (error) {
    console.error('Błąd dodawania błędu:', error);
  }
};

// Czyści błędy dla egzaminu (np. gdy użytkownik poprawi je wszystkie)
export const clearMistakes = async (examId: string) => {
  try {
    const key = `${MISTAKES_KEY_PREFIX}${examId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Błąd czyszczenia błędów:', error);
  }
};