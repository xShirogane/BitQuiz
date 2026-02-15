import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ExamHistoryEntry } from '../types/statistics';
import { QUALIFICATIONS_DATA } from '../data/categories'; 

const DEFAULT_TOTAL_QUESTIONS = 500; 

export interface ProcessedStats {
  totalExams: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  averageTimeSeconds: number;
  
  questionsKnown: number;     
  questionsMistakes: number;  
  questionsToDiscover: number;
  totalQuestionsInDb: number;
}

export const useExamStats = (userId: string | undefined, currentExamId: string) => {
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [totalQuestionsInDb, setTotalQuestionsInDb] = useState(DEFAULT_TOTAL_QUESTIONS);
  const [relatedExamIds, setRelatedExamIds] = useState<string[]>([currentExamId]);

  const [stats, setStats] = useState<ProcessedStats>({
    totalExams: 0, passedCount: 0, failedCount: 0, passRate: 0,
    averageScore: 0, bestScore: 0, worstScore: 0, averageTimeSeconds: 0,
    questionsKnown: 0, questionsMistakes: 0, questionsToDiscover: DEFAULT_TOTAL_QUESTIONS,
    totalQuestionsInDb: DEFAULT_TOTAL_QUESTIONS
  });
  const [loading, setLoading] = useState(true);

  // 1. POBIERANIE PYTAŃ I GRUPOWANIE PO URL
  useEffect(() => {
    const fetchQuestions = async () => {
      // 1. Znajdź obecną kwalifikację
      const currentQual = QUALIFICATIONS_DATA.find(q => q.id === currentExamId);
      
      if (!currentQual?.apiUrl) {
        console.warn(`[Stats] Brak API URL dla ${currentExamId}`);
        setTotalQuestionsInDb(DEFAULT_TOTAL_QUESTIONS);
        return;
      }

      // 2. Znajdź WSZYSTKIE egzaminy, które korzystają z TEGO SAMEGO pliku JSON.
      // To zapobiega łączeniu niepowiązanych egzaminów (jak inf02 i inf03),
      // ale pozwala łączyć warianty (np. pgf07 i pgf08).
      const examsSharingDatabase = QUALIFICATIONS_DATA.filter(q => q.apiUrl === currentQual.apiUrl);
      
      // Zapisujemy ID, żeby połączyć historię wszystkich wariantów
      const relatedIds = examsSharingDatabase.map(q => q.id);
      setRelatedExamIds(relatedIds);

      console.log(`[Stats] Baza: ${currentExamId}. Powiązane ID: ${relatedIds.join(', ')}`);

      try {
        // 3. Pobieramy plik JSON (tylko raz, bo URL jest ten sam dla wszystkich)
        const response = await fetch(currentQual.apiUrl);
        const data = await response.json();
        
        let questionsList: any[] = [];
        if (Array.isArray(data)) questionsList = data;
        else if (data.questions && Array.isArray(data.questions)) questionsList = data.questions;

        // 4. Liczymy UNIKALNE ID pytań
        const uniqueIds = new Set<string | number>();
        questionsList.forEach((q: any) => {
          if (q?.id !== undefined) {
            uniqueIds.add(q.id);
          } else if (q?.text) {
             // Fallback dla pytań bez ID: używamy treści
             uniqueIds.add(q.text.trim());
          }
        });

        const total = uniqueIds.size;
        console.log(`[Stats] Znaleziono ${total} unikalnych pytań w bazie.`);
        
        if (total > 0) {
          setTotalQuestionsInDb(total);
        }

      } catch (e) {
        console.warn(`[Stats] Błąd pobierania pytań:`, e);
      }
    };

    fetchQuestions();
  }, [currentExamId]);


  // 2. POBIERANIE HISTORII (Filtrowane po relatedExamIds)
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(
      collection(db, 'users', userId, 'history'),
      where('mode', '==', 'exam'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exams: ExamHistoryEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Sprawdzamy, czy egzamin należy do naszej grupy (np. pgf07 i pgf08)
        if (relatedExamIds.includes(data.examId)) {
           exams.push({ id: doc.id, ...data } as ExamHistoryEntry);
        }
      });
      setHistory(exams);
    }, (error) => {
      console.error("Błąd pobierania historii:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, relatedExamIds]); // Reaguje na zmianę grupy


  // 3. OBLICZANIE
  useEffect(() => {
    calculateStats(history);
  }, [history, totalQuestionsInDb]);

  const calculateStats = (exams: ExamHistoryEntry[]) => {
    if (exams.length === 0) {
      setStats({
        totalExams: 0, passedCount: 0, failedCount: 0, passRate: 0,
        averageScore: 0, bestScore: 0, worstScore: 0, averageTimeSeconds: 0,
        questionsKnown: 0, questionsMistakes: 0, 
        questionsToDiscover: totalQuestionsInDb,
        totalQuestionsInDb: totalQuestionsInDb
      });
      setLoading(false);
      return;
    }

    let passed = 0;
    let totalScore = 0;
    let totalTime = 0;
    let maxScore = 0;
    let minScore = 40; 

    const knownQuestions = new Set<string | number>();
    const mistakenQuestions = new Set<string | number>();

    exams.forEach(exam => {
      if (exam.passed) passed++;
      totalScore += exam.score;
      totalTime += exam.timeSpentSeconds || 0;
      if (exam.score > maxScore) maxScore = exam.score;
      if (exam.score < minScore) minScore = exam.score;

      if (exam.answers) {
        exam.answers.forEach(ans => {
          if (ans.isCorrect) {
            knownQuestions.add(ans.questionId);
            if (mistakenQuestions.has(ans.questionId)) {
              mistakenQuestions.delete(ans.questionId);
            }
          } else {
            if (!knownQuestions.has(ans.questionId)) {
              mistakenQuestions.add(ans.questionId);
            }
          }
        });
      }
    });

    const uniqueKnown = knownQuestions.size;
    const uniqueMistakes = mistakenQuestions.size;
    const discovered = uniqueKnown + uniqueMistakes;
    const toDiscover = Math.max(0, totalQuestionsInDb - discovered);

    setStats({
      totalExams: exams.length,
      passedCount: passed,
      failedCount: exams.length - passed,
      passRate: Math.round((passed / exams.length) * 100),
      averageScore: parseFloat((totalScore / exams.length).toFixed(1)),
      bestScore: maxScore,
      worstScore: minScore === 40 && exams.length === 0 ? 0 : minScore,
      averageTimeSeconds: Math.round(totalTime / exams.length),
      
      questionsKnown: uniqueKnown,
      questionsMistakes: uniqueMistakes,
      questionsToDiscover: toDiscover,
      totalQuestionsInDb: totalQuestionsInDb
    });
    
    setLoading(false);
  };

  return { history, stats, loading };
};