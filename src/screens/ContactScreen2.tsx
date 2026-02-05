import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function Contact2Screen({ navigation }: any) {
  const { theme } = useTheme();

  const openDiscord = async () => {
    // Podmień na swój link zaproszenia do Discorda
    const discordUrl = 'https://discord.gg/twoj-serwer'; 
    const supported = await Linking.canOpenURL(discordUrl);
    
    if (supported) {
      await Linking.openURL(discordUrl);
    } else {
      Alert.alert("Błąd", "Nie udało się otworzyć aplikacji Discord.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Centrum Kontaktu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.menuContainer}>
        <Text style={[styles.title, { color: theme.text }]}>Jak chcesz się skontaktować?</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Dołącz do naszej społeczności lub wyślij zgłoszenie bezpośrednio.
        </Text>

        {/* KAFELEK 1: DISCORD */}
        <TouchableOpacity onPress={openDiscord} activeOpacity={0.9}>
          <LinearGradient
            // POPRAWKA: Dodano 'as const', żeby TS wiedział, że to stała tablica
            colors={['#5865F2', '#4752C4'] as const} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="logo-discord" size={36} color="#FFF" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Dołącz do Discorda</Text>
                <Text style={styles.cardDesc}>
                  Najszybsza pomoc, społeczność i wspólna nauka.
                </Text>
              </View>
              <Ionicons name="open-outline" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* KAFELEK 2: TWÓJ ISTNIEJĄCY FORMULARZ */}
        <TouchableOpacity onPress={() => navigation.navigate('Contact')} activeOpacity={0.9}>
          <LinearGradient
            // POPRAWKA: Rzutujemy na 'any', ponieważ theme.cardGradient może być różnie interpretowany
            colors={(theme.cardGradient || ['#4facfe', '#00f2fe']) as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="mail" size={32} color="#FFF" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>Formularz Zgłoszeniowy</Text>
                <Text style={styles.cardDesc}>
                  Masz problem? Przejdź do formularza.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
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
  
  menuContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, marginBottom: 30, lineHeight: 20 },
  
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
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
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: { flex: 1, marginRight: 10 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 16 },
});