import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'user_streak_v2'; // Zmieniam klucz na v2, żeby wyczyścić stare błędy

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastVisitDate: string | null; 
  didPracticeToday: boolean;
}

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * TYLKO ODCZYT I RESET:
 * Ta funkcja sprawdza, czy użytkownik nie pominął dnia.
 * Jeśli pominął -> resetuje serię do 0.
 * Ale NIE zwiększa serii za samo wejście.
 */
export const checkStreakStatus = async (): Promise<StreakData> => {
  try {
    const json = await AsyncStorage.getItem(STREAK_KEY);
    const today = getTodayDate();
    
    // Domyślny stan (nowy użytkownik)
    let data: StreakData = json 
      ? JSON.parse(json) 
      : { currentStreak: 0, bestStreak: 0, lastVisitDate: null, didPracticeToday: false };

    // Jeśli brak daty (pierwsze uruchomienie), zwracamy zera
    if (!data.lastVisitDate) {
      return data;
    }

    // Jeśli data ostatniej aktywności to DZISIAJ -> nic nie zmieniamy, zwracamy stan
    if (data.lastVisitDate === today) {
      return data;
    }

    // Jeśli data jest inna niż dzisiaj, sprawdzamy czy to było wczoraj
    const lastDate = new Date(data.lastVisitDate);
    const currDate = new Date(today);
    const diffTime = Math.abs(currDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays > 1) {
      // Ups, minęło więcej niż 1 dzień -> RESET SERII
      data.currentStreak = 0;
      data.didPracticeToday = false;
      // Nie aktualizujemy daty tutaj, data zaktualizuje się dopiero jak user zrobi egzamin!
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
    } else {
      // Był wczoraj, więc seria jest bezpieczna, ale na dziś jeszcze nie zaliczona
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
 * ZALICZENIE ZADANIA:
 * Wywołujemy to TYLKO po ukończeniu egzaminu 40 pytań.
 */
export const completeDailyExam = async (): Promise<StreakData> => {
  try {
    const json = await AsyncStorage.getItem(STREAK_KEY);
    const today = getTodayDate();
    
    let data: StreakData = json 
      ? JSON.parse(json) 
      : { currentStreak: 0, bestStreak: 0, lastVisitDate: null, didPracticeToday: false };

    // Jeśli już dziś zaliczył -> nic nie robimy
    if (data.lastVisitDate === today && data.didPracticeToday) {
      return data;
    }

    // ZALICZAMY SERIĘ!
    // Jeśli seria była zerowa, ustawiamy na 1.
    // Jeśli była kontynuowana (np. wczoraj), dodajemy 1.
    
    // Tu ważny moment: funkcja checkStreakStatus już powinna była wyzerować serię
    // jeśli user nie był wczoraj. Więc tutaj po prostu dodajemy +1.
    
    data.currentStreak += 1;
    if (data.currentStreak > data.bestStreak) {
      data.bestStreak = data.currentStreak;
    }
    
    data.lastVisitDate = today;
    data.didPracticeToday = true;

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
    return data;

  } catch (error) {
    console.error('Błąd zaliczania serii:', error);
    return { currentStreak: 1, bestStreak: 1, lastVisitDate: getTodayDate(), didPracticeToday: true };
  }
};