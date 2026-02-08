import AsyncStorage from '@react-native-async-storage/async-storage';

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
  // Miesiące są indeksowane od 0, więc dodajemy 1
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = (): string => getLocalYMD(new Date());

const getYesterdayDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1); // Odejmujemy 1 dzień kalendarzowy
  return getLocalYMD(d);
};

/**
 * SPRAWDZANIE STATUSU PRZY STARCIE APLIKACJI
 */
export const checkStreakStatus = async (): Promise<StreakData> => {
  try {
    const json = await AsyncStorage.getItem(STREAK_KEY);
    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    
    // Domyślny stan dla nowego usera
    if (!json) {
      return { currentStreak: 0, bestStreak: 0, lastVisitDate: null, didPracticeToday: false };
    }

    let data: StreakData = JSON.parse(json);

    // 1. Jeśli ostatnia wizyta to DZISIAJ -> Wszystko OK
    if (data.lastVisitDate === today) {
      return data;
    }

    // 2. Jeśli ostatnia wizyta to WCZORAJ -> Seria trwa, ale dziś jeszcze nie zrobione
    if (data.lastVisitDate === yesterday) {
      data.didPracticeToday = false;
      // Nie musimy zapisywać do AsyncStorage, wystarczy zwrócić zaktualizowany obiekt w pamięci
      return data;
    }

    // 3. Jeśli ostatnia wizyta była DAWNIEJ niż wczoraj -> RESET SERII 😢
    // Ale tylko jeśli mamy jakąś datę (nie jest to null)
    if (data.lastVisitDate && data.lastVisitDate !== yesterday) {
        console.log(`❌ Reset serii! Ostatnia wizyta: ${data.lastVisitDate}, Wczoraj: ${yesterday}`);
        data.currentStreak = 0;
        data.didPracticeToday = false;
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
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
        // Kontynuacja z wczoraj
        data.currentStreak += 1;
    } else if (data.lastVisitDate === today) {
        // (Teoretycznie obsłużone wyżej, ale dla pewności)
        // Nic nie rób z licznikiem, tylko oznacz jako done
    } else {
        // Przerwa w serii lub pierwszy raz -> Start od 1
        data.currentStreak = 1;
    }

    // Aktualizacja rekordu
    if (data.currentStreak > data.bestStreak) {
      data.bestStreak = data.currentStreak;
    }
    
    data.lastVisitDate = today;
    data.didPracticeToday = true;

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
    console.log(`✅ SUKCES! Seria: ${data.currentStreak}, Data: ${today}`);
    return data;

  } catch (error) {
    console.error('Błąd zaliczania serii:', error);
    // Fallback w razie błędu krytycznego
    return { currentStreak: 1, bestStreak: 1, lastVisitDate: getTodayDate(), didPracticeToday: true };
  }
};

/**
 * NARZĘDZIE DEWELOPERSKIE (Tylko do testów/naprawy)
 * Wywołaj to raz np. w App.tsx, żeby ustawić sobie serię na 2, jeśli czujesz się oszukany przez błąd ;)
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
    console.log(`🛠️ WYMUSZONO SERIĘ: ${days}`);
};