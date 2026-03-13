import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView,
  Platform, Image, StatusBar, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db, storage } from '../config/firebase';
import { doc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { QUALIFICATIONS_DATA } from '../data/categories';
import { GlowOrb } from '../components/GlowOrb';
import { getXPData, getLevelInfo } from '../utils/xpManager';
import { checkStreakStatus, StreakData } from '../utils/streakManager';

const { width } = Dimensions.get('window');

// Gradient palette for qualification chips
const QUAL_GRADIENTS = [
  ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'], ['#DA22FF', '#9733EE'],
  ['#f6d365', '#fda085'], ['#00c6ff', '#0072ff'], ['#11998e', '#38ef7d'],
  ['#fc4a1a', '#f7b733'],
];

const getQualGradient = (index: number) => QUAL_GRADIENTS[index % QUAL_GRADIENTS.length];

// Password strength calculator
const getPasswordStrength = (pass: string): { level: number; label: string; color: string } => {
  if (!pass) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { level: 20, label: 'Bardzo słabe', color: '#EF4444' };
  if (score === 2) return { level: 40, label: 'Słabe', color: '#F97316' };
  if (score === 3) return { level: 60, label: 'Średnie', color: '#EAB308' };
  if (score === 4) return { level: 80, label: 'Silne', color: '#22C55E' };
  return { level: 100, label: 'Bardzo silne', color: '#10B981' };
};

export default function ProfileScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  const { theme, isDark } = useTheme();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Stats
  const [levelInfo, setLevelInfo] = useState({
    level: 1, levelName: 'Początkujący', totalXP: 0,
    currentLevelXP: 0, requiredLevelXP: 300, nextLevelTotalXP: 300,
    progress: 0, isMaxLevel: false,
  });
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user) loadStats();
    }, [user])
  );

  const loadStats = async () => {
    try {
      const xpData = await getXPData();
      setLevelInfo(getLevelInfo(xpData.totalXP));
      const streak = await checkStreakStatus();
      setStreakData(streak);
    } catch (e) {
      console.error('Błąd ładowania statystyk:', e);
    }
  };

  // --- AVATAR ---
  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Brak dostępu", "Zezwól na dostęp do zdjęć w ustawieniach.");
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && user) {
        handleImageUpload(result.assets[0].uri);
      }
    } catch (error: any) {
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

  // --- LOGIN ---
  const handleLogin = async () => {
    if (!loginInput || !password) return Alert.alert('Błąd', 'Wypełnij pola.');
    setLoading(true);
    try {
      let finalEmail = loginInput;
      if (!loginInput.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', loginInput));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("Brak użytkownika.");
        finalEmail = snap.docs[0].data().email;
      }
      await signInWithEmailAndPassword(auth, finalEmail, password);
    } catch (e: any) { Alert.alert("Błąd", e.message); }
    finally { setLoading(false); }
  };

  // --- VALIDATION ---
  const validateForm = () => {
    let valid = true;
    let newErrors: { [key: string]: string } = {};

    if (!email) { newErrors.email = 'Email jest wymagany'; valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { newErrors.email = 'Nieprawidłowy format email'; valid = false; }

    if (!username) { newErrors.username = 'Nazwa użytkownika jest wymagana'; valid = false; }
    else if (username.length < 3) { newErrors.username = 'Min. 3 znaki'; valid = false; }

    if (!password) { newErrors.password = 'Hasło jest wymagane'; valid = false; }
    else if (password.length < 6) { newErrors.password = 'Min. 6 znaków'; valid = false; }

    if (password !== confirmPassword) { newErrors.confirmPassword = 'Hasła nie są identyczne'; valid = false; }

    if (!acceptedTerms) { newErrors.terms = 'Musisz zaakceptować regulamin'; valid = false; }

    if (selectedQualifications.length === 0) { newErrors.qualifications = 'Wybierz min. 1 kwalifikację'; valid = false; }

    setErrors(newErrors);
    return valid;
  };

  // --- REGISTER ---
  const handleRegister = async () => {
    setErrors({});
    if (!validateForm()) return;

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snap = await getDocs(q);

      if (!snap.empty) {
        setErrors({ ...errors, username: 'Ta nazwa jest już zajęta' });
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email, username, isPro: false, createdAt: new Date(), photoURL: '',
        favoriteQualifications: selectedQualifications,
      });
    } catch (e: any) {
      let msg = "Wystąpił błąd rejestracji.";
      if (e.code === 'auth/email-already-in-use') msg = "Ten email jest już używany.";
      else if (e.code === 'auth/invalid-email') msg = "Nieprawidłowy email.";
      Alert.alert("Błąd", msg);
    }
    finally { setLoading(false); }
  };

  const handleBuyPro = async () => {
    if (!user) return;
    setLoading(true);
    try { await updateDoc(doc(db, 'users', user.uid), { isPro: true }); Alert.alert("Sukces!", "Masz PRO."); }
    catch (e: any) { Alert.alert("Błąd", e.message); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert("Wylogowanie", "Czy na pewno?", [
      { text: "Nie", style: "cancel" },
      { text: "Tak", style: "destructive", onPress: () => signOut(auth) }
    ]);
  };

  const passwordStrength = getPasswordStrength(password);

  // ==================== RENDER: LOGGED IN ====================
  const renderLoggedInView = () => {
    const isPro = userProfile?.isPro;
    const { level, levelName, totalXP, progress, nextLevelTotalXP } = levelInfo;

    return (
      <>
        {/* PROFILE HERO CARD */}
        <View style={[styles.heroCard, isPro && styles.heroCardPro]}>
          <GlowOrb color="#A050FF" size={180} top={-50} left={-50} />
          <GlowOrb color="#3278FF" size={150} top={-20} right={-40} />

          {/* Avatar */}
          <TouchableOpacity onPress={pickAndUploadImage} style={styles.avatarContainer} activeOpacity={0.8}>
            {userProfile?.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#A050FF', '#5B7FFF'] as const}
                style={styles.avatarPlaceholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            )}
            {/* Gradient ring */}
            <View style={styles.avatarRing} />
            <View style={styles.cameraIconBadge}>
              {uploadingImage
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          {/* Username & Email */}
          <Text style={styles.heroTitle}>{userProfile?.username}</Text>
          <Text style={styles.heroSubtitle}>{user?.email}</Text>

          {/* PRO/FREE Badge */}
          <View style={[styles.proBadge, isPro ? styles.proBadgePro : styles.proBadgeFree]}>
            <Text style={[styles.proBadgeText, isPro ? styles.proBadgeTextPro : styles.proBadgeTextFree]}>
              {isPro ? '👑 WERSJA PRO' : 'WERSJA FREE'}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={styles.statPillText}>Lvl {level}</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>🏅 {totalXP} XP</Text>
            </View>
            {streakData && (
              <View style={styles.statPill}>
                <Ionicons name="flame" size={16} color="#FF9500" />
                <Text style={styles.statPillText}>{streakData.currentStreak} dni</Text>
              </View>
            )}
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpSection}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>{levelName}</Text>
              <Text style={styles.xpValue}>{totalXP} / {nextLevelTotalXP} XP</Text>
            </View>
            <View style={styles.xpBarBg}>
              <LinearGradient
                colors={['#A050FF', '#5B7FFF', '#3278FF'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.xpBarFill, { width: `${progress}%` }]}
              />
            </View>
          </View>

          {/* Upgrade or Status */}
          {!isPro ? (
            <TouchableOpacity style={styles.upgradeBtn} onPress={handleBuyPro} activeOpacity={0.8}>
              <LinearGradient
                colors={['#A050FF', '#5B7FFF'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeBtnGradient}
              >
                <Ionicons name="star" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.upgradeBtnText}>ULEPSZ DO PRO</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <Text style={styles.proActiveText}>✨ Twoje konto PRO jest aktywne</Text>
          )}
        </View>

        {/* MENU SECTION */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="settings" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Opcje aplikacji</Text>
          </View>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="settings-outline" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Ustawienia</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>




          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => Alert.alert("Info", "Regulamin...")} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(255,152,0,0.15)' }]}>
              <Ionicons name="document-text-outline" size={22} color="#FF9800" />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Polityka i Regulamin</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Contact')} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(33,150,243,0.15)' }]}>
              <Ionicons name="mail-outline" size={22} color="#2196F3" />
            </View>
            <Text style={[styles.menuText, { color: theme.text }]}>Kontakt / Wsparcie</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLogout]} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Wyloguj się</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // ==================== RENDER: AUTH FORMS ====================
  const renderAuthForms = () => (
    <View style={[styles.authCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <GlowOrb color="#A050FF" size={140} top={-40} left={-30} />
      <GlowOrb color="#3278FF" size={120} bottom={-30} right={-30} />

      {/* Header */}
      <View style={styles.authHeader}>
        <View style={styles.authIconCircle}>
          <Ionicons name={isRegistering ? "person-add" : "lock-closed"} size={28} color="#fff" />
        </View>
        <Text style={[styles.authTitle, { color: theme.text }]}>
          {isRegistering ? 'Załóż konto' : 'Zaloguj się'}
        </Text>
        <Text style={[styles.authSubtitle, { color: theme.subText }]}>
          {isRegistering ? 'Dołącz do BitQuiz i ucz się efektywnie' : 'Witamy ponownie!'}
        </Text>
      </View>

      {isRegistering ? (
        // === REGISTRATION FORM ===
        <>
          {/* Username */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: errors.username ? '#EF4444' : theme.border }]}>
              <Ionicons name="person-outline" size={20} color={theme.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Nazwa użytkownika"
                placeholderTextColor={theme.subText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: errors.email ? '#EF4444' : theme.border }]}>
              <Ionicons name="mail-outline" size={20} color={theme.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.subText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: errors.password ? '#EF4444' : theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1 }]}
                placeholder="Hasło"
                placeholderTextColor={theme.subText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subText} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            {/* Password Strength */}
            {password.length > 0 && (
              <View style={styles.strengthSection}>
                <View style={styles.strengthBarBg}>
                  <View style={[styles.strengthBarFill, { width: `${passwordStrength.level}%`, backgroundColor: passwordStrength.color }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: errors.confirmPassword ? '#EF4444' : theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1 }]}
                placeholder="Powtórz hasło"
                placeholderTextColor={theme.subText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subText} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Terms */}
          <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms(!acceptedTerms)} activeOpacity={0.7}>
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked, { borderColor: errors.terms ? '#EF4444' : (acceptedTerms ? '#A050FF' : theme.border) }]}>
              {acceptedTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={[styles.termsText, { color: theme.text }]}>
              Akceptuję <Text style={{ color: '#A050FF', fontWeight: '700' }}>Warunki korzystania</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 8 }]}>{errors.terms}</Text>}

          {/* Qualification Picker */}
          <View style={styles.qualSection}>
            <Text style={[styles.qualLabel, { color: theme.text }]}>
              Wybierz kwalifikacje (max 2):
            </Text>
            <View style={styles.qualGrid}>
              {QUALIFICATIONS_DATA.map((q, idx) => {
                const isSelected = selectedQualifications.includes(q.id);
                const gradient = getQualGradient(idx);
                return (
                  <TouchableOpacity
                    key={q.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedQualifications(prev => prev.filter(id => id !== q.id));
                      } else if (selectedQualifications.length < 2) {
                        setSelectedQualifications(prev => [...prev, q.id]);
                      }
                    }}
                    style={styles.qualChipOuter}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={gradient as any}
                        style={styles.qualChipInner}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={[styles.qualChipText, { color: '#fff' }]}>{q.title}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.qualChipInner, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}>
                        <Text style={[styles.qualChipText, { color: theme.text }]}>{q.title}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.qualifications && <Text style={[styles.errorText, { textAlign: 'center' }]}>{errors.qualifications}</Text>}
          </View>
        </>
      ) : (
        // === LOGIN FORM ===
        <>
          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="person-outline" size={20} color={theme.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email lub Nazwa użytkownika"
                placeholderTextColor={theme.subText}
                value={loginInput}
                onChangeText={setLoginInput}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text, flex: 1 }]}
                placeholder="Hasło"
                placeholderTextColor={theme.subText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subText} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Submit Button */}
      {loading ? (
        <ActivityIndicator size="large" color="#A050FF" style={{ marginVertical: 15 }} />
      ) : (
        <TouchableOpacity onPress={isRegistering ? handleRegister : handleLogin} activeOpacity={0.8} style={styles.submitBtn}>
          <LinearGradient
            colors={['#A050FF', '#5B7FFF'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtnGradient}
          >
            <Ionicons name={isRegistering ? "person-add" : "log-in"} size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>
              {isRegistering ? 'ZAREJESTRUJ SIĘ' : 'ZALOGUJ SIĘ'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Switch mode */}
      <TouchableOpacity onPress={() => { setIsRegistering(!isRegistering); setErrors({}); }} style={styles.switchBtn}>
        <Text style={[styles.switchText, { color: theme.subText }]}>
          {isRegistering ? 'Masz już konto? ' : 'Nie masz konta? '}
          <Text style={{ color: '#A050FF', fontWeight: '700' }}>
            {isRegistering ? 'Zaloguj się' : 'Zarejestruj się'}
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ==================== MAIN RENDER ====================
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {user ? renderLoggedInView() : renderAuthForms()}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: 20 },

  // --- CUSTOM HEADER ---
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingBottom: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // --- HERO CARD (LOGGED IN) ---
  heroCard: {
    backgroundColor: '#151525',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(160, 80, 255, 0.3)',
    shadowColor: '#7B4FBF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  heroCardPro: {
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
  },

  // Avatar
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(160, 80, 255, 0.5)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 2,
    borderColor: 'rgba(160, 80, 255, 0.4)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#A050FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#151525',
  },

  // Hero Text
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 14,
  },

  // PRO Badge
  proBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  proBadgePro: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: 'rgba(212,175,55,0.4)',
  },
  proBadgeFree: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  proBadgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  proBadgeTextPro: { color: '#D4AF37' },
  proBadgeTextFree: { color: 'rgba(255,255,255,0.6)' },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  statPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // XP Progress
  xpSection: { marginBottom: 16 },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  xpValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  xpBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Upgrade
  upgradeBtn: { marginTop: 4 },
  upgradeBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  upgradeBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  proActiveText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    fontSize: 13,
  },

  // --- MENU SECTION ---
  menuSection: { marginBottom: 20 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  menuItemLogout: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    marginTop: 5,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  // --- AUTH CARD ---
  authCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#A050FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#A050FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  authSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Inputs
  inputGroup: { marginBottom: 14 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },

  // Password Strength
  strengthSection: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  strengthBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 80,
  },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#A050FF',
    borderColor: '#A050FF',
  },
  termsText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Qualifications
  qualSection: { marginTop: 6, marginBottom: 10 },
  qualLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  qualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  qualChipOuter: {
    minWidth: '44%',
  },
  qualChipInner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualChipText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Submit
  submitBtn: { marginTop: 8 },
  submitBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Switch
  switchBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});