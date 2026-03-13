import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, Platform, Modal, TextInput, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeKey, SHOP_THEME_MAP, THEME_MAP } from '../context/ThemeContext';
import { hasItem } from '../utils/shopManager';
// ZMIANA: Dodano verifyBeforeUpdateEmail zamiast updateEmail (lub obok)
import { sendPasswordResetEmail, deleteUser, verifyBeforeUpdateEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { registerForPushNotificationsAsync, scheduleExamReminder, cancelAllNotifications } from '../utils/notifications';

// --- DEFINICJE DNI TYGODNIA ---
const DAYS = [
  { id: 2, label: 'Pn' },
  { id: 3, label: 'Wt' },
  { id: 4, label: 'Śr' },
  { id: 5, label: 'Cz' },
  { id: 6, label: 'Pt' },
  { id: 7, label: 'So' },
  { id: 1, label: 'Nd' },
];

type ReminderSettings = {
  enabled: boolean;
  days: { [key: number]: boolean };
  useGlobalTime: boolean;
  globalTime: Date;
  individualTimes: { [key: number]: Date };
};

export default function SettingsScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  const { theme, isDark, currentThemeKey, toggleTheme, setThemeByKey } = useTheme();

  const [ownedThemes, setOwnedThemes] = useState<ThemeKey[]>(['light']);

  // --- STAN POWIADOMIEŃ ---
  const [reminders, setReminders] = useState<ReminderSettings>({
    enabled: false,
    days: { 2: true, 3: true, 4: true, 5: true, 6: true, 7: false, 1: false },
    useGlobalTime: true,
    globalTime: new Date(new Date().setHours(18, 0, 0, 0)),
    individualTimes: {}
  });

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'global' | number>('global');

  // --- STAN EDYCJI KONTA (MODAL) ---
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState<'username' | 'email' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ŁADOWANIE I ZAPISYWANIE ---
  useEffect(() => {
    loadSettings();
    loadOwnedThemes();
  }, []);

  const loadOwnedThemes = async () => {
    const owned: ThemeKey[] = ['light'];
    if (userProfile?.isPro) owned.push('dark');
    for (const [itemId, themeKey] of Object.entries(SHOP_THEME_MAP)) {
      if (await hasItem(itemId)) owned.push(themeKey);
    }
    setOwnedThemes(owned);
  };

  const loadSettings = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@reminder_settings');
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        parsed.globalTime = new Date(parsed.globalTime);
        Object.keys(parsed.individualTimes).forEach(key => {
          parsed.individualTimes[Number(key)] = new Date(parsed.individualTimes[Number(key)]);
        });
        setReminders(parsed);
      }
    } catch (e) {
      console.error("Błąd ładowania ustawień", e);
    }
  };

  const saveAndSchedule = async (newSettings: ReminderSettings) => {
    setReminders(newSettings);
    try {
      await AsyncStorage.setItem('@reminder_settings', JSON.stringify(newSettings));
      await cancelAllNotifications();

      if (newSettings.enabled) {
        const hasPermission = await registerForPushNotificationsAsync();
        if (!hasPermission) {
          Alert.alert("Brak zgody", "Nie możemy ustawić przypomnień bez Twojej zgody w ustawieniach telefonu.");
          setReminders(prev => ({ ...prev, enabled: false }));
          return;
        }

        for (const day of DAYS) {
          if (newSettings.days[day.id]) {
            let rawDate = newSettings.useGlobalTime
              ? newSettings.globalTime
              : (newSettings.individualTimes[day.id] || newSettings.globalTime);

            const timeDate = new Date(rawDate);
            if (isNaN(timeDate.getTime())) {
              throw new Error("Nieprawidłowy format czasu.");
            }
            await scheduleExamReminder(day.id, timeDate.getHours(), timeDate.getMinutes());
          }
        }
      }
    } catch (e: any) {
      console.error("Błąd planowania:", e);
      setReminders(prev => ({ ...prev, enabled: false }));
    }
  };

  // --- HANDLERY POWIADOMIEŃ ---
  const toggleMasterSwitch = (value: boolean) => {
    saveAndSchedule({ ...reminders, enabled: value });
  };

  const toggleDay = (dayId: number) => {
    const newDays = { ...reminders.days, [dayId]: !reminders.days[dayId] };
    saveAndSchedule({ ...reminders, days: newDays });
  };

  const toggleGlobalTimeMode = (value: boolean) => {
    saveAndSchedule({ ...reminders, useGlobalTime: value });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selectedDate) return;

    const newSettings = { ...reminders };
    if (pickerMode === 'global') {
      newSettings.globalTime = selectedDate;
    } else {
      newSettings.individualTimes = {
        ...newSettings.individualTimes,
        [pickerMode]: selectedDate
      };
    }
    saveAndSchedule(newSettings);
  };

  const openPicker = (mode: 'global' | number) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handleThemeToggle = () => {
    if (!userProfile?.isPro) {
      Alert.alert("Funkcja Premium 👑", "Tryb ciemny jest dostępny w wersji PRO.");
      return;
    }
    toggleTheme();
  };

  // --- HANDLERY ZARZĄDZANIA KONTEM ---

  const openEditModal = (mode: 'username' | 'email') => {
    setEditMode(mode);
    setInputValue(mode === 'username' ? userProfile?.username || '' : user?.email || '');
    setModalVisible(true);
  };

  const handleSaveAccountChange = async () => {
    if (!user || !inputValue.trim()) return;
    setLoading(true);

    try {
      if (editMode === 'username') {
        // Zmiana nazwy w Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { username: inputValue.trim() });
        Alert.alert("Sukces", "Nazwa użytkownika została zmieniona.");
        setModalVisible(false);

      } else if (editMode === 'email') {
        // Zmiana emaila - ZAKTUALIZOWANA LOGIKA
        // Używamy verifyBeforeUpdateEmail zamiast updateEmail ze względu na zabezpieczenia Firebase
        await verifyBeforeUpdateEmail(user, inputValue.trim());

        Alert.alert(
          "Wysłano link weryfikacyjny",
          `Na adres ${inputValue.trim()} wysłaliśmy link potwierdzający. Kliknij go, aby sfinalizować zmianę emaila. Zmiana będzie widoczna po ponownym zalogowaniu.`
        );
        // Nie aktualizujemy Firestore tutaj, bo email technicznie jeszcze się nie zmienił (czeka na kliknięcie w link).
        setModalVisible(false);
      }

    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert("Wymagane logowanie", "Aby wykonać tę operację, musisz się wylogować i zalogować ponownie dla bezpieczeństwa.");
      } else if (error.code === 'auth/operation-not-allowed') {
        Alert.alert("Błąd konfiguracji", "Operacja niedozwolona. Sprawdź ustawienia Firebase (Email Enumeration).");
      } else {
        Alert.alert("Błąd", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    Alert.alert("Zmiana hasła", `Czy chcesz wysłać link do resetowania hasła na ${user.email}?`, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Wyślij", onPress: async () => {
          try {
            await sendPasswordResetEmail(auth, user.email!);
            Alert.alert("Wysłano", "Sprawdź swoją skrzynkę mailową.");
          } catch (error: any) { Alert.alert("Błąd", error.message); }
        }
      }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Usuwanie konta", "Tej operacji nie można cofnąć. Wszystkie Twoje dane zostaną utracone.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń trwale", style: "destructive", onPress: async () => {
          try {
            if (user) {
              await deleteDoc(doc(db, 'users', user.uid));
              await deleteUser(user);
            }
          } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
              Alert.alert("Wymagane logowanie", "Aby usunąć konto, zaloguj się ponownie dla bezpieczeństwa.");
            } else {
              Alert.alert("Błąd", error.message);
            }
          }
        }
      }
    ]);
  };

  // --- UI KOMPONENTY ---
  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDayTime = (dayId: number) => {
    return reminders.individualTimes[dayId] || reminders.globalTime;
  };

  const SettingItem = ({ icon, label, value, onToggle }: any) => (
    <View style={[styles.itemContainer, { backgroundColor: theme.card }]}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={24} color={theme.text} style={styles.icon} />
        <Text style={[styles.itemText, { color: theme.text }]}>{label}</Text>
      </View>
      <Switch
        value={value} onValueChange={onToggle}
        trackColor={{ false: "#767577", true: "#34C759" }}
        thumbColor={"#f4f3f4"}
      />
    </View>
  );

  const AccountActionItem = ({ icon, label, color, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={24} color={color} style={styles.icon} />
        <Text style={[styles.itemText, { color: color }]}>{label}</Text>
      </View>
      {!isDestructive && <Ionicons name="create-outline" size={20} color={theme.subText} />}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>

        {/* SEKCJA APLIKACJA */}
        <Text style={styles.sectionHeader}>Aplikacja</Text>
        <View style={[styles.section, { backgroundColor: theme.card, paddingBottom: reminders.enabled ? 15 : 0 }]}>
          <SettingItem icon="moon-outline" label="Ciemny motyw" value={isDark && currentThemeKey === 'dark'} onToggle={handleThemeToggle} />

          {/* PICKER MOTYWÓW SKLEPOWYCH */}
          {ownedThemes.length > 2 && (
            <>
              <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#f0f0f0' }} />
              <View style={{ padding: 15 }}>
                <Text style={[styles.subLabel, { color: theme.subText, marginBottom: 10 }]}>MOTYW KOLORYSTYCZNY:</Text>
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  {ownedThemes.map((key) => {
                    const t = THEME_MAP[key];
                    const isActive = currentThemeKey === key;
                    const labels: Record<string, string> = { light: 'Jasny', dark: 'Ciemny', gold: 'Złoty', ocean: 'Ocean', neon: 'Neon' };
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setThemeByKey(key)}
                        style={{
                          alignItems: 'center',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isActive ? t.primary : 'transparent',
                          backgroundColor: isActive ? t.primary + '15' : 'transparent',
                        }}
                      >
                        <View style={{
                          width: 32, height: 32, borderRadius: 16,
                          backgroundColor: t.primary,
                          marginBottom: 4,
                          borderWidth: isActive ? 2 : 0,
                          borderColor: '#fff',
                        }} />
                        <Text style={{ color: theme.text, fontSize: 10, fontWeight: isActive ? '700' : '400' }}>
                          {labels[key] || key}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}
          <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#f0f0f0', marginLeft: 0 }} />
          <SettingItem icon="notifications-outline" label="Przypomnienie o nauce" value={reminders.enabled} onToggle={toggleMasterSwitch} />

          {reminders.enabled && (
            <View style={styles.remindersContent}>
              <View style={[styles.separator, { backgroundColor: isDark ? '#333' : '#f0f0f0', marginBottom: 15 }]} />
              <Text style={[styles.subLabel, { color: theme.subText }]}>DNI TYGODNIA:</Text>
              <View style={styles.daysRow}>
                {DAYS.map((day) => {
                  const isActive = reminders.days[day.id];
                  return (
                    <TouchableOpacity
                      key={day.id}
                      onPress={() => toggleDay(day.id)}
                      style={[styles.dayCircle, { backgroundColor: isActive ? theme.primary : theme.background, borderColor: theme.border }]}
                    >
                      <Text style={[styles.dayText, { color: isActive ? '#FFF' : theme.text }]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.rowBetween, { marginTop: 20, marginBottom: 10 }]}>
                <Text style={[styles.itemText, { color: theme.text, fontSize: 14 }]}>Wspólna godzina</Text>
                <Switch value={reminders.useGlobalTime} onValueChange={toggleGlobalTimeMode} trackColor={{ false: "#767577", true: theme.primary }} />
              </View>

              {reminders.useGlobalTime ? (
                <View style={styles.timeRow}>
                  <Text style={{ color: theme.text }}>Godzina:</Text>
                  {Platform.OS === 'android' ? (
                    <TouchableOpacity onPress={() => openPicker('global')} style={styles.timeButton}>
                      <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{formatTime(reminders.globalTime)}</Text>
                    </TouchableOpacity>
                  ) : (
                    <DateTimePicker
                      value={new Date(reminders.globalTime)}
                      mode="time" display="default" onChange={handleTimeChange}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  )}
                </View>
              ) : (
                <View style={{ marginTop: 5 }}>
                  {DAYS.filter(d => reminders.days[d.id]).map(day => (
                    <View key={day.id} style={styles.individualTimeRow}>
                      <Text style={{ color: theme.text, width: 40 }}>{day.label}</Text>
                      {Platform.OS === 'android' ? (
                        <TouchableOpacity onPress={() => openPicker(day.id)} style={styles.timeButton}>
                          <Text style={{ color: theme.primary }}>{formatTime(getDayTime(day.id))}</Text>
                        </TouchableOpacity>
                      ) : (
                        <DateTimePicker
                          value={new Date(getDayTime(day.id))}
                          mode="time" display="compact" onChange={(e, d) => { setPickerMode(day.id); handleTimeChange(e, d); }}
                          themeVariant={isDark ? "dark" : "light"} style={{ width: 100 }}
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* SEKCJA: ZARZĄDZANIE KONTEM */}
        <Text style={styles.sectionHeader}>Zarządzanie kontem</Text>
        <View style={[styles.section, { backgroundColor: theme.card }]}>

          <AccountActionItem
            icon="person-outline"
            label="Zmień nazwę użytkownika"
            color={theme.text}
            onPress={() => openEditModal('username')}
          />
          <View style={[styles.separator, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} />

          <AccountActionItem
            icon="mail-outline"
            label="Zmień adres email"
            color={theme.text}
            onPress={() => openEditModal('email')}
          />
          <View style={[styles.separator, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} />

          <AccountActionItem
            icon="key-outline"
            label="Zmień hasło"
            color={theme.text}
            onPress={handleChangePassword}
          />
          <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#f0f0f0' }} />

          <AccountActionItem
            icon="trash-outline"
            label="Usuń konto"
            color={theme.danger}
            onPress={handleDeleteAccount}
            isDestructive={true}
          />
        </View>

        <Text style={styles.versionText}>BitQuiz v1.0.8</Text>
      </ScrollView>

      {/* MODAL DO EDYCJI DANYCH */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editMode === 'username' ? 'Zmień nazwę' : 'Zmień email'}
            </Text>

            <Text style={[styles.modalSubtext, { color: theme.subText }]}>
              {editMode === 'username'
                ? 'Wprowadź nową nazwę użytkownika, która będzie widoczna dla innych.'
                : 'Nowy email wymaga weryfikacji. Wyślemy link potwierdzający na podany adres.'}
            </Text>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={inputValue}
              onChangeText={setInputValue}
              autoCapitalize="none"
              placeholder={editMode === 'username' ? "Nowa nazwa" : "Nowy email"}
              placeholderTextColor={theme.subText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setModalVisible(false)}>
                <Text style={{ color: theme.subText }}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButtonSave, { backgroundColor: theme.primary }]}
                onPress={handleSaveAccountChange}
                disabled={loading}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                  {loading ? 'Przetwarzanie...' : (editMode === 'email' ? 'Wyślij link' : 'Zapisz')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PICKER ANDROID */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={pickerMode === 'global' ? new Date(reminders.globalTime) : new Date(getDayTime(pickerMode as number))}
          mode="time" is24Hour={true} display="default" onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, flexGrow: 1 },
  sectionHeader: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, marginLeft: 10, textTransform: 'uppercase', marginTop: 10 },
  section: { borderRadius: 12, overflow: 'hidden', marginBottom: 15, elevation: 2 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 15, width: 24, textAlign: 'center' },
  itemText: { fontSize: 16, fontWeight: '500' },
  versionText: { textAlign: 'center', color: '#AAA', fontSize: 12, marginTop: 10 },
  remindersContent: { paddingHorizontal: 15, paddingBottom: 15 },
  subLabel: { fontSize: 12, marginBottom: 10, fontWeight: '600', letterSpacing: 0.5 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  dayText: { fontSize: 12, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  timeButton: { padding: 8, backgroundColor: '#f0f0f0', borderRadius: 8 },
  individualTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', padding: 20, borderRadius: 15, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSubtext: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButtonCancel: { padding: 10, flex: 1, alignItems: 'center' },
  modalButtonSave: { padding: 10, flex: 1, alignItems: 'center', borderRadius: 8, marginLeft: 10 },
  separator: { height: 1 },
});