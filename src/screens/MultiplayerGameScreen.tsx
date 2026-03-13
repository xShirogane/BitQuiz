import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, BackHandler, Image
} from 'react-native';
import { db } from '../config/firebase';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { checkDailyChallengeAfterMultiplayerWin } from '../utils/dailyChallengeManager';
import { addCoins, COIN_REWARDS } from '../utils/coinManager';
import { useVideoPlayer, VideoView } from 'expo-video';

const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

const QuestionVideo = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView style={styles.videoView} player={player} contentFit="contain" nativeControls={true} />
    </View>
  );
};

export default function MultiplayerGameScreen({ route, navigation }: any) {
  const { roomCode, isHost } = route.params;
  const { theme } = useTheme();

  const [gameData, setGameData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  // Domyślny czas, zaktualizujemy go jak pobierzemy dane
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const backAction = () => { Alert.alert("Czekaj!", "Nie możesz wyjść w trakcie pojedynku.", [{ text: "OK" }]); return true; };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const roomRef = doc(db, 'battles', roomCode);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setGameData(docSnap.data());
      } else {
        Alert.alert("Błąd", "Pokój usunięty.");
        navigation.popToTop();
      }
    });
    return () => unsubscribe();
  }, []);

  // NOWE: Resetowanie czasu na podstawie ustawień pokoju
  useEffect(() => {
    if (gameData?.timePerQuestion) {
      setTimeLeft(gameData.timePerQuestion);
    }
  }, [currentIndex, gameData?.timePerQuestion]); // Resetujemy, gdy zmienia się pytanie lub załadują dane

  useEffect(() => {
    if (!gameData || gameData.status === 'waiting' || finished) return;
    if (gameData.hostFinished && gameData.guestFinished) return;

    // Jeśli czas się skończył -> zła odpowiedź (-1)
    if (timeLeft <= 0) { handleAnswer(-1); return; }

    const timerId = setInterval(() => { setTimeLeft((prev) => prev - 1); }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, finished, gameData, currentIndex]);

  const handleAnswer = async (selectedIndex: number) => {
    if (!gameData) return;
    const currentQ = gameData.questions[currentIndex];

    // Sprawdzamy, czy czas się skończył (selectedIndex === -1) lub czy odpowiedź jest poprawna
    const isCorrect = selectedIndex !== -1 && selectedIndex === currentQ.correctAnswerIndex;

    if (isCorrect) {
      const fieldToUpdate = isHost ? 'hostScore' : 'guestScore';
      const roomRef = doc(db, 'battles', roomCode);
      await updateDoc(roomRef, { [fieldToUpdate]: increment(1) }).catch(console.error);
    }

    if (currentIndex < gameData.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
      const fieldFinished = isHost ? 'hostFinished' : 'guestFinished';
      await updateDoc(doc(db, 'battles', roomCode), { [fieldFinished]: true });
    }
  };

  if (!gameData || gameData.status === 'waiting') {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.waitingTitle, { color: theme.text }]}>Oczekiwanie na przeciwnika...</Text>
        <Text style={styles.codeText}>KOD POKOJU: {roomCode}</Text>

        {/* Wyświetlamy ustawienia pokoju oczekującym */}
        {gameData && (
          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: theme.subText, fontSize: 16 }}>
              Pytania: {gameData.questions?.length || 10} | Czas: {gameData.timePerQuestion || 30}s
            </Text>
          </View>
        )}

        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        <Text style={{ marginTop: 20, color: theme.subText }}>Podaj ten kod koledze!</Text>
      </View>
    );
  }

  const allFinished = gameData.hostFinished && gameData.guestFinished;

  if (finished && !allFinished) {
    const myScore = isHost ? gameData.hostScore : gameData.guestScore;
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.waitingTitle, { color: theme.text }]}>Ukończyłeś test! 🏁</Text>
        <Text style={{ fontSize: 18, color: theme.subText, marginBottom: 30, fontWeight: 'bold' }}>
          Twój wynik: {myScore} pkt
        </Text>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={{ marginTop: 20, color: theme.subText, textAlign: 'center', paddingHorizontal: 40 }}>
          Czekamy, aż przeciwnik odpowie na wszystkie pytania...
        </Text>
      </View>
    );
  }

  if (allFinished) {
    const myScore = isHost ? gameData.hostScore : gameData.guestScore;
    const oppScore = isHost ? gameData.guestScore : gameData.hostScore;

    let resultText = "REMIS 🤝";
    let resultColor = "#FF9500";
    if (myScore > oppScore) { resultText = "WYGRAŁEŚ! 🏆"; resultColor = "#34C759"; }
    else if (myScore < oppScore) { resultText = "PRZEGRAŁEŚ 😞"; resultColor = "#FF3B30"; }

    // Sprawdź wyzwanie dnia + nagroda monet za wygraną
    if (myScore > oppScore) {
      addCoins(COIN_REWARDS.MULTIPLAYER_WIN, 'Wygrana 1vs1');
      checkDailyChallengeAfterMultiplayerWin().then((result) => {
        if (result.xpAwarded > 0) {
          Alert.alert('🎯 Wyzwanie dnia!', `Wygrałeś 1vs1 i zdobyłeś +${result.xpAwarded} XP!`);
        }
      });
    }

    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.resultTitle, { color: resultColor }]}>{resultText}</Text>
        <View style={styles.scoreBoard}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>TY</Text>
            <Text style={[styles.bigScore, { color: theme.text }]}>{myScore}</Text>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>RYWAL</Text>
            <Text style={[styles.bigScore, { color: theme.text }]}>{oppScore}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.leaveButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.leaveButtonText}>WRÓĆ DO MENU</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = gameData.questions[currentIndex];
  // Pobieramy maxTime z bazy lub domyślnie 45s
  const maxTime = gameData.timePerQuestion || 45;

  return (
    <ScrollView contentContainerStyle={[styles.gameContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { backgroundColor: theme.card }]}>
        <View style={[styles.playerBadge, isHost && styles.activeBadge, isHost && { backgroundColor: theme.background }]}>
          <Text style={styles.playerText}>Host (Ty)</Text>
          <Text style={[styles.scoreText, { color: theme.text }]}>{gameData.hostScore}</Text>
        </View>
        <View style={[styles.playerBadge, !isHost && styles.activeBadge, !isHost && { backgroundColor: theme.background }]}>
          <Text style={styles.playerText}>Gość</Text>
          <Text style={[styles.scoreText, { color: theme.text }]}>{gameData.guestScore}</Text>
        </View>
      </View>

      <View style={[styles.timerContainer, { backgroundColor: theme.border }]}>
        {/* NOWE: Obliczanie szerokości paska względem dynamicznego maxTime */}
        <View style={[
          styles.timerBar,
          {
            width: `${(timeLeft / maxTime) * 100}%`,
            backgroundColor: timeLeft < 10 ? '#FF3B30' : theme.primary
          }
        ]}
        />
        <Text style={[styles.timerText, { color: theme.text }]}>⏳ {timeLeft}s</Text>
      </View>

      {/* Wyświetlanie aktualnego numeru pytania względem całkowitej ich liczby */}
      <Text style={[styles.progress, { color: theme.subText }]}>
        Pytanie {currentIndex + 1} / {gameData.questions.length}
      </Text>

      <View style={styles.questionCard}>
        <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.text}</Text>

        {currentQ.media && (
          <View style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>
            {currentQ.media.type === 'image' && (
              <Image source={{ uri: GITHUB_IMAGE_BASE_URL + currentQ.media.uri }} style={[styles.image, { backgroundColor: theme.card }]} resizeMode="contain" />
            )}
            {currentQ.media.type === 'video' && (
              <QuestionVideo uri={GITHUB_IMAGE_BASE_URL + currentQ.media.uri} />
            )}
          </View>
        )}
      </View>

      <View style={styles.answersContainer}>
        {currentQ.answers.map((ans: string, idx: number) => (
          <TouchableOpacity
            key={idx}
            style={[styles.answerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handleAnswer(idx)}
          >
            <Text style={[styles.answerLetter, { color: theme.primary }]}>{['A', 'B', 'C', 'D'][idx]}.</Text>
            <Text style={[styles.answerText, { color: theme.text }]}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  waitingTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  codeText: { fontSize: 32, fontWeight: '900', color: '#007AFF', letterSpacing: 2 },
  gameContainer: { flexGrow: 1, padding: 20, paddingTop: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderRadius: 12, padding: 5 },
  playerBadge: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 10 },
  activeBadge: { elevation: 2 },
  playerText: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  scoreText: { fontSize: 24, fontWeight: '900' },
  timerContainer: { width: '100%', height: 10, borderRadius: 5, marginBottom: 20, position: 'relative', marginTop: 10 },
  timerBar: { height: '100%', borderRadius: 5 },
  timerText: { position: 'absolute', top: -22, right: 0, fontWeight: 'bold', fontSize: 12 },
  progress: { textAlign: 'center', marginBottom: 10 },
  questionCard: { marginBottom: 30 },
  questionText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  image: { width: '100%', height: 200, marginBottom: 20, borderRadius: 8 },
  answersContainer: { gap: 12 },
  answerButton: { flexDirection: 'row', padding: 18, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  answerLetter: { fontSize: 18, fontWeight: 'bold', marginRight: 15 },
  answerText: { fontSize: 16, flex: 1 },
  resultTitle: { fontSize: 36, fontWeight: '900', marginBottom: 40 },
  scoreBoard: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 50 },
  scoreBox: { alignItems: 'center' },
  scoreLabel: { fontSize: 14, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  bigScore: { fontSize: 48, fontWeight: 'bold' },
  vsText: { fontSize: 24, fontWeight: 'bold', color: '#ccc' },
  leaveButton: { backgroundColor: '#333', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
  leaveButtonText: { color: '#fff', fontWeight: 'bold' },
  videoContainer: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 20 },
  videoView: { width: '100%', height: '100%' }
});