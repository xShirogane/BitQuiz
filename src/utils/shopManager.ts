// src/utils/shopManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { spendCoins } from './coinManager';

const INVENTORY_KEY = 'user_inventory_v1';

// --- TYPY ---
export type ItemType = 'consumable' | 'permanent';
export type ItemCategory = 'bonus' | 'theme';

export interface ShopItem {
    id: string;
    name: string;
    desc: string;
    price: number;
    icon: string;
    color: string;
    type: ItemType;
    category: ItemCategory;
}

export interface InventoryItem {
    itemId: string;
    quantity: number; // Dla consumable: ilość; dla permanent: 1 = posiada
}

export interface Inventory {
    items: InventoryItem[];
}

// --- KATALOG PRODUKTÓW ---
export const SHOP_CATALOG: ShopItem[] = [
    // BONUSY (consumable)
    {
        id: 'streak_freeze',
        name: 'Zamrożenie Serii',
        desc: 'Chroni Twoją serię dni (Streak) na jeden dzień nieobecności.',
        price: 200,
        icon: 'snow',
        color: '#00C6FF',
        type: 'consumable',
        category: 'bonus',
    },
    {
        id: 'extra_life',
        name: 'Dodatkowe Życie',
        desc: 'Pozwala popełnić jeden błąd więcej w trybie One Life.',
        price: 150,
        icon: 'heart',
        color: '#FF416C',
        type: 'consumable',
        category: 'bonus',
    },
    {
        id: 'hint_5050',
        name: 'Wskazówka 50/50',
        desc: 'Usuwa dwie błędne odpowiedzi w pytaniu.',
        price: 75,
        icon: 'bulb',
        color: '#FDC830',
        type: 'consumable',
        category: 'bonus',
    },

    // MOTYWY (permanent)
    {
        id: 'theme_gold',
        name: 'Złoty Motyw',
        desc: 'Odblokowuje ekskluzywny złoty motyw aplikacji.',
        price: 1500,
        icon: 'color-palette',
        color: '#FFD700',
        type: 'permanent',
        category: 'theme',
    },
    {
        id: 'theme_ocean',
        name: 'Oceaniczny Motyw',
        desc: 'Chłodne niebieskie odcienie oceanu.',
        price: 1000,
        icon: 'water',
        color: '#0077B6',
        type: 'permanent',
        category: 'theme',
    },
    {
        id: 'theme_neon',
        name: 'Neonowy Motyw',
        desc: 'Futurystyczny motyw z neonowymi akcentami.',
        price: 1200,
        icon: 'flash',
        color: '#39FF14',
        type: 'permanent',
        category: 'theme',
    },
];

// --- FIREBASE SYNC ---
const syncInventoryToFirebase = async (inventory: Inventory): Promise<void> => {
    try {
        const user = auth.currentUser;
        if (!user) return;
        await setDoc(doc(db, 'users', user.uid, 'progress', 'inventory'), {
            items: inventory.items,
            updatedAt: Date.now(),
        }, { merge: true });
    } catch (error) {
        console.error('❌ [Inventory Sync] Błąd:', error);
    }
};

const loadInventoryFromFirebase = async (): Promise<Inventory | null> => {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'progress', 'inventory'));
        if (!docSnap.exists()) return null;
        return { items: docSnap.data().items || [] };
    } catch (error) {
        console.error('❌ [Inventory Load] Błąd:', error);
        return null;
    }
};

// --- POBIERZ INVENTORY ---
export const getInventory = async (): Promise<Inventory> => {
    try {
        const json = await AsyncStorage.getItem(INVENTORY_KEY);
        const local: Inventory = json ? JSON.parse(json) : { items: [] };
        const fb = await loadInventoryFromFirebase();

        // Merge: bierz większy zbiór
        if (fb && fb.items.length > local.items.length) {
            await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(fb));
            return fb;
        }
        if (fb && local.items.length > fb.items.length) {
            syncInventoryToFirebase(local);
        }
        return local;
    } catch {
        return { items: [] };
    }
};

// --- KUP PRZEDMIOT ---
export const purchaseItem = async (itemId: string): Promise<{
    success: boolean;
    message: string;
    newBalance?: number;
}> => {
    const item = SHOP_CATALOG.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Przedmiot nie istnieje.' };

    const inventory = await getInventory();

    // Permanent: sprawdź czy już posiadasz
    if (item.type === 'permanent') {
        const existing = inventory.items.find(i => i.itemId === itemId);
        if (existing && existing.quantity > 0) {
            return { success: false, message: 'Już posiadasz ten przedmiot!' };
        }
    }

    // Sprawdź saldo i wydaj monety
    const result = await spendCoins(item.price);
    if (!result.success) {
        return { success: false, message: 'Za mało monet!' };
    }

    // Dodaj do inventory
    const existingItem = inventory.items.find(i => i.itemId === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        inventory.items.push({ itemId, quantity: 1 });
    }

    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    syncInventoryToFirebase(inventory);

    console.log(`🛍️ Kupiono: ${item.name} | Saldo: ${result.newBalance}`);
    return { success: true, message: `Kupiono: ${item.name}!`, newBalance: result.newBalance };
};

// --- SPRAWDŹ CZY POSIADA ---
export const hasItem = async (itemId: string): Promise<boolean> => {
    const inventory = await getInventory();
    const item = inventory.items.find(i => i.itemId === itemId);
    return !!item && item.quantity > 0;
};

// --- ILOŚĆ POSIADANEGO CONSUMABLE ---
export const getItemQuantity = async (itemId: string): Promise<number> => {
    const inventory = await getInventory();
    const item = inventory.items.find(i => i.itemId === itemId);
    return item ? item.quantity : 0;
};

// --- ZUŻYJ CONSUMABLE ---
export const useItem = async (itemId: string): Promise<boolean> => {
    const inventory = await getInventory();
    const item = inventory.items.find(i => i.itemId === itemId);

    if (!item || item.quantity <= 0) return false;

    item.quantity -= 1;
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    syncInventoryToFirebase(inventory);

    const catalogItem = SHOP_CATALOG.find(i => i.id === itemId);
    console.log(`🔧 Użyto: ${catalogItem?.name || itemId}`);
    return true;
};
