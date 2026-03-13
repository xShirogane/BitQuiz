// src/utils/dailyChallengeManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUALIFICATIONS_DATA, Qualification } from '../data/categories';
import { addXP, XP_REWARDS } from './xpManager';

const DAILY_CHALLENGE_KEY = 'daily_challenge_v2';

// --- TYPY WYZWAŃ ---
export type ChallengeType =
    | 'score_target'      // Zdobądź X% w teście Y
    | 'exam_count'         // Rozwiąż N testów dzisiaj
    | 'question_count'     // Odpowiedz na N pytań
    | 'speed_challenge'    // Ukończ test w mniej niż X minut
    | 'multiplayer_win'    // Wygraj pojedynek 1vs1
    | 'perfect_score';     // Zdobądź 100% w dowolnym teście

export interface DailyChallengeData {
    id: string;               // Data: YYYY-MM-DD
    type: ChallengeType;      // Typ wyzwania
    examId?: string;           // ID kwalifikacji (dla score_target / speed_challenge)
    examTitle?: string;
    apiUrl?: string;
    rewardXP: number;
    completed: boolean;
    title: string;             // Opis wyzwania
    icon: string;              // Emoji ikona wyzwania

    // Pola specyficzne dla typów
    requiredScore?: number;     // score_target: wymagany %
    bestScorePercent?: number;  // score_target: najlepszy %
    requiredExams?: number;     // exam_count: ile testów
    completedExams?: number;    // exam_count: ile już zrobione
    requiredQuestions?: number; // question_count: ile pytań
    answeredQuestions?: number; // question_count: ile odpowiedziano
    maxMinutes?: number;        // speed_challenge: max minut
    bestTimeMinutes?: number;   // speed_challenge: najlepszy czas
}

// --- HELPERS ---

const getLocalYMD = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const hashDate = (dateStr: string): number => {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const pickQualification = (dateStr: string, favoriteQualifications?: string[]): Qualification => {
    let pool = QUALIFICATIONS_DATA;
    if (favoriteQualifications && favoriteQualifications.length > 0) {
        const filtered = QUALIFICATIONS_DATA.filter(q => favoriteQualifications.includes(q.id));
        if (filtered.length > 0) pool = filtered;
    }
    return pool[hashDate(dateStr) % pool.length];
};

// --- GENERATORY WYZWAŃ ---

const CHALLENGE_GENERATORS: Record<ChallengeType, (dateStr: string, favQuals?: string[]) => DailyChallengeData> = {

    score_target: (dateStr, favQuals) => {
        const qual = pickQualification(dateStr, favQuals);
        const scoreOptions = [50, 55, 60, 65, 70, 75, 80];
        const requiredScore = scoreOptions[hashDate(dateStr + '_s') % scoreOptions.length];
        return {
            id: dateStr, type: 'score_target', icon: '🎯',
            examId: qual.id, examTitle: qual.title, apiUrl: qual.apiUrl,
            rewardXP: XP_REWARDS.DAILY_CHALLENGE, completed: false,
            title: `Zdobądź ${requiredScore}% w teście ${qual.title}`,
            requiredScore, bestScorePercent: 0,
        };
    },

    exam_count: (dateStr) => {
        const countOptions = [2, 3, 3, 4];
        const requiredExams = countOptions[hashDate(dateStr + '_e') % countOptions.length];
        return {
            id: dateStr, type: 'exam_count', icon: '📚',
            rewardXP: XP_REWARDS.DAILY_CHALLENGE, completed: false,
            title: `Rozwiąż ${requiredExams} testy dzisiaj`,
            requiredExams, completedExams: 0,
        };
    },

    question_count: (dateStr) => {
        const qOptions = [30, 40, 50, 60];
        const requiredQuestions = qOptions[hashDate(dateStr + '_q') % qOptions.length];
        return {
            id: dateStr, type: 'question_count', icon: '💬',
            rewardXP: XP_REWARDS.DAILY_CHALLENGE, completed: false,
            title: `Odpowiedz na ${requiredQuestions} pytań`,
            requiredQuestions, answeredQuestions: 0,
        };
    },

    speed_challenge: (dateStr, favQuals) => {
        const qual = pickQualification(dateStr + '_speed', favQuals);
        const minuteOptions = [5, 7, 8, 10];
        const maxMinutes = minuteOptions[hashDate(dateStr + '_m') % minuteOptions.length];
        return {
            id: dateStr, type: 'speed_challenge', icon: '⚡',
            examId: qual.id, examTitle: qual.title, apiUrl: qual.apiUrl,
            rewardXP: XP_REWARDS.DAILY_CHALLENGE, completed: false,
            title: `Ukończ test ${qual.title} w ${maxMinutes} min`,
            maxMinutes, bestTimeMinutes: undefined,
        };
    },

    multiplayer_win: (dateStr) => {
        return {
            id: dateStr, type: 'multiplayer_win', icon: '⚔️',
            rewardXP: XP_REWARDS.DAILY_CHALLENGE, completed: false,
            title: `Wygraj pojedynek 1vs1`,
        };
    },

    perfect_score: (dateStr) => {
        return {
            id: dateStr, type: 'perfect_score', icon: '🌟',
            rewardXP: XP_REWARDS.DAILY_CHALLENGE, completed: false,
            title: `Zdobądź 100% w dowolnym teście`,
        };
    },
};

// Kolejność typów do cyklicznego losowania
const CHALLENGE_ROTATION: ChallengeType[] = [
    'score_target',
    'exam_count',
    'perfect_score',
    'question_count',
    'speed_challenge',
    'multiplayer_win',
];

// --- GŁÓWNE FUNKCJE ---

export const getDailyChallenge = async (
    favoriteQualifications?: string[]
): Promise<DailyChallengeData> => {
    const today = getLocalYMD();

    try {
        const json = await AsyncStorage.getItem(DAILY_CHALLENGE_KEY);
        if (json) {
            const stored: DailyChallengeData = JSON.parse(json);
            if (stored.id === today) return stored;
        }
    } catch (e) {
        console.error('❌ [DailyChallenge] Błąd odczytu:', e);
    }

    // Deterministycznie wybierz typ na podstawie dnia
    const typeIndex = hashDate(today + '_type') % CHALLENGE_ROTATION.length;
    const challengeType = CHALLENGE_ROTATION[typeIndex];
    const generator = CHALLENGE_GENERATORS[challengeType];
    const challenge = generator(today, favoriteQualifications);

    await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(challenge));
    console.log(`🎯 [DailyChallenge] Nowe wyzwanie (${challengeType}): ${challenge.title}`);
    return challenge;
};

