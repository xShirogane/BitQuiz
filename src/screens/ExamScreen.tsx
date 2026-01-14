import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';

const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number | null;
  media?: { type: 'image' | 'video'; uri: string } | null;
}

export default function ExamScreen({ route, navigation }: any) {
  // ZMIANA: Odbieramy parametr 'time'
  const { apiUrl, limit, time } = route.params; 
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ZMIANA: Stan dla licznika czasu (w sekundach)
  const [timeLeft, setTimeLeft] = useState((time || 60) * 60); 

  useEffect(() => {
    fetchQuestions();
  }, []);

  // --- LOGIKA TIMERA ---
  useEffect(() => {
    if (loading) return; // Nie odliczamy podczas ładowania pytań

    // Ustawiamy interwał co 1 sekundę
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
  }, [loading]);

  // --- AUTOMATYCZNE ZAKOŃCZENIE GDY CZAS SIĘ SKOŃCZY ---
  useEffect(() => {
    if (timeLeft === 0 && !loading) {
      finishExam();
    }
  }, [timeLeft, loading]);

  // Formatowanie czasu mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Błąd sieci');
      const allQuestions: Question[] = await response.json();
      
      const questionsToDraw = limit || 40;
      const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, questionsToDraw);
      
      setQuestions(shuffled);
      setUserAnswers(new Array(shuffled.length).fill(null));
      setLoading(false);
    } catch (err) {
      setError('Błąd pobierania pytań.');
      setLoading(false);
    }
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

    navigation.navigate('Result', {
      score: score,
      total: questions.length,
      questions: questions,
      userAnswers: userAnswers
    });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  if (error) return <View style={styles.center}><Text style={{color:'red'}}>{error}</Text></View>;
  if (questions.length === 0) return <View style={styles.center}><Text>Brak pytań.</Text></View>;

  const currentQuestion = questions[currentIndex];
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* GÓRNY PASEK: POSTĘP I CZAS */}
      <View style={styles.topBar}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Pytanie {currentIndex + 1} / {questions.length}</Text>
        </View>
        
        {/* ZMIANA: Wyświetlanie licznika */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, timeLeft < 60 && styles.timerWarning]}>
            ⏱ {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* PASEK POSTĘPU */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <Text style={styles.questionText}>{currentQuestion.text}</Text>

      {currentQuestion.media && currentQuestion.media.type === 'image' && (
        <Image
          source={{ uri: GITHUB_IMAGE_BASE_URL + currentQuestion.media.uri }}
          style={styles.image}
          resizeMode="contain"
        />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressInfo: { flex: 1 },
  progressText: { fontSize: 14, color: '#666' },
  
  timerContainer: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontWeight: 'bold', fontSize: 16, color: '#333', fontVariant: ['tabular-nums'] },
  timerWarning: { color: 'red' },

  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: '100%', backgroundColor: '#007AFF' },

  questionText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, lineHeight: 26 },
  
  image: { width: '100%', height: 250, marginBottom: 20, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },

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