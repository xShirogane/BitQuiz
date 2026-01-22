import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { cacheImages } from '../utils/offlineManager';
import * as FileSystem from 'expo-file-system/legacy';
// 1. Import przeglądarki zdjęć
import ImageView from "react-native-image-viewing";
// 2. NOWOŚĆ: Import obsługi wideo
import { Video, ResizeMode } from 'expo-av';

// Pamiętaj o ukośniku na końcu i 'raw' w adresie!
const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number | null;
  media?: { type: 'image' | 'video'; uri: string; localFileName?: string } | null;
}

export default function ExamScreen({ route, navigation }: any) {
  const { apiUrl, limit, time } = route.params; 
  const { userProfile } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Stan widoczności galerii (zoomowania)
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  // Stan dla licznika czasu
  const [timeLeft, setTimeLeft] = useState((time || 60) * 60); 

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (loading || error) return; 

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [loading, error]);

  useEffect(() => {
    if (timeLeft === 0 && !loading && !error) {
      finishExam();
    }
  }, [timeLeft, loading, error]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

 const fetchQuestions = async () => {
    const cacheKey = `quiz_cache_${apiUrl}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Błąd sieci');
      
      const rawQuestions: Question[] = await response.json();
      // Cache'ujemy obrazki (funkcja z offlineManager)
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
          setError('Brak internetu i brak zapisanych pytań. Połącz się raz, aby pobrać bazę.');
          setLoading(false);
        }
      } catch (storageErr) {
        setError('Wystąpił nieoczekiwany błąd przy odczycie danych.');
        setLoading(false);
      }
    }
  };

  const processQuestions = (allQuestions: Question[]) => {
    const questionsToDraw = limit || 40;
    const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, questionsToDraw);
    
    if (shuffled.length === 0) {
      setError('Pobrana baza pytań jest pusta.');
      setLoading(false);
      return;
    }

    setQuestions(shuffled);
    setUserAnswers(new Array(shuffled.length).fill(null));
    setLoading(false);
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishExam();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const finishExam = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (q.correctAnswerIndex !== null && userAnswers[index] === q.correctAnswerIndex) {
        score++;
      }
    });

    const { examData } = route.params; 

    navigation.navigate('Result', {
      score: score,
      total: questions.length,
      questions: questions,
      userAnswers: userAnswers,
      mode: 'exam',
      examId: examData.id 
    });
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
  
  // Logika adresu obrazka (obsługa offline)
  let imageSource = null;
  if (currentQuestion.media?.type === 'image') {
    imageSource = {
        uri: currentQuestion.media.localFileName 
        ? `${FileSystem.documentDirectory}${currentQuestion.media.localFileName}`
        : GITHUB_IMAGE_BASE_URL + currentQuestion.media.uri 
    };
  }
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.topBar}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Pytanie {currentIndex + 1} / {questions.length}</Text>
        </View>
        
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, timeLeft < 60 && styles.timerWarning]}>
            ⏱ {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <Text style={styles.questionText}>{currentQuestion.text}</Text>

      {/* --- SEKCJA MEDIÓW --- */}
      
      {/* 1. OBRAZKI (z zoomem) */}
      {imageSource && (
        <>
            <TouchableOpacity onPress={() => setIsGalleryVisible(true)} activeOpacity={0.9}>
                <Image
                    source={imageSource}
                    style={styles.mediaFrame}
                    resizeMode="contain"
                />
                <Text style={styles.zoomHint}>🔍 Kliknij, aby powiększyć</Text>
            </TouchableOpacity>

            <ImageView
                images={[imageSource]}
                imageIndex={0}
                visible={isGalleryVisible}
                onRequestClose={() => setIsGalleryVisible(false)}
            />
        </>
      )}

      {/* 2. WIDEO (nowość) */}
      {currentQuestion.media?.type === 'video' && (
        <View style={{ marginBottom: 20 }}>
          <Video
            style={styles.mediaFrame}
            source={{ uri: GITHUB_IMAGE_BASE_URL + currentQuestion.media.uri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        </View>
      )}

      <View style={styles.answersContainer}>
        {currentQuestion.answers.map((ans, idx) => {
          const isSelected = userAnswers[currentIndex] === idx;
          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.answerButton, isSelected && styles.selectedAnswer]} 
              onPress={() => handleAnswer(idx)}
            >
              <Text style={[styles.answerLetter, isSelected && styles.selectedText]}>{['A','B','C','D'][idx]}.</Text>
              <Text style={[styles.answerText, isSelected && styles.selectedText]}>{ans}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity 
          style={[styles.navButton, styles.secondaryButton]} 
          onPress={prevQuestion}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>Poprzednie</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={nextQuestion}>
          <Text style={styles.navButtonText}>
            {currentIndex === questions.length - 1 ? 'Zakończ' : 'Następne'}
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  backButton: { backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: 'bold' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressInfo: { flex: 1 },
  progressText: { fontSize: 14, color: '#666' },
  
  timerContainer: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontWeight: 'bold', fontSize: 16, color: '#333', fontVariant: ['tabular-nums'] },
  timerWarning: { color: 'red' },

  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', backgroundColor: '#007AFF' },

  questionText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, lineHeight: 26 },
  
  // Zmieniłem nazwę z 'image' na 'mediaFrame', żeby pasowała też do wideo
  mediaFrame: { width: '100%', height: 250, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  
  zoomHint: { textAlign: 'center', color: '#007AFF', fontSize: 12, marginBottom: 20, marginTop: 5 },

  answersContainer: { gap: 12, marginBottom: 30 },
  answerButton: { flexDirection: 'row', padding: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  selectedAnswer: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  answerLetter: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginRight: 12 },
  answerText: { fontSize: 16, color: '#333', flex: 1 },
  selectedText: { color: '#fff' },

  navButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  navButton: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  secondaryButton: { backgroundColor: '#6c757d' },
  navButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});