import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, BackHandler, Image } from 'react-native';
import { db } from '../config/firebase'; 
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';

// ADRES BAZOWY DO ZDJĘĆ (Musi być taki sam jak w innych plikach)
const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export default function MultiplayerGameScreen({ route, navigation }: any) {
  const { roomCode, isHost } = route.params;
  
  const [gameData, setGameData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [finished, setFinished] = useState(false); 
  
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Czekaj!", "Nie możesz wyjść w trakcie pojedynku.", [{ text: "OK" }]);
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const roomRef = doc(db, 'battles', roomCode);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameData(data);
      } else {
        Alert.alert("Błąd", "Pokój został usunięty.");
        navigation.popToTop();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAnswer = async (selectedIndex: number) => {
    if (!gameData) return;

    const currentQ = gameData.questions[currentIndex];
    const isCorrect = selectedIndex === currentQ.correctAnswerIndex;

    if (isCorrect) {
      const fieldToUpdate = isHost ? 'hostScore' : 'guestScore';
      const roomRef = doc(db, 'battles', roomCode);
      
      await updateDoc(roomRef, {
        [fieldToUpdate]: increment(1)
      }).catch(err => console.error(err));
    }

    if (currentIndex < gameData.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      const fieldFinished = isHost ? 'hostFinished' : 'guestFinished';
      await updateDoc(doc(db, 'battles', roomCode), {
        [fieldFinished]: true
      });
    }
  };

  if (!gameData || gameData.status === 'waiting') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.waitingTitle}>Oczekiwanie na przeciwnika...</Text>
        <Text style={styles.codeText}>KOD POKOJU: {roomCode}</Text>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        <Text style={{ marginTop: 20, color: '#666' }}>Podaj ten kod koledze!</Text>
      </View>
    );
  }

  if (finished) {
    const myScore = isHost ? gameData.hostScore : gameData.guestScore;
    const oppScore = isHost ? gameData.guestScore : gameData.hostScore;
    
    let resultText = "CZEKAMY NA WYNIK...";
    let resultColor = "#666";
    
    if (myScore > oppScore) {
      resultText = "WYGRAŁEŚ! 🏆";
      resultColor = "#34C759";
    } else if (myScore < oppScore) {
      resultText = "PRZEGRAŁEŚ 😞";
      resultColor = "#FF3B30";
    } else {
      resultText = "REMIS 🤝";
      resultColor = "#FF9500";
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.resultTitle, { color: resultColor }]}>{resultText}</Text>
        <View style={styles.scoreBoard}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>TY</Text>
            <Text style={styles.bigScore}>{myScore}</Text>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>RYWAL</Text>
            <Text style={styles.bigScore}>{oppScore}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.leaveButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.leaveButtonText}>WRÓĆ DO MENU</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = gameData.questions[currentIndex];

  return (
    <ScrollView contentContainerStyle={styles.gameContainer}>
      <View style={styles.topBar}>
        <View style={[styles.playerBadge, isHost && styles.activeBadge]}>
          <Text style={styles.playerText}>Host (Ty)</Text>
          <Text style={styles.scoreText}>{gameData.hostScore}</Text>
        </View>
        <View style={[styles.playerBadge, !isHost && styles.activeBadge]}>
          <Text style={styles.playerText}>Gość</Text>
          <Text style={styles.scoreText}>{gameData.guestScore}</Text>
        </View>
      </View>

      <Text style={styles.progress}>Pytanie {currentIndex + 1} / {gameData.questions.length}</Text>
      
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{currentQ.text}</Text>
        
        {/* --- TUTAJ JEST FIX NA ZDJĘCIA --- */}
        {currentQ.media && currentQ.media.type === 'image' && (
          <Image
            source={{ uri: GITHUB_IMAGE_BASE_URL + currentQ.media.uri }}
            style={styles.image}
            resizeMode="contain"
            // To pomoże nam zdebugować błąd w konsoli:
            onError={(e) => console.log("Błąd ładowania zdjęcia:", e.nativeEvent.error)} 
          />
        )}
      </View>

      <View style={styles.answersContainer}>
        {currentQ.answers.map((ans: string, idx: number) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.answerButton} 
            onPress={() => handleAnswer(idx)}
          >
            <Text style={styles.answerLetter}>{['A','B','C','D'][idx]}.</Text>
            <Text style={styles.answerText}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F5F7FA' },
  waitingTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  codeText: { fontSize: 32, fontWeight: '900', color: '#007AFF', letterSpacing: 2 },
  
  gameContainer: { flexGrow: 1, padding: 20, backgroundColor: '#fff', paddingTop: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#f0f0f0', borderRadius: 12, padding: 5 },
  playerBadge: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 10 },
  activeBadge: { backgroundColor: '#fff', elevation: 2 },
  playerText: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  scoreText: { fontSize: 24, fontWeight: '900', color: '#333' },

  progress: { textAlign: 'center', color: '#888', marginBottom: 10 },
  questionCard: { marginBottom: 30 },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  
  // Styl dla obrazka
  image: { width: '100%', height: 200, marginBottom: 20, backgroundColor: '#f0f0f0', borderRadius: 8 },

  answersContainer: { gap: 12 },
  answerButton: { flexDirection: 'row', padding: 18, borderRadius: 12, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E9ECEF', alignItems: 'center' },
  answerLetter: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginRight: 15 },
  answerText: { fontSize: 16, color: '#333', flex: 1 },

  resultTitle: { fontSize: 36, fontWeight: '900', marginBottom: 40 },
  scoreBoard: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 50 },
  scoreBox: { alignItems: 'center' },
  scoreLabel: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  bigScore: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  vsText: { fontSize: 24, fontWeight: 'bold', color: '#ccc' },
  leaveButton: { backgroundColor: '#333', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  leaveButtonText: { color: '#fff', fontWeight: 'bold' }
});