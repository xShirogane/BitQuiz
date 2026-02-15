export interface ExamAnswerEntry {
  questionId: number;
  questionText: string;
  userAnswerIndex: number | null;
  correctAnswerIndex: number | null;
  isCorrect: boolean;
  answerOptions: string[]; // Zapisujemy treści odpowiedzi, żeby historia była czytelna nawet jak zmienisz bazę pytań
}

export interface ExamHistoryEntry {
  id?: string; // ID dokumentu z Firebase
  examId: string;
  timestamp: number; // lub Timestamp z Firebase
  mode: 'exam' | 'training' | 'onelife';
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number; // Jeśli masz licznik czasu, warto go tu dodać (opcjonalnie)
  passed: boolean;
  answers: ExamAnswerEntry[]; // Pełna historia odpowiedzi
}