/**
 * Wywołaj po ukończeniu egzaminu (z ResultScreen).
 */
export const checkDailyChallengeAfterExam = async (
    examId: string,
    scorePercent: number,
    totalQuestions: number,
    timeSpentSeconds?: number
): Promise<{ xpAwarded: number; challengeCompleted: boolean }> => {
    try {
        const json = await AsyncStorage.getItem(DAILY_CHALLENGE_KEY);
        if (!json) return { xpAwarded: 0, challengeCompleted: false };

        const ch: DailyChallengeData = JSON.parse(json);
        const today = getLocalYMD();
        if (ch.id !== today || ch.completed) return { xpAwarded: 0, challengeCompleted: ch.completed };

        let completed = false;

        switch (ch.type) {
            case 'score_target':
                if (ch.examId === examId) {
                    ch.bestScorePercent = Math.max(ch.bestScorePercent || 0, scorePercent);
                    if (scorePercent >= (ch.requiredScore || 0)) completed = true;
                }
                break;

            case 'exam_count':
                ch.completedExams = (ch.completedExams || 0) + 1;
                if (ch.completedExams >= (ch.requiredExams || 3)) completed = true;
                break;

            case 'question_count':
                ch.answeredQuestions = (ch.answeredQuestions || 0) + totalQuestions;
                if (ch.answeredQuestions >= (ch.requiredQuestions || 50)) completed = true;
                break;

            case 'speed_challenge':
                if (ch.examId === examId && timeSpentSeconds !== undefined) {
                    const timeMinutes = timeSpentSeconds / 60;
                    if (!ch.bestTimeMinutes || timeMinutes < ch.bestTimeMinutes) {
                        ch.bestTimeMinutes = Math.round(timeMinutes * 10) / 10;
                    }
                    if (timeMinutes <= (ch.maxMinutes || 10)) completed = true;
                }
                break;

            case 'perfect_score':
                if (scorePercent === 100) completed = true;
                break;

            // multiplayer_win obsługiwany osobno
            default:
                break;
        }

        if (completed) {
            ch.completed = true;
            await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(ch));
            await addXP(ch.rewardXP, 'Wyzwanie dnia');
            console.log(`🏆 [DailyChallenge] Ukończone! +${ch.rewardXP} XP`);
            return { xpAwarded: ch.rewardXP, challengeCompleted: true };
        }

        await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(ch));
        return { xpAwarded: 0, challengeCompleted: false };
    } catch (e) {
        console.error('❌ [DailyChallenge] Błąd:', e);
        return { xpAwarded: 0, challengeCompleted: false };
    }
};

