// src/screens/TrainingScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import * as FileSystem from 'expo-file-system/legacy'; // <--- ZMIANA IMPORTU NA LEGACY
import { cacheImages } from '../utils/offlineManager';

const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number | null;
  media?: { type: 'image' | 'video'; uri: string; localFileName?: string } | null;
}

export default function TrainingScreen({ route, navigation }: any) {
  const { apiUrl } = route.params;
  const { userProfile } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
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
      } catch (e) {
        console.warn('Błąd zapisu cache', e);
      }

      processQuestions(questionsWithImages);

    } catch (err) {
      console.log('Błąd sieci, próba offline...', err);

      if (!userProfile?.isPro) {
        setError('Brak internetu. Tryb Offline dostępny tylko w wersji PRO 👑.');
        setLoading(false);
        return;
      }

      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const allQuestions = JSON.parse(cachedData);
          processQuestions(allQuestions);
        } else {
          setError('Brak internetu i brak zapisanych pytań.');
          setLoading(false);
        }
      } catch (storageErr) {
        setError('Błąd odczytu danych offline.');
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
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    if (currentQ.correctAnswerIndex === index) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      navigation.navigate('Result', {
        score: score,
        total: questions.length,
        questions: questions,
        userAnswers: new Array(questions.length).fill(null), 
        mode: 'training'
      });
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  
  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Wróć</Text>
      </TouchableOpacity>
    </View>
  );

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswerIndex;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.progressText}>Pytanie {currentIndex + 1} / {questions.length}</Text>
        <Text style={styles.modeText}>TRYB NAUKI 🎓</Text>
      </View>

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

      <View style={styles.answersContainer}>
        {currentQuestion.answers.map((ans, idx) => {
          let buttonStyle = styles.answerButton;
          let textStyle = styles.answerText;
          let letterStyle = styles.answerLetter;

          if (isAnswered) {
            if (idx === currentQuestion.correctAnswerIndex) {
              buttonStyle = { ...styles.answerButton, ...styles.correctButton };
              textStyle = { ...styles.answerText, color: '#fff' };
              letterStyle = { ...styles.answerLetter, color: '#fff' };
            } else if (idx === selectedAnswer) {
              buttonStyle = { ...styles.answerButton, ...styles.wrongButton };
              textStyle = { ...styles.answerText, color: '#fff' };
              letterStyle = { ...styles.answerLetter, color: '#fff' };
            }
          }

          return (
            <TouchableOpacity 
              key={idx} 
              style={buttonStyle} 
              onPress={() => handleAnswer(idx)}
              disabled={isAnswered}
            >
              <Text style={letterStyle}>{['A','B','C','D'][idx]}.</Text>
              <Text style={textStyle}>{ans}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isAnswered && (
        <View style={styles.footer}>
          <Text style={[styles.feedbackText, isCorrect ? styles.textGreen : styles.textRed]}>
            {isCorrect ? "Świetnie! Dobra odpowiedź." : "Niestety, to błąd."}
          </Text>
          <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
            <Text style={styles.nextButtonText}>
              {currentIndex === questions.length - 1 ? 'ZAKOŃCZ' : 'NASTĘPNE PYTANIE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  backButton: { backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },

  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  progressText: { color: '#666' },
  modeText: { fontWeight: 'bold', color: '#007AFF' },

  questionText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, lineHeight: 26 },
  image: { width: '100%', height: 250, marginBottom: 20, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },

  answersContainer: { gap: 12, marginBottom: 30 },
  answerButton: { flexDirection: 'row', padding: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  answerLetter: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginRight: 12 },
  answerText: { fontSize: 16, color: '#333', flex: 1 },

  correctButton: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  wrongButton: { backgroundColor: '#F44336', borderColor: '#F44336' },

  footer: { marginTop: 10, alignItems: 'center' },
  feedbackText: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  textGreen: { color: '#4CAF50' },
  textRed: { color: '#F44336' },
  nextButton: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
  nextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});