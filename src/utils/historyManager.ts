import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Klucz dla historii
const HISTORY_KEY = 'user_history';

// --- FIREBASE SYNC DLA HISTORII ---
const syncHistoryToFirebase = async (result: any): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Zapisz pojedynczy wynik do kolekcji historii
    await addDoc(collection(db, 'users', user.uid, 'history'), {
      ...result,
      syncedAt: Date.now(),
    });
    console.log(`✅ [History Sync] Zapisano wynik do Firebase`);
  } catch (error) {
    console.error('❌ [History Sync] Błąd:', error);
  }
};

const loadHistoryFromFirebase = async (): Promise<any[] | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const q = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('timestamp', 'desc'),
      limit(20) // Ostatnie 20 wyników
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('ℹ️ [History Load] Brak historii w Firebase');
      return null;
    }

    const history = snapshot.docs.map(d => d.data());
    console.log(`✅ [History Load] Załadowano ${history.length} wyników z Firebase`);
    return history;
  } catch (error) {
    console.error('❌ [History Load] Błąd:', error);
    return null;
  }
};

// Zapisz wynik egzaminu (local + Firebase)
export const addToHistory = async (result: any) => {
  try {
    const existingHistory = await AsyncStorage.getItem(HISTORY_KEY);
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    history.unshift(result);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Sync do Firebase w tle
    syncHistoryToFirebase(result);
  } catch (e) {
    console.error('Błąd zapisu historii:', e);
  }
};

// Pobierz historię (local + Firebase merge)
export const getHistory = async () => {
  try {
    const localJson = await AsyncStorage.getItem(HISTORY_KEY);
    const localHistory = localJson ? JSON.parse(localJson) : [];

    // Jeśli lokalna historia jest pusta, spróbuj pobrać z Firebase
    if (localHistory.length === 0) {
      const fbHistory = await loadHistoryFromFirebase();
      if (fbHistory && fbHistory.length > 0) {
        // Zapisz z Firebase do lokalnego storage
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(fbHistory));
        console.log(`✅ [History] Odtworzono ${fbHistory.length} wyników z Firebase`);
        return fbHistory;
      }
    }

    return localHistory;
  } catch (e) {
    return [];
  }
};

// Zapisz błędy dla konkretnego egzaminu
export const saveMistakes = async (examId: string, questionIds: number[]) => {
  try {
    const key = `mistakes_${examId}`;
    const existing = await AsyncStorage.getItem(key);
    let currentMistakes: number[] = existing ? JSON.parse(existing) : [];

    const newMistakes = [...new Set([...currentMistakes, ...questionIds])];

    await AsyncStorage.setItem(key, JSON.stringify(newMistakes));
  } catch (e) {
    console.error('Błąd zapisu błędów:', e);
  }
};

// Pobierz błędy TYLKO dla danego egzaminu
export const getMistakes = async (examId: string): Promise<number[]> => {
  try {
    const key = `mistakes_${examId}`;
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