import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { sendPasswordResetEmail, deleteUser, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function SettingsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // --- LOGIKA ZMIANY HASŁA ---
  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert(
        "Wysłano email", 
        `Link do resetowania hasła został wysłany na adres: ${user.email}. Sprawdź skrzynkę!`
      );
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    }
  };

  // --- SPRAWDZANIE ŚWIEŻOŚCI SESJI ---
  const isSessionFresh = () => {
    if (!user?.metadata.lastSignInTime) return false;
    
    const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;

    // Jeśli minęło mniej niż 5 minut, uznajemy sesję za świeżą
    return (now - lastSignIn) < fiveMinutes;
  };

  // --- LOGIKA USUWANIA KONTA (BEZPIECZNA) ---
  const handleDeleteAccount = () => {
    Alert.alert(
      "Usuwanie konta",
      "Ta operacja jest nieodwracalna. Czy na pewno chcesz usunąć konto i wszystkie dane?",
      [
        { text: "Anuluj", style: "cancel" },
        { 
          text: "Usuń na zawsze", 
          style: "destructive", 
          onPress: async () => {
            // 1. Ochrona przed "Zombie Account":
            // Sprawdzamy czas logowania PRZED usunięciem czegokolwiek z bazy.
            if (!isSessionFresh()) {
               Alert.alert(
                  "Wymagane ponowne logowanie",
                  "Ze względów bezpieczeństwa (ochrona danych), aby usunąć konto, musisz się wylogować i zalogować ponownie. Zrób to teraz, aby odświeżyć sesję.",
                  [
                    { text: "Anuluj", style: "cancel" },
                    { 
                        text: "Wyloguj mnie", 
                        onPress: () => signOut(auth) 
                    }
                  ]
                );
                return; // PRZERYWAMY, nic nie usuwamy!
            }

            // 2. Jeśli sesja jest świeża, usuwamy dane:
            try {
              if (user) {
                // Najpierw baza danych
                await deleteDoc(doc(db, 'users', user.uid));
                
                // Potem Auth
                await deleteUser(user);
                
                Alert.alert("Sukces", "Konto zostało usunięte.");
              }
            } catch (error: any) {
              console.error("Błąd usuwania konta:", error);
              
              // Fallback: Jeśli mimo wszystko wyskoczy błąd (np. równo w 5:01 minucie)
              if (error.code === 'auth/requires-recent-login') {
                 Alert.alert("Błąd krytyczny", "Sesja wygasła w trakcie operacji. Twoje dane profilowe mogły zostać usunięte. Zaloguj się ponownie E-MAILEM, aby dokończyć usuwanie konta.");
              } else {
                 Alert.alert("Błąd", "Nie udało się usunąć konta: " + error.message);
              }
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, label, value, onToggle }: any) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={24} color="#555" style={styles.icon} />
        <Text style={styles.itemText}>{label}</Text>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: "#767577", true: "#34C759" }}
        thumbColor={"#f4f3f4"}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionHeader}>Aplikacja</Text>
      <View style={styles.section}>
        <SettingItem 
          icon="moon-outline" 
          label="Ciemny motyw (Wkrótce)" 
          value={isDarkTheme} 
          onToggle={() => setIsDarkTheme(!isDarkTheme)} 
        />
      </View>

      <Text style={styles.sectionHeader}>Bezpieczeństwo</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <View style={styles.itemLeft}>
            <Ionicons name="key-outline" size={24} color="#007AFF" style={styles.icon} />
            <Text style={[styles.itemText, { color: '#007AFF' }]}>Zmień hasło</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Strefa niebezpieczna</Text>
      <View style={[styles.section, styles.dangerSection]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount}>
          <View style={styles.itemLeft}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" style={styles.icon} />
            <Text style={[styles.itemText, { color: '#FF3B30' }]}>Usuń konto</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>BitQuiz v1.0.2</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, backgroundColor: '#F5F7FA', flexGrow: 1 },
  sectionHeader: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, marginLeft: 10, textTransform: 'uppercase' },
  section: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 25, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  dangerSection: { borderColor: '#FF3B30', borderWidth: 1 },
  
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 15, width: 24, textAlign: 'center' },
  itemText: { fontSize: 16, fontWeight: '500', color: '#333' },
  
  versionText: { textAlign: 'center', color: '#AAA', fontSize: 12, marginTop: 10 }
});