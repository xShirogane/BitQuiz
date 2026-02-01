import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { db } from '../config/firebase'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export default function MultiplayerSetupScreen({ navigation, route }: any) {
  const { examData } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  // NOWE: Stany dla konfiguracji gry
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);

  const questionOptions = [5, 10, 15, 20];
  const timeOptions = [15, 30, 45, 60];

  const createRoom = async () => {
    setLoading(true);
    try {
      const newCode = Math.floor(1000 + Math.random() * 9000).toString();
      const response = await fetch(examData.apiUrl);
      const allQuestions = await response.json();
      
      // NOWE: Losowanie ilości pytań wybranej przez usera
      const duelQuestions = allQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, numQuestions);

      await setDoc(doc(db, 'battles', newCode), {
        hostId: user?.uid, 
        hostEmail: user?.email, 
        guestId: null, 
        guestEmail: null,
        status: 'waiting', 
        questions: duelQuestions, 
        hostScore: 0, 
        guestScore: 0,
        currentQuestionIndex: 0, 
        createdAt: new Date(),
        // NOWE: Zapisujemy czas na pytanie w pokoju
        timePerQuestion: timePerQuestion 
      });

      navigation.navigate('MultiplayerGame', { roomCode: newCode, isHost: true, playerId: user?.uid });
    } catch (err: any) { 
      Alert.alert('Błąd', err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const joinRoom = async () => {
    if (roomCode.length !== 4) return Alert.alert('Błąd', 'Kod musi mieć 4 cyfry');
    setLoading(true);
    try {
      const roomRef = doc(db, 'battles', roomCode);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) throw new Error('Taki pokój nie istnieje!');
      const roomData = roomSnap.data();
      if (roomData.status !== 'waiting') throw new Error('Gra już się zaczęła lub skończyła.');
      if (roomData.guestId) throw new Error('Pokój jest pełny.');

      await updateDoc(roomRef, { guestId: user?.uid, guestEmail: user?.email, status: 'playing' });
      navigation.navigate('MultiplayerGame', { roomCode: roomCode, isHost: false, playerId: user?.uid });
    } catch (err: any) { 
      Alert.alert('Błąd dołączania', err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // Komponent pomocniczy dla przycisków typu Chip
  const RenderChips = ({ options, currentVal, setVal, unit = "" }: any) => (
    <View style={styles.chipRow}>
      {options.map((opt: number) => (
        <TouchableOpacity 
          key={opt}
          style={[
            styles.chip, 
            { backgroundColor: theme.card, borderColor: theme.border },
            currentVal === opt && { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={() => setVal(opt)}
        >
          <Text style={[
            styles.chipText, 
            { color: theme.text },
            currentVal === opt && { color: '#fff' }
          ]}>
            {opt}{unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.text }]}>Pojedynek 1vs1 ⚔️</Text>
        
        {/* Sekcja konfiguracji dla hosta */}
        <View style={styles.setupSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ustawienia Twojego pokoju:</Text>
          
          <Text style={[styles.label, { color: theme.subText }]}>Liczba pytań:</Text>
          <RenderChips options={questionOptions} currentVal={numQuestions} setVal={setNumQuestions} />

          <Text style={[styles.label, { color: theme.subText }]}>Czas na pytanie:</Text>
          <RenderChips options={timeOptions} currentVal={timePerQuestion} setVal={setTimePerQuestion} unit="s" />

          <TouchableOpacity 
            style={[styles.btn, styles.createBtn, { marginTop: 10 }]} 
            onPress={createRoom}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>STWÓRZ POKÓJ</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>LUB DOŁĄCZ DO ISTNIEJĄCEGO</Text>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Kod pokoju"
            placeholderTextColor={theme.subText}
            value={roomCode}
            onChangeText={setRoomCode}
            keyboardType="numeric"
            maxLength={4}
          />
          <TouchableOpacity 
            style={[styles.btn, styles.joinBtn]} 
            onPress={joinRoom}
            disabled={loading}
          >
             {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>DOŁĄCZ</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  setupSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  chipRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, minWidth: 60, alignItems: 'center' },
  chipText: { fontWeight: 'bold' },
  card: { padding: 20, borderRadius: 16, elevation: 3 },
  input: { padding: 15, borderRadius: 10, fontSize: 24, textAlign: 'center', letterSpacing: 5, marginBottom: 15, fontWeight: 'bold', borderWidth: 1 },
  btn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  joinBtn: { backgroundColor: '#007AFF' },
  createBtn: { backgroundColor: '#34C759' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  orText: { textAlign: 'center', color: '#999', fontWeight: 'bold', marginVertical: 30, fontSize: 12 }
});