import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatsForExam, ExamResult } from '../statisticsManager';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
}));

describe('statisticsManager', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockClear();
  });

  describe('getStatsForExam', () => {
    it('returns default stats when no data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const stats = await getStatsForExam('inf02');

      expect(stats).toEqual({
        solvedQuestions: 0,
        averageAccuracy: 0,
        bestScore: '0/0'
      });
    });

    it('returns default stats when no data for specific exam', async () => {
      const data: ExamResult[] = [
        { examId: 'other_exam', score: 30, total: 40, date: '2023-01-01', mode: 'exam' }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const stats = await getStatsForExam('inf02');

      expect(stats).toEqual({
        solvedQuestions: 0,
        averageAccuracy: 0,
        bestScore: '0/0'
      });
    });

    it('calculates stats correctly', async () => {
      const data: ExamResult[] = [
        { examId: 'inf02', score: 20, total: 40, date: '2023-01-01', mode: 'exam' }, // 50%
        { examId: 'inf02', score: 40, total: 40, date: '2023-01-02', mode: 'exam' }, // 100%
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const stats = await getStatsForExam('inf02');

      // solvedQuestions = sum of totals = 40 + 40 = 80
      expect(stats.solvedQuestions).toBe(80);

      // averageAccuracy = (50 + 100) / 2 = 75
      expect(stats.averageAccuracy).toBe(75);

      // bestScore = '40/40' (from the 100% result)
      expect(stats.bestScore).toBe('40/40');
    });

    it('handles best score correctly with different totals', async () => {
        const data: ExamResult[] = [
          { examId: 'inf02', score: 9, total: 10, date: '2023-01-01', mode: 'training' }, // 90%
          { examId: 'inf02', score: 30, total: 40, date: '2023-01-02', mode: 'exam' }, // 75%
        ];
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

        const stats = await getStatsForExam('inf02');

        expect(stats.bestScore).toBe('9/10'); // 90% > 75%
      });
  });
});
