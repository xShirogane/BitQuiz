import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Linking 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginInput, setLoginInput] = useState('');
  
  const [loading, setLoading] = useState(false);

  // --- LOGIKA LOGOWANIA ---
  const handleLogin = async () => {
    if (!loginInput || !password) return Alert.alert('Błąd', 'Wypełnij wszystkie pola.');
    setLoading(true);
    try {
      let finalEmail = loginInput;
      if (!loginInput.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', loginInput));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) throw new Error('Nie znaleziono użytkownika o takim loginie.');
        finalEmail = querySnapshot.docs[0].data().email;
      }
      await signInWithEmailAndPassword(auth, finalEmail, password);
    } catch (err: any) {
      Alert.alert('Błąd logowania', err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA REJESTRACJI ---
  const handleRegister = async () => {
    if (!email || !password || !username) return Alert.alert('Błąd', 'Wypełnij wszystkie pola.');
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const checkSnapshot = await getDocs(q);
      
      if (!checkSnapshot.empty) throw new Error('Ta nazwa użytkownika jest już zajęta.');

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        email: email,
        username: username,
        isPro: false,
        createdAt: new Date()
      });

      Alert.alert('Sukces', 'Konto utworzone!');
    } catch (err: any) {
      Alert.alert('Błąd rejestracji', err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SYMULACJA ZAKUPU ---
  const handleBuyPro = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isPro: true
      });
      Alert.alert('Gratulacje!', 'Masz teraz dostęp do funkcji PRO.');
    } catch (error: any) {
      Alert.alert('Błąd', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Wylogowanie",
      "Czy na pewno chcesz się wylogować?",
      [
        { text: "Anuluj", style: "cancel" },
        { text: "Wyloguj", style: "destructive", onPress: () => signOut(auth).catch(err => console.error(err)) }
      ]
    );
  };

  // --- SEKCJA LOGOWANIA / PROFILU (RENDEROWANA WARUNKOWO) ---
  const renderHeaderSection = () => {
    if (user) {
      // --- WIDOK ZALOGOWANEGO ---
      const isPro = userProfile?.isPro;
      return (
        <View style={[styles.card, isPro && styles.cardPro]}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>
               {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
             </Text>
          </View>

          <Text style={styles.title}>{userProfile?.username || 'Użytkownik'}</Text>
          <Text style={styles.subtitle}>{user.email}</Text>
          
          <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
            <Text style={[styles.badgeText, isPro ? styles.textPro : styles.textFree]}>
              {isPro ? 'WERSJA PRO 👑' : 'WERSJA FREE'}
            </Text>
          </View>

          {!isPro ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleBuyPro}>
              <Text style={styles.upgradeText}>KUP WERSJĘ PRO (Symulacja)</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.proBenefits}>Twoje konto jest aktywne i bez reklam.</Text>
          )}
        </View>
      );
    } else {
      // --- WIDOK NIEZALOGOWANEGO (FORMULARZ) ---
      return (
        <View style={styles.card}>
          <Text style={styles.header}>{isRegistering ? 'Załóż konto' : 'Zaloguj się'}</Text>
          
          {isRegistering ? (
            <>
              <TextInput 
                style={styles.input} 
                placeholder="Nazwa użytkownika" 
                value={username} 
                onChangeText={setUsername} 
                autoCapitalize="none"
              />
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none"
              />
            </>
          ) : (
            <TextInput 
              style={styles.input} 
              placeholder="Email lub Nazwa użytkownika" 
              value={loginInput} 
              onChangeText={setLoginInput} 
              autoCapitalize="none"
            />
          )}

          <TextInput 
            style={styles.input} 
            placeholder="Hasło" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry
          />

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity 
              style={styles.mainButton} 
              onPress={isRegistering ? handleRegister : handleLogin}
            >
              <Text style={styles.mainButtonText}>
                {isRegistering ? 'ZAREJESTRUJ SIĘ' : 'ZALOGUJ SIĘ'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.switchText}>
              {isRegistering 
                ? 'Masz już konto? Zaloguj się' 
                : 'Nie masz konta? Zarejestruj się'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // --- GŁÓWNY RENDER ---
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        {/* 1. SEKCJA GÓRNA (Profil LUB Logowanie) */}
        {renderHeaderSection()}

        {/* 2. SEKCJA DOLNA (Menu - widoczne ZAWSZE) */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeader}>Opcje aplikacji</Text>

          {/* USTAWIENIA */}
          {/* Opcjonalnie: Możemy ukryć ustawienia dla niezalogowanych, 
              ale lepiej zostawić i obsłużyć logikę wewnątrz SettingsScreen */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="settings-outline" size={24} color="#333" />
            </View>
            <Text style={styles.menuText}>Ustawienia</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* POLITYKA I REGULAMIN */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => Alert.alert("Informacja", "Tutaj pojawi się treść regulaminu i polityki prywatności.")}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="document-text-outline" size={24} color="#333" />
            </View>
            <Text style={styles.menuText}>Polityka i Regulamin</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* KONTAKT */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('Contact')}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="mail-outline" size={24} color="#333" />
            </View>
            <Text style={styles.menuText}>Kontakt / Wsparcie</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* WYLOGUJ (Tylko dla zalogowanych) */}
          {user && (
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemLast]} 
              onPress={handleLogout}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
              </View>
              <Text style={[styles.menuText, { color: '#D32F2F' }]}>Wyloguj się</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F5F7FA', paddingBottom: 50 },

  // Header w karcie logowania
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },

  // Karta (Wspólna dla Profilu i Logowania)
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 20, marginBottom: 10, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardPro: { borderColor: '#FFD700', borderWidth: 2 },
  
  // Elementy Profilu
  avatarPlaceholder: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: '#E1E8ED', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#555' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 15, textAlign: 'center' },
  
  badge: { alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15, marginBottom: 15 },
  badgeFree: { backgroundColor: '#F0F0F0' },
  badgePro: { backgroundColor: '#FFF5E1' },
  badgeText: { fontWeight: 'bold', fontSize: 12 },
  textFree: { color: '#666' },
  textPro: { color: '#D4AF37' },
  proBenefits: { marginTop: 10, textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: 13 },
  upgradeButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 5 },
  upgradeText: { color: '#fff', fontWeight: 'bold' },

  // Elementy Formularza
  input: { backgroundColor: '#F5F7FA', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  mainButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  mainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { textAlign: 'center', marginTop: 20, color: '#007AFF', fontWeight: '600' },

  // Menu / Kafelki
  sectionHeader: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 20, marginBottom: 15, marginLeft: 5 },
  menuSection: { width: '100%' },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }
  },
  menuItemLast: { marginBottom: 30 },
  menuIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#333' },
});