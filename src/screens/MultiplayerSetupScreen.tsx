import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Animated
} from 'react-native';
import { db } from '../config/firebase'; 
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function MultiplayerSetupScreen({ navigation, route }: any) {
  const { examData } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

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

  const RenderChips = ({ options, currentVal, setVal, unit = "" }: any) => (
    <View style={styles.chipRow}>
      {options.map((opt: number) => {
        const isActive = currentVal === opt;
        return (
          <TouchableOpacity 
            key={opt}
            onPress={() => setVal(opt)}
            activeOpacity={0.8}
            style={styles.chipWrapper}
          >
            <LinearGradient
              colors={isActive ? [theme.primary, theme.glowColor || '#60A5FA'] : [theme.background, theme.background]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.chip,
                { 
                  borderColor: isActive ? theme.primary : theme.border,
                  borderWidth: isActive ? 0 : 1 
                }
              ]}
            >
              <Text style={[
                styles.chipText, 
                { color: isActive ? '#FFFFFF' : theme.text }
              ]}>
                {opt}{unit}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Pojedynek 1vs1</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Zaproś znajomego lub dołącz do gry</Text>
        </View>

        {/* --- KARTA: STWÓRZ POKÓJ --- */}
        <View style={[styles.cardContainer, { shadowColor: theme.glowColor || '#3B82F6' }]}>
          {/* @ts-ignore */}
          <LinearGradient colors={theme.cardGradient || ['#ffffff', '#f9fafb']} style={styles.gradientCard}>
            <View style={styles.glassShine} />
            
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.iconBg || 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="add-circle" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Stwórz swój pokój</Text>
            </View>
            
            <Text style={[styles.label, { color: theme.subText }]}>Liczba pytań:</Text>
            <RenderChips options={questionOptions} currentVal={numQuestions} setVal={setNumQuestions} />

            <Text style={[styles.label, { color: theme.subText }]}>Czas na pytanie:</Text>
            <RenderChips options={timeOptions} currentVal={timePerQuestion} setVal={setTimePerQuestion} unit="s" />

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={createRoom}
              disabled={loading}
              style={{ marginTop: 10 }}
            >
              <LinearGradient 
                colors={[theme.success || '#10B981', '#059669']} 
                style={styles.actionBtn}
                start={{x:0, y:0}} end={{x:1, y:1}}
              >
                {loading ? <ActivityIndicator color="#fff"/> : (
                  <>
                    <Text style={styles.actionBtnText}>GENERUJ KOD</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <Text style={[styles.orText, { color: theme.subText, backgroundColor: theme.background }]}>LUB</Text>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </View>

        {/* --- KARTA: DOŁĄCZ DO POKOJU --- */}
        <View style={[styles.cardContainer, { shadowColor: theme.glowColor || '#3B82F6' }]}>
           {/* @ts-ignore */}
          <LinearGradient colors={theme.cardGradient || ['#ffffff', '#f9fafb']} style={styles.gradientCard}>
            <View style={styles.glassShine} />

            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.iconBg || 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="enter" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Dołącz do gry</Text>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.background, 
                  color: theme.text, 
                  borderColor: theme.border 
                }]}
                placeholder="0 0 0 0"
                placeholderTextColor={theme.subText}
                value={roomCode}
                onChangeText={setRoomCode}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={joinRoom}
              disabled={loading || roomCode.length !== 4}
            >
              <LinearGradient 
                colors={roomCode.length === 4 ? [theme.primary, theme.glowColor || '#60A5FA'] : [theme.border, theme.border]} 
                style={styles.actionBtn}
                start={{x:0, y:0}} end={{x:1, y:1}}
              >
                 {loading ? <ActivityIndicator color="#fff"/> : (
                  <>
                    <Text style={[styles.actionBtnText, roomCode.length !== 4 && { color: theme.subText }]}>DOŁĄCZ</Text>
                    <Ionicons name="game-controller" size={20} color={roomCode.length === 4 ? "#fff" : theme.subText} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        
        {/* Pusty widok na dole dla lepszego scrollowania */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  
  // Wspólne style dla nowoczesnych kart
  cardContainer: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 10,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  glassShine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ skewY: '-15deg' }, { translateY: -30 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 44, height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 13, marginBottom: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  
  // Chipsy
  chipRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  chipWrapper: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chip: { 
    paddingVertical: 12, paddingHorizontal: 15, 
    borderRadius: 14, minWidth: 65, 
    alignItems: 'center', justifyContent: 'center',
  },
  chipText: { fontWeight: '800', fontSize: 15 },
  
  // Separator "LUB"
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 15, fontWeight: '800', fontSize: 12, paddingHorizontal: 10, borderRadius: 10, overflow: 'hidden' },
  
  // Dołączanie (Input i Przyciski)
  inputWrapper: {
    marginBottom: 20,
  },
  input: { 
    padding: 18, 
    borderRadius: 16, 
    fontSize: 32, 
    textAlign: 'center', 
    letterSpacing: 15, 
    fontWeight: '900', 
    borderWidth: 1 
  },
  actionBtn: { 
    padding: 18, 
    borderRadius: 16, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});