import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cacheImages } from '../utils/offlineManager';
import { getItemQuantity, useItem } from '../utils/shopManager';
import * as FileSystem from 'expo-file-system/legacy'; // <--- LEGACY WAŻNE
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

export interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number | null;
  media?: { type: 'image' | 'video'; uri: string; localFileName?: string } | null;
}

export default function OneLifeScreen({ route, navigation }: any) {
  const { apiUrl, examId } = route.params;
  const { userProfile } = useAuth();
  const { theme } = useTheme();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [extraLives, setExtraLives] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
    getItemQuantity('extra_life').then(setExtraLives);
  }, []);

  const fetchQuestions = async () => {
    const cacheKey = `quiz_cache_${apiUrl}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Błąd sieci');
      const rawQuestions: Question[] = await response.json();
      const questionsWithImages = await cacheImages(rawQuestions);
      try { await AsyncStorage.setItem(cacheKey, JSON.stringify(questionsWithImages)); } catch (e) { }
      processQuestions(questionsWithImages);
    } catch (err) {
      if (!userProfile?.isPro) {
        setError('Brak internetu. Tryb Offline tylko w wersji PRO.');
        setLoading(false); return;
      }
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) processQuestions(JSON.parse(cachedData));
        else { setError('Brak danych.'); setLoading(false); }
      } catch (e) { setError('Błąd.'); setLoading(false); }
    }
  };

  const processQuestions = (allQuestions: Question[]) => {
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
    setLoading(false);
  };

  const handleAnswer = async (index: number) => {
    const currentQ = questions[currentIndex];
    if (currentQ.correctAnswerIndex === index) {
      setScore(score + 1);
      if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
      else finishGame();
    } else {
      // Błędna odpowiedź — spróbuj zużyć dodatkowe życie
      if (extraLives > 0) {
        const used = await useItem('extra_life');
        if (used) {
          setExtraLives(prev => prev - 1);
          // Kontynuuj grę zamiast kończyć
          if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
          else finishGame();
          return;
        }
      }
      finishGame();
    }
  };

  const finishGame = () => {
    navigation.replace('Result', { // replace żeby nie cofać
      score, total: 0, questions: [], userAnswers: [], mode: 'onelife', examId
    });
  };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color="#FF3B30" /></View>;
  if (error) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backButtonText}>WRÓĆ</Text></TouchableOpacity>
    </View>
  );

  const currentQuestion = questions[currentIndex];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>SERIA: {score}</Text>
        </View>
        <Text style={[styles.livesText, { color: theme.text }]}>❤️ {1 + extraLives} {extraLives > 0 ? 'ŻYCIA' : 'ŻYCIE'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion.text}</Text>

        {currentQuestion.media && (
          <View style={{ marginBottom: 20, width: '100%', alignItems: 'center' }}>
            {currentQuestion.media.type === 'image' && (
              <Image
                source={{
                  uri: currentQuestion.media.localFileName
                    ? `${FileSystem.documentDirectory}${currentQuestion.media.localFileName}`
                    : GITHUB_IMAGE_BASE_URL + currentQuestion.media.uri
                }}
                style={styles.image}
                resizeMode="contain"
              />
            )}
            {currentQuestion.media.type === 'video' && (
              <QuestionVideo uri={GITHUB_IMAGE_BASE_URL + currentQuestion.media.uri} />
            )}
          </View>
        )}
      </View>

      <View style={styles.answersContainer}>
        {currentQuestion.answers.map((ans, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.answerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => handleAnswer(idx)}
          >
            <Text style={styles.answerLetter}>{['A', 'B', 'C', 'D'][idx]}.</Text>
            <Text style={[styles.answerText, { color: theme.text }]}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#FF3B30', fontSize: 18, marginBottom: 20 },
  backButton: { backgroundColor: '#333', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  scoreBadge: { backgroundColor: '#FF3B30', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  scoreText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  livesText: { fontWeight: 'bold', fontSize: 16 },
  card: { marginBottom: 30 },
  questionText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  image: { width: '100%', height: 200, backgroundColor: '#333', borderRadius: 12 },
  videoContainer: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' },
  videoView: { width: '100%', height: '100%' },
  answersContainer: { gap: 15 },
  answerButton: { flexDirection: 'row', padding: 20, borderRadius: 15, alignItems: 'center', borderWidth: 1 },
  answerLetter: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30', marginRight: 15 },
  answerText: { fontSize: 16, flex: 1, fontWeight: '500' },
});