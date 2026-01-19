import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { cacheImages } from '../utils/offlineManager';
import * as FileSystem from 'expo-file-system/legacy';

const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number | null;
  media?: { type: 'image' | 'video'; uri: string; localFileName?: string } | null;
}

export default function OneLifeScreen({ route, navigation }: any) {
  // POPRAWKA: Tutaj pobieramy examId
  const { apiUrl, examId } = route.params;
  const { userProfile } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const cacheKey = `quiz_cache_${apiUrl}`;
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Błąd sieci');
      const rawQuestions: Question[] = await response.json();
      const questionsWithImages = await cacheImages(rawQuestions);
      
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(questionsWithImages));
      } catch (cacheErr) {
        console.warn('Nie udało się zapisać cache:', cacheErr);
      }
      processQuestions(questionsWithImages);
    } catch (err) {
      console.log('Błąd sieci, próba trybu offline...', err);
      if (!userProfile?.isPro) {
        setError('Brak połączenia z internetem. Tryb Offline jest dostępny tylko w wersji PRO 👑.');
        setLoading(false);
        return;
      }
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const allQuestions: Question[] = JSON.parse(cachedData);
          processQuestions(allQuestions);
        } else {
          setError('Brak internetu i brak zapisanych pytań.');
          setLoading(false);
        }
      } catch (storageErr) {
        setError('Błąd odczytu danych.');
        setLoading(false);
      }
    }
  };

  const processQuestions = (allQuestions: Question[]) => {
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
    setLoading(false);
  };

  const handleAnswer = (index: number) => {
    const currentQ = questions[currentIndex];
    if (currentQ.correctAnswerIndex === index) {
      setScore(score + 1);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        finishGame();
      }
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    navigation.navigate('Result', {
      score: score,
      total: 0,
      questions: [], 
      userAnswers: [], 
      mode: 'onelife',
      examId: examId // Teraz ta zmienna jest już dostępna
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF3B30" /></View>;
  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>WRÓĆ</Text>
      </TouchableOpacity>
    </View>
  );

  const currentQuestion = questions[currentIndex];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>SERIA: {score}</Text>
        </View>
        <Text style={styles.livesText}>❤️ 1 ŻYCIE</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
        {currentQuestion.media && currentQuestion.media.type === 'image' && (
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
      </View>

      <View style={styles.answersContainer}>
        {currentQuestion.answers.map((ans, idx) => (
          <TouchableOpacity key={idx} style={styles.answerButton} onPress={() => handleAnswer(idx)}>
            <Text style={styles.answerLetter}>{['A','B','C','D'][idx]}.</Text>
            <Text style={styles.answerText}>{ans}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#1c1c1e', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1e' },
  errorText: { color: '#FF3B30', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  backButton: { backgroundColor: '#333', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  scoreBadge: { backgroundColor: '#FF3B30', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15 },
  scoreText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  livesText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { marginBottom: 30 },
  questionText: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  image: { width: '100%', height: 200, backgroundColor: '#333', borderRadius: 12 },
  answersContainer: { gap: 15 },
  answerButton: { flexDirection: 'row', padding: 20, borderRadius: 15, backgroundColor: '#2c2c2e', alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  answerLetter: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30', marginRight: 15 },
  answerText: { fontSize: 16, color: '#fff', flex: 1, fontWeight: '500' },
});