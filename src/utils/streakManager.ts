import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Zmieniamy klucz na v4, żeby odciąć się od błędnych zapisów
const STREAK_KEY = 'user_streak_v4';

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastVisitDate: string | null; // Format: YYYY-MM-DD (Lokalny)
  didPracticeToday: boolean;
}

// ✅ FIX: Pobieranie daty lokalnej (rozwiązuje problem 00:30 w nocy)
const getLocalYMD = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = (): string => getLocalYMD(new Date());

const getYesterdayDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalYMD(d);
};

// --- FIREBASE SYNC ---
const syncStreakToFirebase = async (data: StreakData): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await setDoc(doc(db, 'users', user.uid, 'progress', 'streak'), {
      currentStreak: data.currentStreak,
      bestStreak: data.bestStreak,
      lastVisitDate: data.lastVisitDate,
      didPracticeToday: data.didPracticeToday,
      updatedAt: Date.now(),
    }, { merge: true });
    console.log(`✅ [Streak Sync] Zapisano do Firebase: seria ${data.currentStreak} dni`);
  } catch (error) {
    console.error('❌ [Streak Sync] Błąd:', error);
  }
};

const loadStreakFromFirebase = async (): Promise<StreakData | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const docSnap = await getDoc(doc(db, 'users', user.uid, 'progress', 'streak'));
    if (!docSnap.exists()) return null;

    const fbData = docSnap.data();
    console.log(`✅ [Streak Load] Załadowano z Firebase: seria ${fbData.currentStreak}`);
    return {
      currentStreak: fbData.currentStreak || 0,
      bestStreak: fbData.bestStreak || 0,
      lastVisitDate: fbData.lastVisitDate || null,
      didPracticeToday: fbData.didPracticeToday || false,
    };
  } catch (error) {
    console.error('❌ [Streak Load] Błąd:', error);
    return null;
  }
};

/**
 * SPRAWDZANIE STATUSU PRZY STARCIE APLIKACJI
 */
export const checkStreakStatus = async (): Promise<StreakData> => {
  try {
    const json = await AsyncStorage.getItem(STREAK_KEY);
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // Pobierz lokalne dane
    let data: StreakData = json
      ? JSON.parse(json)
      : { currentStreak: 0, bestStreak: 0, lastVisitDate: null, didPracticeToday: false };

    // Merge z Firebase – inteligentny wybór lepszych danych
    const fbData = await loadStreakFromFirebase();
    if (fbData) {
      // Zawsze bierz wyższy bestStreak
      const mergedBest = Math.max(data.bestStreak, fbData.bestStreak);

      // Kluczowy wybór: kto ma aktualniejsze dane?
      // Bierz dane z nowszą datą. Jeśli ta sama data – bierz wyższy streak.
      let winner = data;
      if (!data.lastVisitDate && fbData.lastVisitDate) {
        winner = fbData;
      } else if (data.lastVisitDate && fbData.lastVisitDate) {
        if (fbData.lastVisitDate > data.lastVisitDate) {
          winner = fbData;
        } else if (fbData.lastVisitDate === data.lastVisitDate && fbData.currentStreak > data.currentStreak) {
          winner = fbData;
        }
      }

      data = { ...winner, bestStreak: mergedBest };

      // Zawsze zapisz zwycięzcę lokalnie I do Firebase (żeby oba urządzenia miały to samo)
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
      syncStreakToFirebase(data);
      console.log(`🔄 [Streak Merge] Wynik: seria ${data.currentStreak}, best ${data.bestStreak}, data ${data.lastVisitDate}`);
    }

    // 1. Jeśli ostatnia wizyta to DZISIAJ -> Wszystko OK
    if (data.lastVisitDate === today) {
      return data;
    }

    // 2. Jeśli ostatnia wizyta to WCZORAJ -> Seria trwa, ale dziś jeszcze nie zrobione
    if (data.lastVisitDate === yesterday) {
      data.didPracticeToday = false;
      return data;
    }

    // 3. Jeśli ostatnia wizyta była DAWNIEJ niż wczoraj -> spróbuj zamrozić serię
    if (data.lastVisitDate && data.lastVisitDate !== yesterday) {
      // Sprawdź zamrożenie serii
      const { getItemQuantity, useItem } = require('./shopManager');
      const freezeCount = await getItemQuantity('streak_freeze');
      if (freezeCount > 0) {
        const used = await useItem('streak_freeze');
        if (used) {
          console.log(`❄️ Zamrożenie serii! Seria ${data.currentStreak} zachowana.`);
          data.lastVisitDate = yesterday; // Udawaj że wczoraj było OK
          data.didPracticeToday = false;
          await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
          syncStreakToFirebase(data);
          return data;
        }
      }

      console.log(`❌ Reset serii! Ostatnia wizyta: ${data.lastVisitDate}, Wczoraj: ${yesterday}`);
      data.currentStreak = 0;
      data.didPracticeToday = false;
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
      syncStreakToFirebase(data);
    }

    return data;
  } catch (error) {
    console.error('Błąd sprawdzania serii:', error);
    return { currentStreak: 0, bestStreak: 0, lastVisitDate: null, didPracticeToday: false };
  }
};

/**
 * ZALICZANIE EGZAMINU (Wywołaj po sukcesie >= 40 pytań)
 */
export const completeDailyExam = async (): Promise<StreakData> => {
  try {
    const json = await AsyncStorage.getItem(STREAK_KEY);
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    let data: StreakData = json
      ? JSON.parse(json)
      : { currentStreak: 0, bestStreak: 0, lastVisitDate: null, didPracticeToday: false };

    // Jeśli już dziś zaliczone -> nie podbijaj licznika drugi raz
    if (data.lastVisitDate === today && data.didPracticeToday) {
      console.log('⚠️ Dzisiaj już zaliczone.');
      return data;
    }

    // LOGIKA ZWIĘKSZANIA SERII
    if (data.lastVisitDate === yesterday) {
      data.currentStreak += 1;
    } else if (data.lastVisitDate === today) {
      // Nic nie rób
    } else {
      data.currentStreak = 1;
    }

    if (data.currentStreak > data.bestStreak) {
      data.bestStreak = data.currentStreak;
    }

    data.lastVisitDate = today;
    data.didPracticeToday = true;

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
    // Synchronizuj z Firebase
    syncStreakToFirebase(data);

    console.log(`✅ SUKCES! Seria: ${data.currentStreak}, Data: ${today}`);
    return data;

  } catch (error) {
    console.error('Błąd zaliczania serii:', error);
    return { currentStreak: 1, bestStreak: 1, lastVisitDate: getTodayDate(), didPracticeToday: true };
  }
};

/**
 * NARZĘDZIE DEWELOPERSKIE (Tylko do testów/naprawy)
 */
export const dev_forceStreak = async (days: number) => {
  const today = getTodayDate();
  const data: StreakData = {
    currentStreak: days,
    bestStreak: days,
    lastVisitDate: today,
    didPracticeToday: true
  };
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  syncStreakToFirebase(data);
  console.log(`🛠️ WYMUSZONO SERIĘ: ${days}`);
};