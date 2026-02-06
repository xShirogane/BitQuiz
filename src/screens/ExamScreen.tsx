import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cacheImages } from '../utils/offlineManager';
// 👇 PRZYWRÓCONO IMPORT LEGACY (TO NAPRAWIA ZDJĘCIA)
import * as FileSystem from 'expo-file-system/legacy'; 
import ImageView from "react-native-image-viewing";
import { useVideoPlayer, VideoView } from 'expo-video';

const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

const QuestionVideo = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.videoContainer}>
      <VideoView 
        style={styles.videoView} 
        player={player} 
        contentFit="contain"
        nativeControls={true} 
      />
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

export default function ExamScreen({ route, navigation }: any) {
  const { apiUrl, limit, time } = route.params; 
  const { userProfile } = useAuth();
  const { theme } = useTheme(); 
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
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
    console.log('🚀 [START] Rozpoczynam pobieranie pytań...');
    console.log('🔗 [DEBUG] URL:', apiUrl);

    const cacheKey = `quiz_cache_${apiUrl}`;
    
    try {
      if (!apiUrl) throw new Error('apiUrl is undefined or null!');

      const response = await fetch(apiUrl);
      console.log('S [STATUS] Odpowiedź serwera:', response.status);

      if (!response.ok) throw new Error(`Błąd sieci: ${response.status}`);
      
      const rawQuestions: Question[] = await response.json();
      console.log('📦 [DATA] Pobrane pytania (ilość):', rawQuestions?.length);

      if (!Array.isArray(rawQuestions)) {
         throw new Error('Pobrane dane nie są tablicą!');
      }

      // KROK DIAGNOSTYCZNY: Tymczasowo wyłączamy cacheImages, żeby sprawdzić czy to nie on psuje.
      // Odkomentujemy to, jak pytania tekstowe zaczną działać.
      console.log('⚠️ [SKIP] Pomijam cacheImages dla testu...');
      const questionsWithImages = rawQuestions; 
      // const questionsWithImages = await cacheImages(rawQuestions); 

      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(questionsWithImages));
      } catch (cacheErr) {
        console.warn('⚠️ Nie udało się zapisać cache:', cacheErr);
      }

      processQuestions(questionsWithImages);

    } catch (err) {
      console.error('❌ [ERROR] Wystąpił błąd w fetchQuestions:', err);
      
      // Logika Offline
      console.log('🔄 Próba trybu offline...');
      if (!userProfile?.isPro) {
        setError(`Błąd pobierania: ${err instanceof Error ? err.message : 'Nieznany błąd'}. Tryb Offline tylko dla PRO.`);
        setLoading(false);
        return;
      }

      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          console.log('💾 [CACHE] Załadowano z pamięci telefonu');
          const allQuestions: Question[] = JSON.parse(cachedData);
          processQuestions(allQuestions);
        } else {
          setError('Błąd: Brak internetu i brak zapisanych pytań w pamięci.');
          setLoading(false);
        }
      } catch (storageErr) {
        setError('Krytyczny błąd pamięci cache.');
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
    navigation.replace('Result', {
      score: score,
      total: questions.length,
      questions: questions,
      userAnswers: userAnswers,
      mode: 'exam',
      examId: examData.id 
    });
  };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  
  if (error) return (
    <View style={[styles.center, { backgroundColor: theme.background }]}>
      <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
      <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => navigation.goBack()}>
        <Text style={[styles.backButtonText, { color: theme.text }]}>Wróć</Text>
      </TouchableOpacity>
    </View>
  );

  const currentQuestion = questions[currentIndex];
  
  // Logika adresu obrazka
  let imageSource = null;
  if (currentQuestion.media?.type === 'image') {
    imageSource = {
        uri: currentQuestion.media.localFileName 
        ? `${FileSystem.documentDirectory}${currentQuestion.media.localFileName}`
        : GITHUB_IMAGE_BASE_URL + currentQuestion.media.uri 
    };
  }
  
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={styles.topBar}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: theme.subText }]}>Pytanie {currentIndex + 1} / {questions.length}</Text>
        </View>
        <View style={[styles.timerContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.timerText, { color: theme.text }, timeLeft < 60 && styles.timerWarning]}>
            ⏱ {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion.text}</Text>

      {imageSource && (
        <>
            <TouchableOpacity onPress={() => setIsGalleryVisible(true)} activeOpacity={0.9}>
                <Image
                    source={imageSource}
                    style={[styles.mediaFrame, { borderColor: theme.border, backgroundColor: theme.card }]}
                    resizeMode="contain"
                />
                <Text style={[styles.zoomHint, { color: theme.primary }]}>🔍 Kliknij, aby powiększyć</Text>
            </TouchableOpacity>

            <ImageView
                images={[imageSource]}
                imageIndex={0}
                visible={isGalleryVisible}
                onRequestClose={() => setIsGalleryVisible(false)}
            />
        </>
      )}

      {currentQuestion.media?.type === 'video' && (
        <View style={{ marginBottom: 20 }}>
          <QuestionVideo uri={GITHUB_IMAGE_BASE_URL + currentQuestion.media.uri} />
        </View>
      )}

      <View style={styles.answersContainer}>
        {currentQuestion.answers.map((ans, idx) => {
          const isSelected = userAnswers[currentIndex] === idx;
          const bgColor = isSelected ? theme.primary : theme.card;
          const borderColor = isSelected ? theme.primary : theme.border;
          const textColor = isSelected ? '#fff' : theme.text;
          const letterColor = isSelected ? '#fff' : theme.primary;

          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.answerButton, { backgroundColor: bgColor, borderColor: borderColor }]} 
              onPress={() => handleAnswer(idx)}
            >
              <Text style={[styles.answerLetter, { color: letterColor }]}>{['A','B','C','D'][idx]}.</Text>
              <Text style={[styles.answerText, { color: textColor }]}>{ans}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity 
          style={[styles.navButton, styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]} 
          onPress={prevQuestion}
          disabled={currentIndex === 0}
        >
          <Text style={[styles.navButtonText, { color: theme.text }]}>Poprzednie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.navButton, { backgroundColor: theme.primary }]} 
            onPress={nextQuestion}
        >
          <Text style={styles.navButtonText}>
            {currentIndex === questions.length - 1 ? 'Zakończ' : 'Następne'}
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50, flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { fontWeight: 'bold' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressInfo: { flex: 1 },
  progressText: { fontSize: 14 },
  timerContainer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontWeight: 'bold', fontSize: 16, fontVariant: ['tabular-nums'] },
  timerWarning: { color: 'red' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%' },
  questionText: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, lineHeight: 26 },
  mediaFrame: { width: '100%', height: 250, borderRadius: 8, borderWidth: 1 },
  videoContainer: { width: '100%', height: 250, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  videoView: { width: '100%', height: '100%' },
  zoomHint: { textAlign: 'center', fontSize: 12, marginBottom: 20, marginTop: 5 },
  answersContainer: { gap: 12, marginBottom: 30 },
  answerButton: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  answerLetter: { fontSize: 16, fontWeight: 'bold', marginRight: 12 },
  answerText: { fontSize: 16, flex: 1 },
  navButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  navButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { }, 
  navButtonText: { fontWeight: 'bold', fontSize: 16, color: '#fff' },
});