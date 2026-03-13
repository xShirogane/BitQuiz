// src/utils/xpManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const XP_KEY = 'user_xp_v1';

// --- PROGI POZIOMÓW (PODWYŻSZONE) ---
export const LEVEL_THRESHOLDS = [
    { level: 1, xp: 0, name: 'Początkujący' },
    { level: 2, xp: 300, name: 'Uczeń' },
    { level: 3, xp: 750, name: 'Student' },
    { level: 4, xp: 1500, name: 'Praktykant' },
    { level: 5, xp: 2800, name: 'Technik' },
    { level: 6, xp: 5000, name: 'Specjalista' },
    { level: 7, xp: 8000, name: 'Ekspert' },
    { level: 8, xp: 12000, name: 'Mistrz' },
    { level: 9, xp: 18000, name: 'Guru' },
    { level: 10, xp: 25000, name: 'Legenda' },
];

export interface XPData {
    totalXP: number;
    firstExamToday: boolean;
    lastExamDate: string | null;
}

// --- ŹRÓDŁA XP ---
export const XP_REWARDS = {
    EXAM_COMPLETE: 50,
    EXAM_LONG: 100,
    EXAM_PASSED_BONUS: 30,
    EXAM_PERFECT_BONUS: 50,
    FIRST_EXAM_OF_DAY: 25,
    DAILY_STREAK_PER_DAY: 20,
    STREAK_7_BONUS: 200,
    STREAK_30_BONUS: 1000,
    DAILY_CHALLENGE: 50,
    MISTAKE_REVIEW_PER: 10,
    QUALIFICATION_COMPLETE: 500,
    MULTIPLAYER_WIN: 75,
};

// --- HELPERS ---
const getLocalYMD = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- FIREBASE SYNC ---
const syncToFirebase = async (data: XPData): Promise<void> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log('⚠️ [XP Sync] Nie zalogowany - pomijam sync do Firebase');
            return;
        }

        const levelInfo = getLevelInfo(data.totalXP);
        await setDoc(doc(db, 'users', user.uid, 'progress', 'xp'), {
            totalXP: data.totalXP,
            firstExamToday: data.firstExamToday,
            lastExamDate: data.lastExamDate,
            level: levelInfo.level,
            levelName: levelInfo.levelName,
            updatedAt: Date.now(),
        }, { merge: true });
        console.log(`✅ [XP Sync] Zapisano do Firebase: ${data.totalXP} XP (Lvl ${levelInfo.level}) dla ${user.uid}`);
    } catch (error) {
        console.error('❌ [XP Sync] Błąd synchronizacji z Firebase:', error);
    }
};

const loadFromFirebase = async (): Promise<XPData | null> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log('⚠️ [XP Load] Nie zalogowany - pomijam load z Firebase');
            return null;
        }

        const docSnap = await getDoc(doc(db, 'users', user.uid, 'progress', 'xp'));
        if (!docSnap.exists()) {
            console.log('ℹ️ [XP Load] Brak danych XP w Firebase dla', user.uid);
            return null;
        }

        const fbData = docSnap.data();
        console.log(`✅ [XP Load] Załadowano z Firebase: ${fbData.totalXP} XP`);
        return {
            totalXP: fbData.totalXP || 0,
            firstExamToday: fbData.firstExamToday || false,
            lastExamDate: fbData.lastExamDate || null,
        };
    } catch (error) {
        console.error('❌ [XP Load] Błąd ładowania z Firebase:', error);
        return null;
    }
};

// --- POBIERZ DANE XP (lokalne + Firebase merge) ---
export const getXPData = async (): Promise<XPData> => {
    try {
        // 1. Pobierz lokalne dane
        const json = await AsyncStorage.getItem(XP_KEY);
        const localData: XPData = json
            ? JSON.parse(json)
            : { totalXP: 0, firstExamToday: false, lastExamDate: null };

        // 2. Pobierz z Firebase (jeśli zalogowany)
        const fbData = await loadFromFirebase();

        // 3. Merge: bierz wyższe XP (w razie rozjazdu między urządzeniami)
        if (fbData && fbData.totalXP > localData.totalXP) {
            // Firebase ma więcej – zaktualizuj lokalne
            await AsyncStorage.setItem(XP_KEY, JSON.stringify(fbData));
            return fbData;
        }

        // 4. Jeśli lokalne > Firebase, zsynchronizuj w górę
        if (fbData && localData.totalXP > fbData.totalXP) {
            await syncToFirebase(localData);
        }

        // Reset flagi "pierwszy egzamin dnia" jeśli nowy dzień
        const today = getLocalYMD();
        if (localData.lastExamDate !== today) {
            localData.firstExamToday = false;
        }

        return localData;
    } catch {
        return { totalXP: 0, firstExamToday: false, lastExamDate: null };
    }
};

