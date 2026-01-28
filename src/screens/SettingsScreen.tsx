import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { registerForPushNotificationsAsync, scheduleExamReminder, cancelAllNotifications } from '../utils/notifications';

// Definicja dni tygodnia
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

export default function SettingsScreen() {
  const { user, userProfile } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

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

  // --- ŁADOWANIE I ZAPISYWANIE ---
  useEffect(() => {
    loadSettings();
  }, []);

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
    } catch(e) {
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
      Alert.alert("Szczegóły błędu", e.message || "Nieznany błąd powiadomień");
      setReminders(prev => ({ ...prev, enabled: false }));
    }
  };

  // --- HANDLERY ---
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

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Wysłano email", `Link wysłany na: ${user.email}`);
    } catch (error: any) { Alert.alert("Błąd", error.message); }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Usuwanie konta", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń", style: "destructive", onPress: async () => {
        try {
           if (user) { await deleteDoc(doc(db, 'users', user.uid)); await deleteUser(user); }
        } catch (error: any) { Alert.alert("Błąd", error.message); }
      }}
    ]);
  };

  // --- KOMPONENTY UI ---
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

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* SEKCJA APLIKACJA (Połączone Motyw + Przypomnienia) */}
      <Text style={styles.sectionHeader}>Aplikacja</Text>
      <View style={[styles.section, { backgroundColor: theme.card, paddingBottom: reminders.enabled ? 15 : 0 }]}>
        
        {/* 1. Motyw */}
        <SettingItem icon="moon-outline" label="Ciemny motyw" value={isDark} onToggle={handleThemeToggle} />
        
        {/* Separator */}
        <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#f0f0f0', marginLeft: 0 }} />

        {/* 2. Przypomnienia - Toggle */}
        <SettingItem 
          icon="notifications-outline" 
          label="Przypomnienie o nauce" 
          value={reminders.enabled} 
          onToggle={toggleMasterSwitch} 
        />

        {/* 3. Przypomnienia - Konfiguracja (Rozwijana) */}
        {reminders.enabled && (
          <View style={styles.remindersContent}>
            <View style={{ height: 1, backgroundColor: isDark ? '#333' : '#f0f0f0', marginBottom: 15 }} />
            
            <Text style={[styles.subLabel, { color: theme.subText }]}>DNI TYGODNIA:</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day) => {
                const isActive = reminders.days[day.id];
                return (
                  <TouchableOpacity 
                    key={day.id} 
                    onPress={() => toggleDay(day.id)}
                    style={[
                      styles.dayCircle, 
                      { backgroundColor: isActive ? theme.primary : theme.background, borderColor: theme.border }
                    ]}
                  >
                    <Text style={[styles.dayText, { color: isActive ? '#FFF' : theme.text }]}>{day.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.rowBetween, { marginTop: 20, marginBottom: 10 }]}>
              <Text style={[styles.itemText, { color: theme.text, fontSize: 14 }]}>Wspólna godzina</Text>
              <Switch 
                value={reminders.useGlobalTime} 
                onValueChange={toggleGlobalTimeMode}
                trackColor={{ false: "#767577", true: theme.primary }}
              />
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
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
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
                          mode="time"
                          display="compact"
                          onChange={(e, d) => { setPickerMode(day.id); handleTimeChange(e, d); }}
                          themeVariant={isDark ? "dark" : "light"}
                          style={{ width: 100 }}
                        />
                     )}
                   </View>
                 ))}
                 {DAYS.filter(d => reminders.days[d.id]).length === 0 && (
                   <Text style={{ color: theme.subText, fontStyle: 'italic', fontSize: 12 }}>Wybierz dni powyżej, aby ustawić godziny.</Text>
                 )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* MODAL PICKER DLA ANDROIDA */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={pickerMode === 'global' ? new Date(reminders.globalTime) : new Date(getDayTime(pickerMode as number))}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* SEKCJA BEZPIECZEŃSTWO */}
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

      <Text style={styles.versionText}>BitQuiz v1.0.6</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, flexGrow: 1 },
  sectionHeader: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, marginLeft: 10, textTransform: 'uppercase', marginTop: 10 },
  section: { borderRadius: 12, overflow: 'hidden', marginBottom: 15, elevation: 2 },
  dangerSection: { borderColor: '#FF3B30', borderWidth: 1 },
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
  individualTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' }
});