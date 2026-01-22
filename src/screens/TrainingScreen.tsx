import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Image, TextInput, Alert, Keyboard 
} from 'react-native';
// 1. IMPORTUJEMY MODUŁ WIDEO
import { Video, ResizeMode } from 'expo-av';

// ADRES BAZOWY (dla zdjęć i wideo)
const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export default function TrainingScreen({ route, navigation }: any) {
  const { apiUrl } = route.params;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [jumpText, setJumpText] = useState('');

  // Ref do wideo, aby móc np. zatrzymać je przy zmianie pytania (opcjonalne)
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      Alert.alert("Błąd", "Nie udało się pobrać pytań.");
      navigation.goBack();
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswerIndex !== null) return; 
    setSelectedAnswerIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswerIndex(null); 
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswerIndex(null); 
    }
  };

  const handleJumpToQuestion = () => {
    const questionNumber = parseInt(jumpText, 10);
    if (isNaN(questionNumber)) {
      Alert.alert("Błąd", "Wpisz poprawny numer.");
      return;
    }
    if (questionNumber < 1 || questionNumber > questions.length) {
      Alert.alert("Błąd", `Wpisz numer od 1 do ${questions.length}.`);
      return;
    }
    setCurrentIndex(questionNumber - 1);
    setSelectedAnswerIndex(null);
    setJumpText(''); 
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Ładowanie bazy wiedzy...</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswerIndex !== null;

  return (
    <View style={styles.container}>
      
      {/* GÓRNY PASEK */}
      <View style={styles.topBar}>
        <Text style={styles.counterText}>
          Pytanie {currentIndex + 1} / {questions.length}
        </Text>
        
        <View style={styles.jumpContainer}>
          <TextInput 
            style={styles.jumpInput}
            placeholder="#"
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={jumpText}
            onChangeText={setJumpText}
            maxLength={4}
          />
          <TouchableOpacity style={styles.jumpButton} onPress={handleJumpToQuestion}>
            <Text style={styles.jumpButtonText}>IDŹ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.questionText}>{currentQ.text}</Text>

        {/* --- OBSŁUGA MEDIÓW (ZDJĘCIA I WIDEO) --- */}
        {currentQ.media && (
          <View style={styles.mediaContainer}>
            {/* PRZYPADEK 1: OBRAZEK */}
            {currentQ.media.type === 'image' && (
              <Image
                source={{ uri: GITHUB_BASE_URL + currentQ.media.uri }}
                style={styles.image}
                resizeMode="contain"
              />
            )}

            {/* PRZYPADEK 2: WIDEO (NOWOŚĆ!) */}
            {currentQ.media.type === 'video' && (
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: GITHUB_BASE_URL + currentQ.media.uri }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
              />
            )}
          </View>
        )}

        {/* ODPOWIEDZI */}
        <View style={styles.answersContainer}>
          {currentQ.answers.map((ans: string, idx: number) => {
            let backgroundColor = '#fff';
            let borderColor = '#E0E0E0';
            let textColor = '#333';

            if (isAnswered) {
              if (idx === currentQ.correctAnswerIndex) {
                backgroundColor = '#D4EDDA'; 
                borderColor = '#28A745';
                textColor = '#155724';
              } else if (idx === selectedAnswerIndex) {
                backgroundColor = '#F8D7DA';
                borderColor = '#DC3545';
                textColor = '#721C24';
              }
            } else if (selectedAnswerIndex === idx) {
                backgroundColor = '#E3F2FD';
            }

            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.answerButton, { backgroundColor, borderColor }]} 
                onPress={() => handleAnswer(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.answerLetter, { color: isAnswered && idx === currentQ.correctAnswerIndex ? '#155724' : '#007AFF' }]}>
                  {['A','B','C','D'][idx]}.
                </Text>
                <Text style={[styles.answerText, { color: textColor }]}>{ans}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* DOLNY PASEK */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]} 
          onPress={goToPrev}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>← Poprzednie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, currentIndex === questions.length - 1 && styles.disabledButton]} 
          onPress={goToNext}
          disabled={currentIndex === questions.length - 1}
        >
          <Text style={styles.navButtonText}>Następne →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15,
    backgroundColor: '#fff', elevation: 2, zIndex: 10
  },
  counterText: { fontSize: 16, fontWeight: 'bold', color: '#555' },
  jumpContainer: { flexDirection: 'row', alignItems: 'center' },
  jumpInput: { 
    backgroundColor: '#F0F2F5', width: 60, height: 36, borderRadius: 8, 
    textAlign: 'center', marginRight: 8, borderWidth: 1, borderColor: '#DDD' 
  },
  jumpButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  jumpButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  scrollContent: { padding: 20, paddingBottom: 100 },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20, lineHeight: 28 },
  
  // --- Style dla mediów ---
  mediaContainer: { marginBottom: 20, width: '100%', alignItems: 'center' },
  image: { width: '100%', height: 200, backgroundColor: '#fff', borderRadius: 8 },
  video: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: 8 },

  answersContainer: { gap: 12 },
  answerButton: { 
    flexDirection: 'row', padding: 16, borderRadius: 12, 
    borderWidth: 2, alignItems: 'center' 
  },
  answerLetter: { fontSize: 18, fontWeight: 'bold', marginRight: 15 },
  answerText: { fontSize: 16, flex: 1, lineHeight: 22 },

  bottomNav: {
    flexDirection: 'row', padding: 15, backgroundColor: '#fff', 
    borderTopWidth: 1, borderTopColor: '#eee',
    position: 'absolute', bottom: 0, left: 0, right: 0,
    justifyContent: 'space-between'
  },
  navButton: { 
    backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 20, 
    borderRadius: 25, minWidth: 120, alignItems: 'center'
  },
  disabledButton: { backgroundColor: '#CCC' },
  navButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});