import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator, Alert, Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function SupportScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Funkcja otwierająca stronę z kawą
  const openCoffeeLink = async () => {
    // Tutaj wstawisz swój prawdziwy link, np. do buycoffee.to lub buymeacoffee.com
    const url = 'https://buycoffee.to/twojanazwa'; 
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Błąd", "Nie udało się otworzyć linku :(");
    }
  };

  // Funkcja symulująca oglądanie reklamy
  const handleWatchAd = () => {
    setIsWatchingAd(true);
    
    // Symulacja trwania reklamy (5 sekund)
    setTimeout(() => {
      setIsWatchingAd(false);
      Alert.alert(
        "Dziękujemy! ❤️",
        "Dzięki Tobie serwery BitQuiz będą działać o minutę dłużej! Jesteś super!",
        [{ text: "Cieszę się, że pomogłem", style: "default" }]
      );
    }, 5000); // 5000 ms = 5 sekund
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wesprzyj nas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* HERO SECTION - GŁÓWNY TEKST */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#FF416C', '#FF4B2B']}
            style={styles.heartIconContainer}
          >
            <Ionicons name="heart" size={40} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Tworzymy BitQuiz z pasji!
          </Text>
          <Text style={[styles.heroText, { color: theme.subText }]}>
            Aplikacja jest darmowa i rozwijamy ją po godzinach. Jeśli podoba Ci się to, co robimy, możesz nam pomóc w bardzo prosty sposób.
          </Text>
        </View>

        {/* OPCJA 1: KAWA */}
        <TouchableOpacity onPress={openCoffeeLink} activeOpacity={0.9}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconBox}>
                <Ionicons name="cafe" size={32} color="#FFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Postaw nam kawę</Text>
                <Text style={styles.cardSubtitle}>
                  Kofeina zamienia się w kod! Każda kawa to nowe pytania w bazie.
                </Text>
              </View>
              <Ionicons name="open-outline" size={24} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* OPCJA 2: REKLAMA */}
        <TouchableOpacity onPress={handleWatchAd} activeOpacity={0.9}>
          <LinearGradient
            colors={['#8E2DE2', '#4A00E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <View style={styles.iconBox}>
                <Ionicons name="play-circle" size={32} color="#FFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Obejrzyj reklamę</Text>
                <Text style={styles.cardSubtitle}>
                  To nic Cię nie kosztuje, a nam pozwala opłacić serwery.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* PODPIS */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.subText }]}>
            Dziękujemy, że jesteś z nami! {"\n"}
            ~ Zespół BitQuiz
          </Text>
        </View>

      </ScrollView>

      {/* MODAL SYMULUJĄCY REKLAMĘ */}
      <Modal visible={isWatchingAd} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>Oglądanie reklamy...</Text>
            <Text style={{ color: theme.subText, fontSize: 12, marginTop: 5 }}>
              (Symulacja: trwa 5 sekund)
            </Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  
  heroSection: { alignItems: 'center', marginBottom: 30 },
  heartIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 10,
    shadowColor: '#FF416C',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  heroText: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: '90%' },

  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardTextContainer: { flex: 1, marginRight: 10 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 16 },

  footer: { marginTop: 20, alignItems: 'center' },
  footerText: { textAlign: 'center', fontStyle: 'italic', lineHeight: 22 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: 200,
  },
  loadingText: { marginTop: 15, fontWeight: 'bold' },
});