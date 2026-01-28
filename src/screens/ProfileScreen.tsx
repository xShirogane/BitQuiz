import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- IMPORT MOTYWU
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db, storage } from '../config/firebase';
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  const { theme } = useTheme(); // <--- POBIERAMY KOLORY

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // --- ZMIANA AWATARA ---
  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Brak dostępu", "Zezwól na dostęp do zdjęć w ustawieniach.");
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Poprawiona wersja (tablica stringów)
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && user) {
        handleImageUpload(result.assets[0].uri);
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert("Błąd", error.message);
    }
  };

  const handleImageUpload = async (uri: string) => {
    if (!user) return;
    setUploadingImage(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });
      Alert.alert("Sukces", "Awatar zmieniony!");
    } catch (error: any) {
      Alert.alert("Błąd", error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- LOGOWANIE / REJESTRACJA / PRO ---
  const handleLogin = async () => { /* ... Twoja logika ... */ 
     // (Skracam kod tutaj dla czytelności, wklej swoją starą logikę handleLogin)
     if (!loginInput || !password) return Alert.alert('Błąd', 'Wypełnij pola.');
     setLoading(true);
     try {
       let finalEmail = loginInput;
       if (!loginInput.includes('@')) {
         const usersRef = collection(db, 'users');
         const q = query(usersRef, where('username', '==', loginInput));
         const snap = await getDocs(q);
         if(snap.empty) throw new Error("Brak użytkownika.");
         finalEmail = snap.docs[0].data().email;
       }
       await signInWithEmailAndPassword(auth, finalEmail, password);
     } catch(e:any) { Alert.alert("Błąd", e.message); }
     finally { setLoading(false); }
  };

  const handleRegister = async () => { /* ... Twoja logika ... */ 
      // (Skracam kod tutaj dla czytelności, wklej swoją starą logikę handleRegister)
      if (!email || !password || !username) return Alert.alert('Błąd', 'Wypełnij pola.');
      setLoading(true);
      try {
         const usersRef = collection(db, 'users');
         const q = query(usersRef, where('username', '==', username));
         const snap = await getDocs(q);
         if(!snap.empty) throw new Error("Nick zajęty.");
         const cred = await createUserWithEmailAndPassword(auth, email, password);
         await setDoc(doc(db, 'users', cred.user.uid), {
             email, username, isPro: false, createdAt: new Date(), photoURL: ''
         });
      } catch(e:any) { Alert.alert("Błąd", e.message); }
      finally { setLoading(false); }
  };

  const handleBuyPro = async () => {
    if (!user) return;
    setLoading(true);
    try { await updateDoc(doc(db, 'users', user.uid), { isPro: true }); Alert.alert("Sukces!", "Masz PRO."); }
    catch(e:any) { Alert.alert("Błąd", e.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert("Wylogowanie", "Czy na pewno?", [
      { text: "Nie", style: "cancel" }, { text: "Tak", style: "destructive", onPress: () => signOut(auth) }
    ]);
  };

  // --- UI RENDER ---
  const renderHeaderSection = () => {
    if (user) {
      const isPro = userProfile?.isPro;
      return (
        // ZASTOSOWANIE MOTYWU: Tło Karty
        <View style={[styles.card, isPro && styles.cardPro, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={pickAndUploadImage} style={styles.avatarContainer}>
            {userProfile?.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.iconBg }]}>
                 <Text style={[styles.avatarText, { color: theme.subText }]}>
                   {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
                 </Text>
              </View>
            )}
            <View style={styles.cameraIconBadge}>
              {uploadingImage ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.text }]}>{userProfile?.username}</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>{user.email}</Text>
          
          <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
            <Text style={[styles.badgeText, isPro ? styles.textPro : styles.textFree]}>
              {isPro ? 'WERSJA PRO 👑' : 'WERSJA FREE'}
            </Text>
          </View>

          {!isPro ? (
            <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: theme.primary }]} onPress={handleBuyPro}>
              <Text style={styles.upgradeText}>KUP WERSJĘ PRO (Symulacja)</Text>
            </TouchableOpacity>
          ) : (
             <Text style={[styles.proBenefits, { color: theme.subText }]}>Twoje konto jest aktywne.</Text>
          )}
        </View>
      );
    } else {
      // FORMULARZ
      return (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.header, { color: theme.text }]}>{isRegistering ? 'Załóż konto' : 'Zaloguj się'}</Text>
          
          {isRegistering ? (
            <>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Nazwa użytkownika" placeholderTextColor={theme.subText}
                value={username} onChangeText={setUsername} autoCapitalize="none"
              />
              <TextInput 
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
                placeholder="Email" placeholderTextColor={theme.subText}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
              />
            </>
          ) : (
            <TextInput 
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
              placeholder="Email lub Nazwa użytkownika" placeholderTextColor={theme.subText}
              value={loginInput} onChangeText={setLoginInput} autoCapitalize="none"
            />
          )}

          <TextInput 
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} 
            placeholder="Hasło" placeholderTextColor={theme.subText}
            value={password} onChangeText={setPassword} secureTextEntry
          />

          {loading ? <ActivityIndicator size="large" color={theme.primary} /> : (
            <TouchableOpacity style={[styles.mainButton, { backgroundColor: theme.primary }]} onPress={isRegistering ? handleRegister : handleLogin}>
              <Text style={styles.mainButtonText}>{isRegistering ? 'ZAREJESTRUJ SIĘ' : 'ZALOGUJ SIĘ'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={[styles.switchText, { color: theme.primary }]}>
              {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // --- GŁÓWNY RENDER ---
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]} keyboardShouldPersistTaps="handled">
        {renderHeaderSection()}
        
        <View style={styles.menuSection}>
          <Text style={styles.sectionHeader}>Opcje aplikacji</Text>
          
          {/* MENU ITEMS Z MOTYWEM */}
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Settings')}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="settings-outline" size={24} color={theme.text} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Ustawienia</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => Alert.alert("Info", "Regulamin...")}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="document-text-outline" size={24} color={theme.text} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Polityka i Regulamin</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Contact')}>
            <View style={[styles.menuIconContainer, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="mail-outline" size={24} color={theme.text} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Kontakt / Wsparcie</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>

          {user && (
            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast, { backgroundColor: theme.card }]} onPress={handleLogout}>
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

// Style statyczne (Layout)
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingBottom: 50 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: { padding: 25, borderRadius: 20, marginBottom: 10, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardPro: { borderColor: '#FFD700', borderWidth: 2 },
  
  avatarContainer: { alignSelf: 'center', marginBottom: 15, position: 'relative' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 32, fontWeight: 'bold' },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 15, textAlign: 'center' },
  
  badge: { alignSelf: 'center', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15, marginBottom: 15 },
  badgeFree: { backgroundColor: '#F0F0F0' },
  badgePro: { backgroundColor: '#FFF5E1' },
  badgeText: { fontWeight: 'bold', fontSize: 12 },
  textFree: { color: '#666' },
  textPro: { color: '#D4AF37' },
  proBenefits: { marginTop: 10, textAlign: 'center', fontStyle: 'italic', fontSize: 13 },
  upgradeButton: { padding: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 5 },
  upgradeText: { color: '#fff', fontWeight: 'bold' },

  input: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  mainButton: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  mainButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { textAlign: 'center', marginTop: 20, fontWeight: '600' },

  sectionHeader: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 20, marginBottom: 15, marginLeft: 5 },
  menuSection: { width: '100%' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  menuItemLast: { marginBottom: 30 },
  menuIconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500' },
});