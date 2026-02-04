import AsyncStorage from '@react-native-async-storage/async-storage';

const RESULTS_KEY = 'user_results_v1';

export interface ExamResult {
  examId: string;
  score: number;
  total: number;
  date: string;
  mode: string; // np. 'exam', 'training'
}

export interface ExamStats {
  solvedQuestions: number;
  averageAccuracy: number;
  bestScore: string; // np. "38/40"
}

// Funkcja pobierająca statystyki dla konkretnego egzaminu (np. 'inf02')
export const getStatsForExam = async (examId: string): Promise<ExamStats> => {
  try {
    const json = await AsyncStorage.getItem(RESULTS_KEY);
    if (!json) return { solvedQuestions: 0, averageAccuracy: 0, bestScore: '0/0' };

    const allResults: ExamResult[] = JSON.parse(json);
    
    // Filtrujemy wyniki tylko dla tego konkretnego egzaminu
    const examResults = allResults.filter(r => r.examId === examId);

    if (examResults.length === 0) {
      return { solvedQuestions: 0, averageAccuracy: 0, bestScore: '0/0' };
    }

    // 1. Liczba rozwiązanych pytań (suma wszystkich 'total' z podejść)
    // Jeśli wolisz liczyć unikalne pytania, logika byłaby bardziej skomplikowana.
    // Tutaj liczymy ile razy user odpowiadał w ogóle (aktywność).
    const solvedQuestions = examResults.reduce((acc, curr) => acc + curr.total, 0);

    // 2. Średnia skuteczność (%)
    const totalPercentage = examResults.reduce((acc, curr) => {
      const percent = (curr.score / curr.total) * 100;
      return acc + percent;
    }, 0);
    const averageAccuracy = Math.round(totalPercentage / examResults.length);

    // 3. Najlepszy wynik (dla trybu egzamin 40 pytań, lub po prostu najlepszy % ze wszystkich)
    // Szukamy wyniku z największym procentem
    const bestResult = examResults.reduce((prev, current) => {
      const prevPercent = prev.score / prev.total;
      const currPercent = current.score / current.total;
      return (currPercent > prevPercent) ? current : prev;
    });

    return {
      solvedQuestions,
      averageAccuracy,
      bestScore: `${bestResult.score}/${bestResult.total}`
    };

  } catch (error) {
    console.error('Błąd obliczania statystyk:', error);
    return { solvedQuestions: 0, averageAccuracy: 0, bestScore: '0/0' };
  }
};