import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkStreakStatus, completeDailyExam } from '../streakManager';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve(null)),
  multiRemove: jest.fn(() => Promise.resolve(null)),
}));

describe('streakManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-10-10T12:00:00')); // Today is 2023-10-10
    (AsyncStorage.getItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkStreakStatus', () => {
    it('returns default for new user', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await checkStreakStatus();

      expect(result).toEqual({
        currentStreak: 0,
        bestStreak: 0,
        lastVisitDate: null,
        didPracticeToday: false
      });
    });

    it('returns data if visited today', async () => {
      const data = {
        currentStreak: 5,
        bestStreak: 10,
        lastVisitDate: '2023-10-10',
        didPracticeToday: true
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const result = await checkStreakStatus();
      expect(result).toEqual(data);
    });

    it('returns data if visited yesterday (streak active)', async () => {
      const data = {
        currentStreak: 5,
        bestStreak: 10,
        lastVisitDate: '2023-10-09',
        didPracticeToday: true
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const result = await checkStreakStatus();
      expect(result.currentStreak).toBe(5);
      expect(result.didPracticeToday).toBe(false);
    });

    it('resets streak if missed a day', async () => {
      const data = {
        currentStreak: 5,
        bestStreak: 10,
        lastVisitDate: '2023-10-08', // 2 days ago
        didPracticeToday: true
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const result = await checkStreakStatus();
      expect(result.currentStreak).toBe(0);
      expect(result.didPracticeToday).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalled(); // Should save reset
    });
  });

  describe('completeDailyExam', () => {
    it('starts streak for new user', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await completeDailyExam();

      expect(result.currentStreak).toBe(1);
      expect(result.lastVisitDate).toBe('2023-10-10');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('increments streak if visited yesterday', async () => {
      const data = {
        currentStreak: 5,
        bestStreak: 10,
        lastVisitDate: '2023-10-09',
        didPracticeToday: true
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const result = await completeDailyExam();

      expect(result.currentStreak).toBe(6);
      expect(result.lastVisitDate).toBe('2023-10-10');
    });

    it('does not increment if already done today', async () => {
      const data = {
        currentStreak: 5,
        bestStreak: 10,
        lastVisitDate: '2023-10-10',
        didPracticeToday: true
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const result = await completeDailyExam();

      expect(result.currentStreak).toBe(5); // Should not change
    });

    it('resets streak if missed a day but sets to 1 for today', async () => {
       const data = {
        currentStreak: 5,
        bestStreak: 10,
        lastVisitDate: '2023-10-08',
        didPracticeToday: true
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(data));

      const result = await completeDailyExam();

      expect(result.currentStreak).toBe(1);
      expect(result.lastVisitDate).toBe('2023-10-10');
    });
  });
});
