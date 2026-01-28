import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { db } from '../config/firebase'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- Theme
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export default function MultiplayerSetupScreen({ navigation, route }: any) {
  const { examData } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme(); // <--- Theme
  
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    try {
      const newCode = Math.floor(1000 + Math.random() * 9000).toString();
      const response = await fetch(examData.apiUrl);
      const allQuestions = await response.json();
      const duelQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);

      await setDoc(doc(db, 'battles', newCode), {
        hostId: user?.uid, hostEmail: user?.email, guestId: null, guestEmail: null,
        status: 'waiting', questions: duelQuestions, hostScore: 0, guestScore: 0,
        currentQuestionIndex: 0, createdAt: new Date()
      });

      navigation.navigate('MultiplayerGame', { roomCode: newCode, isHost: true, playerId: user?.uid });
    } catch (err: any) { Alert.alert('Błąd', err.message); } 
    finally { setLoading(false); }
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
    } catch (err: any) { Alert.alert('Błąd dołączania', err.message); } 
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Pojedynek 1vs1 ⚔️</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Wybierz opcję</Text>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardHeader, { color: theme.text }]}>Dołącz do znajomego</Text>
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

        <Text style={styles.orText}>LUB</Text>

        <TouchableOpacity 
          style={[styles.btn, styles.createBtn]} 
          onPress={createRoom}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnText}>STWÓRZ POKÓJ</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40 },
  card: { padding: 20, borderRadius: 16, elevation: 3, marginBottom: 20 },
  cardHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { padding: 15, borderRadius: 10, fontSize: 24, textAlign: 'center', letterSpacing: 5, marginBottom: 15, fontWeight: 'bold', borderWidth: 1, borderColor: 'transparent' },
  btn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  joinBtn: { backgroundColor: '#007AFF' },
  createBtn: { backgroundColor: '#34C759', padding: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  orText: { textAlign: 'center', color: '#999', fontWeight: 'bold', marginVertical: 20 }
});