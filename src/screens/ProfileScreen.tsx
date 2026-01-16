import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
    signOut(auth).catch(err => console.error(err));
  };

  // --- WIDOK ZALOGOWANEGO UŻYTKOWNIKA ---
  if (user) {
    const isPro = userProfile?.isPro;

    return (
      <View style={styles.containerCenter}>
        <View style={[styles.card, isPro && styles.cardPro]}>
          <Text style={styles.title}>Witaj, {userProfile?.username || 'Użytkowniku'}!</Text>
          <Text style={styles.subtitle}>{user.email}</Text>
          
          <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
            <Text style={[styles.badgeText, isPro ? styles.textPro : styles.textFree]}>
              {isPro ? 'WERSJA PRO 👑' : 'WERSJA FREE'}
            </Text>
          </View>

          {!isPro && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleBuyPro}>
              <Text style={styles.upgradeText}>KUP WERSJĘ PRO (Symulacja)</Text>
            </TouchableOpacity>
          )}

          {isPro && (
             <Text style={styles.proBenefits}>
               Masz dostęp do trenera błędów, statystyk i braku reklam!
             </Text>
          )}

          {/* --- NOWY PRZYCISK STATYSTYK --- */}
          <TouchableOpacity 
            style={styles.statsButton} 
            onPress={() => navigation.navigate('Statistics')}
          >
            <Text style={styles.statsButtonText}>📊 ZOBACZ STATYSTYKI</Text>
          </TouchableOpacity>
          {/* ------------------------------- */}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Wyloguj się</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- WIDOK FORMULARZA (BEZ ZMIAN) ---
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  containerCenter: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F5F7FA' },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F5F7FA' },
  
  header: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 5, width: '100%' },
  cardPro: { borderColor: '#FFD700', borderWidth: 2 },
  
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  
  badge: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  badgeFree: { backgroundColor: '#E0E0E0' },
  badgePro: { backgroundColor: '#FFF5E1' },
  badgeText: { fontWeight: 'bold' },
  textFree: { color: '#555' },
  textPro: { color: '#D4AF37' },

  proBenefits: { marginTop: 15, textAlign: 'center', color: '#666', fontStyle: 'italic' },

  upgradeButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  upgradeText: { color: '#fff', fontWeight: 'bold' },

  // --- NOWE STYLE DLA STATYSTYK ---
  statsButton: { backgroundColor: '#34C759', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 15 },
  statsButtonText: { color: '#fff', fontWeight: 'bold' },
  // --------------------------------

  logoutButton: { marginTop: 30, padding: 10 },
  logoutText: { color: 'red', fontWeight: 'bold' },

  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  mainButton: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  mainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { textAlign: 'center', marginTop: 20, color: '#007AFF', fontWeight: '600' },
});