// --- ZAPISZ DANE XP (local + Firebase) ---
const saveXPData = async (data: XPData): Promise<void> => {
    await AsyncStorage.setItem(XP_KEY, JSON.stringify(data));
    // Synchronizuj z Firebase w tle
    syncToFirebase(data);
};

// --- OBLICZ POZIOM Z XP ---
export const getLevelInfo = (totalXP: number) => {
    let currentLevel = LEVEL_THRESHOLDS[0];
    let nextLevel: typeof LEVEL_THRESHOLDS[0] | null = LEVEL_THRESHOLDS[1];

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
            currentLevel = LEVEL_THRESHOLDS[i];
            nextLevel = LEVEL_THRESHOLDS[i + 1] || null;
            break;
        }
    }

    const xpInCurrentLevel = totalXP - currentLevel.xp;
    const xpNeededForNext = nextLevel ? nextLevel.xp - currentLevel.xp : 0;
    const progress = nextLevel ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;

    return {
        level: currentLevel.level,
        levelName: currentLevel.name,
        totalXP,
        currentLevelXP: xpInCurrentLevel,
        requiredLevelXP: xpNeededForNext,
        nextLevelTotalXP: nextLevel ? nextLevel.xp : currentLevel.xp,
        progress: Math.min(progress, 100),
        isMaxLevel: !nextLevel,
    };
};

// --- DODAJ XP ---
export const addXP = async (amount: number, reason?: string): Promise<{ newTotal: number; xpGained: number; leveledUp: boolean; oldLevel: number; newLevel: number }> => {
    const data = await getXPData();
    const oldLevel = getLevelInfo(data.totalXP).level;

    data.totalXP += amount;
    await saveXPData(data);

    const newLevel = getLevelInfo(data.totalXP).level;

    if (reason) console.log(`🏅 +${amount} XP (${reason}) | Total: ${data.totalXP}`);

    return {
        newTotal: data.totalXP,
        xpGained: amount,
        leveledUp: newLevel > oldLevel,
        oldLevel,
        newLevel,
    };
};

// --- XP ZA UKOŃCZENIE EGZAMINU ---
export const awardExamXP = async (
    score: number,
    total: number,
    mode: string
): Promise<{ totalXPGained: number; breakdown: string[] }> => {
    let totalGained = 0;
    const breakdown: string[] = [];
    const data = await getXPData();
    const today = getLocalYMD();

    const baseXP = total >= 40 ? XP_REWARDS.EXAM_LONG : XP_REWARDS.EXAM_COMPLETE;
    totalGained += baseXP;
    breakdown.push(`Ukończenie egzaminu: +${baseXP} XP`);

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    if (percentage >= 50) {
        totalGained += XP_REWARDS.EXAM_PASSED_BONUS;
        breakdown.push(`Zdany egzamin: +${XP_REWARDS.EXAM_PASSED_BONUS} XP`);
    }

    if (percentage === 100) {
        totalGained += XP_REWARDS.EXAM_PERFECT_BONUS;
        breakdown.push(`Perfekcyjny wynik!: +${XP_REWARDS.EXAM_PERFECT_BONUS} XP`);
    }

    if (!data.firstExamToday || data.lastExamDate !== today) {
        totalGained += XP_REWARDS.FIRST_EXAM_OF_DAY;
        breakdown.push(`Pierwszy egzamin dnia: +${XP_REWARDS.FIRST_EXAM_OF_DAY} XP`);
        data.firstExamToday = true;
    }

    data.lastExamDate = today;
    data.totalXP += totalGained;
    await saveXPData(data);

    return { totalXPGained: totalGained, breakdown };
};

// --- XP ZA STREAK ---
export const awardStreakXP = async (currentStreak: number): Promise<number> => {
    let totalGained = 0;

    totalGained += XP_REWARDS.DAILY_STREAK_PER_DAY;

    if (currentStreak === 7) {
        totalGained += XP_REWARDS.STREAK_7_BONUS;
    }
    if (currentStreak === 30) {
        totalGained += XP_REWARDS.STREAK_30_BONUS;
    }

    if (totalGained > 0) {
        await addXP(totalGained, `Seria ${currentStreak} dni`);
    }

    return totalGained;
};

// --- XP ZA WYGRANĄ MULTIPLAYER ---
export const awardMultiplayerWinXP = async (): Promise<number> => {
    await addXP(XP_REWARDS.MULTIPLAYER_WIN, 'Wygrana 1vs1');
    return XP_REWARDS.MULTIPLAYER_WIN;
};

// --- XP ZA POPRAWIENIE BŁĘDÓW ---
export const awardMistakeReviewXP = async (mistakeCount: number): Promise<number> => {
    const xp = mistakeCount * XP_REWARDS.MISTAKE_REVIEW_PER;
    if (xp > 0) {
        await addXP(xp, `Poprawione ${mistakeCount} błędów`);
    }
    return xp;
};