/**
 * Wywołaj po wygranej 1vs1 (z MultiplayerGameScreen).
 */
export const checkDailyChallengeAfterMultiplayerWin = async (): Promise<{
    xpAwarded: number;
    challengeCompleted: boolean;
}> => {
    try {
        const json = await AsyncStorage.getItem(DAILY_CHALLENGE_KEY);
        if (!json) return { xpAwarded: 0, challengeCompleted: false };

        const ch: DailyChallengeData = JSON.parse(json);
        const today = getLocalYMD();
        if (ch.id !== today || ch.completed || ch.type !== 'multiplayer_win') {
            return { xpAwarded: 0, challengeCompleted: ch.completed };
        }

        ch.completed = true;
        await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(ch));
        await addXP(ch.rewardXP, 'Wyzwanie dnia');
        console.log(`🏆 [DailyChallenge] 1vs1 wygrana! +${ch.rewardXP} XP`);
        return { xpAwarded: ch.rewardXP, challengeCompleted: true };
    } catch (e) {
        console.error('❌ [DailyChallenge] Błąd multiplayer:', e);
        return { xpAwarded: 0, challengeCompleted: false };
    }
};

/**
 * Zwraca sekundy do północy (reset wyzwania).
 */
export const getSecondsUntilReset = (): number => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / 1000);
};

/**
 * Helper: zwróć % postępu wyzwania dla paska.
 */
export const getChallengeProgress = (ch: DailyChallengeData): number => {
    if (ch.completed) return 100;

    switch (ch.type) {
        case 'score_target':
            return Math.min(((ch.bestScorePercent || 0) / (ch.requiredScore || 1)) * 100, 99);
        case 'exam_count':
            return Math.min(((ch.completedExams || 0) / (ch.requiredExams || 1)) * 100, 99);
        case 'question_count':
            return Math.min(((ch.answeredQuestions || 0) / (ch.requiredQuestions || 1)) * 100, 99);
        case 'speed_challenge':
            return ch.bestTimeMinutes !== undefined ? 50 : 0; // Próbowano = 50%, ukończone = 100%
        case 'multiplayer_win':
            return 0;
        case 'perfect_score':
            return 0;
        default:
            return 0;
    }
};

/**
 * Helper: tekst postępu pod paskiem.
 */
export const getChallengeProgressText = (ch: DailyChallengeData): string => {
    if (ch.completed) {
        switch (ch.type) {
            case 'score_target': return `Wynik: ${ch.bestScorePercent}%`;
            case 'speed_challenge': return `Czas: ${ch.bestTimeMinutes} min`;
            default: return 'Ukończone!';
        }
    }

    switch (ch.type) {
        case 'score_target':
            return ch.bestScorePercent ? `Najlepiej: ${ch.bestScorePercent}% / ${ch.requiredScore}%` : `Cel: ${ch.requiredScore}%`;
        case 'exam_count':
            return `${ch.completedExams || 0} / ${ch.requiredExams} testów`;
        case 'question_count':
            return `${ch.answeredQuestions || 0} / ${ch.requiredQuestions} pytań`;
        case 'speed_challenge':
            return ch.bestTimeMinutes !== undefined ? `Najlepiej: ${ch.bestTimeMinutes} min (cel: ${ch.maxMinutes} min)` : `Cel: poniżej ${ch.maxMinutes} min`;
        case 'multiplayer_win':
            return 'Wygraj dowolny pojedynek';
        case 'perfect_score':
            return 'Zdobądź 100% w dowolnym teście';
        default:
            return '';
    }
};
