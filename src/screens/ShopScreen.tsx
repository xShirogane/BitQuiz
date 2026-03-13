import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getCoins } from '../utils/coinManager';
import { SHOP_CATALOG, ShopItem, purchaseItem, getInventory, Inventory } from '../utils/shopManager';

export default function ShopScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [userCoins, setUserCoins] = useState(0);
  const [inventory, setInventory] = useState<Inventory>({ items: [] });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const coinData = await getCoins();
      setUserCoins(coinData.balance);
      const inv = await getInventory();
      setInventory(inv);
    } catch (e) {
      console.error('Błąd ładowania sklepu:', e);
    } finally {
      setLoading(false);
    }
  };

  const getOwnedQuantity = (itemId: string): number => {
    const item = inventory.items.find(i => i.itemId === itemId);
    return item ? item.quantity : 0;
  };

  const handleBuy = async (item: ShopItem) => {
    if (item.type === 'permanent' && getOwnedQuantity(item.id) > 0) {
      Alert.alert('Posiadasz!', 'Już masz ten przedmiot.');
      return;
    }
    if (userCoins < item.price) {
      Alert.alert('Za mało monet 💎', 'Rozwiązuj testy i wyzwania, żeby zdobyć więcej monet!');
      return;
    }
    Alert.alert(
      'Potwierdzenie',
      `Kupić ${item.name} za ${item.price} 💎?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Kup!',
          onPress: async () => {
            const result = await purchaseItem(item.id);
            if (result.success) {
              Alert.alert('Sukces! 🎉', result.message);
              await loadData();
            } else {
              Alert.alert('Błąd', result.message);
            }
          },
        },
      ]
    );
  };

  const bonusItems = SHOP_CATALOG.filter(i => i.category === 'bonus');
  const themeItems = SHOP_CATALOG.filter(i => i.category === 'theme');

  const renderItem = (item: ShopItem) => {
    const owned = getOwnedQuantity(item.id);
    const isPermanentOwned = item.type === 'permanent' && owned > 0;
    const canAfford = userCoins >= item.price;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.itemCard, { backgroundColor: theme.card, borderColor: item.color + '30' }]}
        onPress={() => handleBuy(item)}
        activeOpacity={isPermanentOwned ? 1 : 0.7}
      >
        {/* Kolorowa linia z lewej */}
        <View style={[styles.cardAccent, { backgroundColor: item.color + '40' }]} />

        {/* Ikona */}
        <View style={[styles.iconBox, { backgroundColor: item.color + '25' }]}>
          <Ionicons name={item.icon as any} size={30} color={item.color} />
        </View>

        {/* Info */}
        <View style={styles.itemInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
            {item.type === 'consumable' && owned > 0 && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>x{owned}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.itemDesc, { color: theme.subText }]}>{item.desc}</Text>
        </View>

        {/* Cena / Posiadasz */}
        {isPermanentOwned ? (
          <View style={styles.ownedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.ownedText}>Masz</Text>
          </View>
        ) : (
          <LinearGradient
            colors={canAfford ? ['#7F00FF', '#B347FF'] : ['#333', '#444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyButton}
          >
            <Text style={styles.priceText}>{item.price}</Text>
            <Ionicons name="diamond" size={11} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />

      {/* NAGŁÓWEK */}
      <LinearGradient colors={['#7F00FF', '#E100FF']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sklep Gracza</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>TWOJE PUNKTY</Text>
          <View style={styles.pointsRow}>
            <Ionicons name="diamond" size={32} color="#FFD700" />
            <Text style={styles.pointsValue}>{userCoins}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* PRODUKTY */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dostępne bonusy</Text>
        {bonusItems.map(renderItem)}

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}>🎨 Motywy</Text>
        {themeItems.map(renderItem)}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  pointsContainer: { alignItems: 'center' },
  pointsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  pointsRow: { flexDirection: 'row', alignItems: 'center' },
  pointsValue: { fontSize: 42, color: '#FFF', fontWeight: '900', marginLeft: 10 },

  listContent: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemInfo: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: 'bold' },
  itemDesc: { fontSize: 12, lineHeight: 16 },

  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 4,
  },
  priceText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  quantityBadge: {
    marginLeft: 6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#7F00FF',
  },
  quantityText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(76,175,80,0.15)',
    gap: 4,
  },
  ownedText: { color: '#4CAF50', fontSize: 12, fontWeight: '700' },
});