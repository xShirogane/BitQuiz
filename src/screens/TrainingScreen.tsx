import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Image, TextInput, Alert, Keyboard 
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../context/ThemeContext'; // <--- 1. Import Motywu

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

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

export default function TrainingScreen({ route, navigation }: any) {
  const { apiUrl } = route.params;
  const { theme } = useTheme(); // <--- 2. Użycie Motywu

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [jumpText, setJumpText] = useState('');

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
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.subText }}>Ładowanie bazy wiedzy...</Text>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const isAnswered = selectedAnswerIndex !== null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* GÓRNY PASEK */}
      <View style={[styles.topBar, { backgroundColor: theme.card }]}>
        <Text style={[styles.counterText, { color: theme.subText }]}>
          Pytanie {currentIndex + 1} / {questions.length}
        </Text>
        
        <View style={styles.jumpContainer}>
          <TextInput 
            style={[styles.jumpInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="#"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
            value={jumpText}
            onChangeText={setJumpText}
            maxLength={4}
          />
          <TouchableOpacity style={[styles.jumpButton, { backgroundColor: theme.primary }]} onPress={handleJumpToQuestion}>
            <Text style={styles.jumpButtonText}>IDŹ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.text}</Text>

        {currentQ.media && (
          <View style={styles.mediaContainer}>
            {currentQ.media.type === 'image' && (
              <Image
                source={{ uri: GITHUB_BASE_URL + currentQ.media.uri }}
                style={styles.image}
                resizeMode="contain"
              />
            )}
            {currentQ.media.type === 'video' && (
              <QuestionVideo uri={GITHUB_BASE_URL + currentQ.media.uri} />
            )}
          </View>
        )}

        {/* ODPOWIEDZI */}
        <View style={styles.answersContainer}>
          {currentQ.answers.map((ans: string, idx: number) => {
            
            // LOGIKA KOLORÓW
            // Domyślne (nie wybrano jeszcze nic)
            let backgroundColor = theme.card; 
            let borderColor = theme.border;
            let textColor = theme.text;
            let letterColor = theme.primary;

            if (isAnswered) {
              if (idx === currentQ.correctAnswerIndex) {
                // Poprawna - Zielony (zawsze jasny/wyraźny)
                backgroundColor = '#D4EDDA'; 
                borderColor = '#28A745';
                textColor = '#155724';
                letterColor = '#155724';
              } else if (idx === selectedAnswerIndex) {
                // Błędna Twoja - Czerwony
                backgroundColor = '#F8D7DA';
                borderColor = '#DC3545';
                textColor = '#721C24';
                letterColor = '#721C24';
              }
            } else if (selectedAnswerIndex === idx) {
                // To się rzadko zdarzy bo od razu pokazujemy wynik, ale dla spójności:
                backgroundColor = theme.primary;
                textColor = '#fff';
            }

            return (
              <TouchableOpacity 
                key={idx} 
                style={[styles.answerButton, { backgroundColor, borderColor }]} 
                onPress={() => handleAnswer(idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.answerLetter, { color: letterColor }]}>
                  {['A','B','C','D'][idx]}.
                </Text>
                <Text style={[styles.answerText, { color: textColor }]}>{ans}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* DOLNY PASEK NAWIGACJI */}
      <View style={[styles.bottomNav, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.primary }, currentIndex === 0 && styles.disabledButton]} 
          onPress={goToPrev}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>← Poprzednie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, { backgroundColor: theme.primary }, currentIndex === questions.length - 1 && styles.disabledButton]} 
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
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15,
    elevation: 2, zIndex: 10
  },
  counterText: { fontSize: 16, fontWeight: 'bold' },
  jumpContainer: { flexDirection: 'row', alignItems: 'center' },
  jumpInput: { 
    width: 60, height: 36, borderRadius: 8, 
    textAlign: 'center', marginRight: 8, borderWidth: 1
  },
  jumpButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  jumpButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  questionText: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, lineHeight: 28 },
  mediaContainer: { marginBottom: 20, width: '100%', alignItems: 'center' },
  image: { width: '100%', height: 200, backgroundColor: '#fff', borderRadius: 8 },
  videoContainer: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' },
  videoView: { width: '100%', height: '100%' },
  answersContainer: { gap: 12 },
  answerButton: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  answerLetter: { fontSize: 18, fontWeight: 'bold', marginRight: 15 },
  answerText: { fontSize: 16, flex: 1, lineHeight: 22 },
  bottomNav: {
    flexDirection: 'row', padding: 15, borderTopWidth: 1,
    position: 'absolute', bottom: 0, left: 0, right: 0, justifyContent: 'space-between'
  },
  navButton: { 
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, minWidth: 120, alignItems: 'center'
  },
  disabledButton: { backgroundColor: '#CCC' },
  navButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});