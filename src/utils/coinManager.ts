// src/utils/coinManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const COINS_KEY = 'user_coins_v1';

export interface CoinData {
    balance: number;
    totalEarned: number;
    lastEarnDate: string | null;
}

// --- ŹRÓDŁA MONET ---
export const COIN_REWARDS = {
    EXAM_COMPLETE: 10,
    EXAM_PASSED: 15,
    EXAM_PERFECT: 30,
    DAILY_CHALLENGE: 25,
    MULTIPLAYER_WIN: 20,
    STREAK_7: 50,
    STREAK_30: 200,
};

// --- HELPERS ---
const getLocalYMD = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// --- FIREBASE SYNC ---
const syncCoinsToFirebase = async (data: CoinData): Promise<void> => {
    try {
        const user = auth.currentUser;
        if (!user) return;
        await setDoc(doc(db, 'users', user.uid, 'progress', 'coins'), {
            balance: data.balance,
            totalEarned: data.totalEarned,
            lastEarnDate: data.lastEarnDate,
            updatedAt: Date.now(),
        }, { merge: true });
        console.log(`✅ [Coins Sync] ${data.balance} monet`);
    } catch (error) {
        console.error('❌ [Coins Sync] Błąd:', error);
    }
};

const loadCoinsFromFirebase = async (): Promise<CoinData | null> => {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'progress', 'coins'));
        if (!docSnap.exists()) return null;
        const d = docSnap.data();
        return { balance: d.balance || 0, totalEarned: d.totalEarned || 0, lastEarnDate: d.lastEarnDate || null };
    } catch (error) {
        console.error('❌ [Coins Load] Błąd:', error);
        return null;
    }
};

// --- POBIERZ SALDO ---
export const getCoins = async (): Promise<CoinData> => {
    try {
        const json = await AsyncStorage.getItem(COINS_KEY);
        const localData: CoinData = json
            ? JSON.parse(json)
            : { balance: 0, totalEarned: 0, lastEarnDate: null };

        const fbData = await loadCoinsFromFirebase();
        if (fbData && fbData.balance > localData.balance) {
            await AsyncStorage.setItem(COINS_KEY, JSON.stringify(fbData));
            return fbData;
        }
        if (fbData && localData.balance > fbData.balance) {
            syncCoinsToFirebase(localData);
        }
        return localData;
    } catch {
        return { balance: 0, totalEarned: 0, lastEarnDate: null };
    }
};

// --- DODAJ MONETY ---
export const addCoins = async (amount: number, reason?: string): Promise<number> => {
    const data = await getCoins();
    data.balance += amount;
    data.totalEarned += amount;
    data.lastEarnDate = getLocalYMD();
    await AsyncStorage.setItem(COINS_KEY, JSON.stringify(data));
    syncCoinsToFirebase(data);
    if (reason) console.log(`💎 +${amount} monet (${reason}) | Saldo: ${data.balance}`);
    return data.balance;
};

// --- WYDAJ MONETY ---
export const spendCoins = async (amount: number): Promise<{ success: boolean; newBalance: number }> => {
    const data = await getCoins();
    if (data.balance < amount) {
        return { success: false, newBalance: data.balance };
    }
    data.balance -= amount;
    await AsyncStorage.setItem(COINS_KEY, JSON.stringify(data));
    syncCoinsToFirebase(data);
    console.log(`🛒 -${amount} monet | Saldo: ${data.balance}`);
    return { success: true, newBalance: data.balance };
};

// --- NAGRODY ZA EGZAMIN ---
export const awardExamCoins = async (
    scorePercent: number,
): Promise<{ coinsGained: number; breakdown: string[] }> => {
    let total = 0;
    const breakdown: string[] = [];

    total += COIN_REWARDS.EXAM_COMPLETE;
    breakdown.push(`Ukończenie egzaminu: +${COIN_REWARDS.EXAM_COMPLETE} 💎`);

    if (scorePercent >= 50) {
        total += COIN_REWARDS.EXAM_PASSED;
        breakdown.push(`Zdany egzamin: +${COIN_REWARDS.EXAM_PASSED} 💎`);
    }

    if (scorePercent === 100) {
        total += COIN_REWARDS.EXAM_PERFECT;
        breakdown.push(`Perfekcyjny wynik: +${COIN_REWARDS.EXAM_PERFECT} 💎`);
    }

    if (total > 0) {
        await addCoins(total, 'Egzamin');
    }

    return { coinsGained: total, breakdown };
};
