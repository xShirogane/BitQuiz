import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- Nasz Context
import { sendPasswordResetEmail, deleteUser, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function SettingsScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  // --- LOGIKA MOTYWU (PRO ONLY) ---
  const handleThemeToggle = () => {
    if (!userProfile?.isPro) {
      Alert.alert(
        "Funkcja Premium 👑",
        "Tryb ciemny jest dostępny tylko dla użytkowników wersji PRO.",
        [{ text: "OK" }]
      );
      return;
    }
    toggleTheme();
  };

  // --- RESZTA LOGIKI (BEZ ZMIAN) ---
  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Wysłano email", `Link do resetu hasła wysłany na: ${user.email}`);
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    }
  };

  const isSessionFresh = () => {
    if (!user?.metadata.lastSignInTime) return false;
    const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
    const now = new Date().getTime();
    return (now - lastSignIn) < 5 * 60 * 1000;
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Usuwanie konta",
      "Czy na pewno chcesz usunąć konto? Tej operacji nie można cofnąć.",
      [
        { text: "Anuluj", style: "cancel" },
        { 
          text: "Usuń", 
          style: "destructive", 
          onPress: async () => {
            if (!isSessionFresh()) {
               Alert.alert("Wymagane logowanie", "Zaloguj się ponownie, aby usunąć konto.");
               return;
            }
            try {
              if (user) {
                await deleteDoc(doc(db, 'users', user.uid));
                await deleteUser(user);
                Alert.alert("Sukces", "Konto usunięte.");
              }
            } catch (error: any) {
               Alert.alert("Błąd", error.message);
            }
          }
        }
      ]
    );
  };

  const SettingItem = ({ icon, label, value, onToggle }: any) => (
    <View style={[styles.itemContainer, { backgroundColor: theme.card }]}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={24} color={theme.text} style={styles.icon} />
        <Text style={[styles.itemText, { color: theme.text }]}>{label}</Text>
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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.sectionHeader}>Aplikacja</Text>
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <SettingItem 
          icon="moon-outline" 
          label="Ciemny motyw" 
          value={isDark} 
          onToggle={handleThemeToggle} 
        />
      </View>

      <Text style={styles.sectionHeader}>Bezpieczeństwo</Text>
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <View style={styles.itemLeft}>
            <Ionicons name="key-outline" size={24} color={theme.primary} style={styles.icon} />
            <Text style={[styles.itemText, { color: theme.primary }]}>Zmień hasło</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.subText} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Strefa niebezpieczna</Text>
      <View style={[styles.section, styles.dangerSection, { backgroundColor: theme.card }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount}>
          <View style={styles.itemLeft}>
            <Ionicons name="trash-outline" size={24} color={theme.danger} style={styles.icon} />
            <Text style={[styles.itemText, { color: theme.danger }]}>Usuń konto</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>BitQuiz v1.0.3</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, flexGrow: 1 },
  sectionHeader: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, marginLeft: 10, textTransform: 'uppercase' },
  section: { borderRadius: 12, overflow: 'hidden', marginBottom: 25, elevation: 2 },
  dangerSection: { borderColor: '#FF3B30', borderWidth: 1 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 15, width: 24, textAlign: 'center' },
  itemText: { fontSize: 16, fontWeight: '500' },
  versionText: { textAlign: 'center', color: '#AAA', fontSize: 12, marginTop: 10 }
});