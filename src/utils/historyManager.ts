import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase'; // Upewnij się, że importujesz poprawnie
import { doc, getDoc } from 'firebase/firestore';

// Klucz dla historii
const HISTORY_KEY = 'user_history';

// Zapisz wynik egzaminu (bez zmian)
export const addToHistory = async (result: any) => {
  try {
    const existingHistory = await AsyncStorage.getItem(HISTORY_KEY);
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    history.unshift(result);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Błąd zapisu historii:', e);
  }
};

// Pobierz historię (bez zmian)
export const getHistory = async () => {
  try {
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    return [];
  }
};

// --- TUTAJ JEST NAPRAWA ---

// Zapisz błędy dla konkretnego egzaminu
export const saveMistakes = async (examId: string, questionIds: number[]) => {
  try {
    const key = `mistakes_${examId}`; // Np. mistakes_inf02
    const existing = await AsyncStorage.getItem(key);
    let currentMistakes: number[] = existing ? JSON.parse(existing) : [];
    
    // Dodajemy tylko unikalne nowe błędy
    const newMistakes = [...new Set([...currentMistakes, ...questionIds])];
    
    await AsyncStorage.setItem(key, JSON.stringify(newMistakes));
   // console.log(`✅ Zapisano ${newMistakes.length} błędów dla ${examId}`);
  } catch (e) {
    console.error('Błąd zapisu błędów:', e);
  }
};

// Pobierz błędy TYLKO dla danego egzaminu
export const getMistakes = async (examId: string): Promise<number[]> => {
  try {
    const key = `mistakes_${examId}`; // Czytamy z tej samej szufladki
    const mistakes = await AsyncStorage.getItem(key);
    return mistakes ? JSON.parse(mistakes) : [];
  } catch (e) {
    console.error('Błąd odczytu błędów:', e);
    return [];
  }
};

// Usuń błąd (gdy użytkownik odpowie poprawnie w trybie trenera)
export const removeMistake = async (examId: string, questionId: number) => {
  try {
    const key = `mistakes_${examId}`;
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      const currentMistakes: number[] = JSON.parse(existing);
      const updatedMistakes = currentMistakes.filter(id => id !== questionId);
      await AsyncStorage.setItem(key, JSON.stringify(updatedMistakes));
    }
  } catch (e) {
    console.error('Błąd usuwania błędu:', e);
  }
};