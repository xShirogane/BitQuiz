import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Przykładowe produkty
const SHOP_ITEMS = [
  { id: '1', name: 'Zamrożenie Serii', icon: 'snow', price: 1000, desc: 'Chroni Twoją serię dni (Streak) na jeden dzień nieobecności.', color: '#00C6FF' },
  { id: '2', name: 'Dodatkowe Życie', icon: 'heart', price: 500, desc: 'Pozwala popełnić jeden błąd więcej w trybie One Life.', color: '#FF416C' },
  { id: '3', name: 'Wskazówka 50/50', icon: 'bulb', price: 250, desc: 'Usuwa dwie błędne odpowiedzi w pytaniu.', color: '#FDC830' },
  { id: '4', name: 'Złoty Motyw', icon: 'color-palette', price: 5000, desc: 'Odblokowuje ekskluzywny złoty motyw aplikacji.', color: '#FFD700' },
];

export default function ShopScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [userPoints, setUserPoints] = useState(2450); // Mock punktów (później weźmiesz z bazy)

  const handleBuy = (item: any) => {
    if (userPoints >= item.price) {
      Alert.alert("Sukces!", `Kupiłeś: ${item.name}.`);
      setUserPoints(prev => prev - item.price);
    } else {
      Alert.alert("Za mało punktów", "Rozwiązuj więcej testów, aby zdobyć punkty!");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* NAGŁÓWEK Z PUNKTAMI */}
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
            <Text style={styles.pointsValue}>{userPoints}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* LISTA PRODUKTÓW */}
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dostępne bonusy</Text>
        
        {SHOP_ITEMS.map((item) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.card }]}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={32} color={item.color} />
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.itemDesc, { color: theme.subText }]}>{item.desc}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.buyButton, { backgroundColor: userPoints >= item.price ? theme.primary : theme.border }]}
              onPress={() => handleBuy(item)}
            >
              <Text style={styles.priceText}>{item.price}</Text>
              <Ionicons name="diamond" size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },
  pointsContainer: { alignItems: 'center' },
  pointsLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  pointsRow: { flexDirection: 'row', alignItems: 'center' },
  pointsValue: { fontSize: 42, color: '#FFF', fontWeight: '900', marginLeft: 10 },
  
  listContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemInfo: { flex: 1, marginRight: 10 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  itemDesc: { fontSize: 12, lineHeight: 16 },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  priceText: { color: '#FFF', fontWeight: 'bold', marginRight: 4, fontSize: 14 },
});