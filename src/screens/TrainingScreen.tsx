import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';

const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export default function TrainingScreen({ route, navigation }: any) {
  const { apiUrl } = route.params;
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Stan dla konkretnego pytania
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false); // Czy użytkownik kliknął "Sprawdź"

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      // --- ZMIANA TUTAJ ---
      // Usunęliśmy losowanie (shuffled).
      // Teraz pytania ładują się dokładnie w takiej kolejności, jak są w pliku JSON.
      setQuestions(data);
      
      setLoading(false);
    } catch (err) {
      Alert.alert('Błąd', 'Nie udało się pobrać pytań.');
      navigation.goBack();
    }
  };

  const handleSelect = (idx: number) => {
    // Pozwalamy zmienić zaznaczenie tylko jeśli jeszcze nie sprawdzono odpowiedzi
    if (!isChecked) {
      setSelectedAnswer(idx);
    }
  };

  const checkAnswer = () => {
    setIsChecked(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null); // Resetujemy wybór
      setIsChecked(false);     // Resetujemy sprawdzenie
    } else {
      Alert.alert("Gratulacje!", "Przerobiłeś wszystkie pytania z tej bazy.");
      navigation.goBack();
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF"/></View>;

  // Zabezpieczenie na wypadek pustej bazy
  if (questions.length === 0) return <View style={styles.center}><Text>Brak pytań.</Text></View>;

  const currentQ = questions[currentIndex];
  // Sprawdzamy, czy odpowiedź jest poprawna (używamy pola correctAnswerIndex z JSONa)
  const isCorrect = selectedAnswer === currentQ.correctAnswerIndex;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.counter}>Pytanie {currentIndex + 1} / {questions.length}</Text>
      
      <Text style={styles.question}>{currentQ.text}</Text>
      
      {currentQ.media && currentQ.media.type === 'image' && (
        <Image
          source={{ uri: GITHUB_IMAGE_BASE_URL + currentQ.media.uri }}
          style={styles.image}
          resizeMode="contain"
        />
      )}

      <View style={styles.answers}>
        {currentQ.answers.map((ans: string, idx: number) => {
          let bgStyle = {};
          let textStyle = {};
          
          if (isChecked) {
            // Logika kolorowania PO sprawdzeniu
            if (idx === currentQ.correctAnswerIndex) {
              bgStyle = styles.correctBg; // Prawidłowa zawsze na zielono
              textStyle = styles.whiteText;
            } else if (idx === selectedAnswer && idx !== currentQ.correctAnswerIndex) {
              bgStyle = styles.wrongBg; // Błędnie zaznaczona na czerwono
              textStyle = styles.whiteText;
            }
          } else {
            // Logika zaznaczania PRZED sprawdzeniem
            if (selectedAnswer === idx) {
              bgStyle = styles.selectedBg;
              textStyle = styles.whiteText;
            }
          }

          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.answerBtn, bgStyle]} 
              onPress={() => handleSelect(idx)}
              activeOpacity={0.8}
            >
              <Text style={[styles.answerText, textStyle]}>{['A','B','C','D'][idx]}. {ans}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* PRZYCISKI AKCJI */}
      <View style={styles.footer}>
        {!isChecked ? (
          <TouchableOpacity 
            style={[styles.actionBtn, selectedAnswer === null && styles.disabledBtn]} 
            onPress={checkAnswer}
            disabled={selectedAnswer === null}
          >
            <Text style={styles.actionBtnText}>SPRAWDŹ</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.feedbackContainer}>
            <Text style={[styles.feedbackText, isCorrect ? {color:'green'} : {color:'red'}]}>
              {isCorrect ? "Świetnie! Dobra odpowiedź." : "Niestety, to błąd."}
            </Text>
            <TouchableOpacity style={styles.actionBtn} onPress={nextQuestion}>
              <Text style={styles.actionBtnText}>NASTĘPNE PYTANIE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {flex:1, justifyContent:'center', alignItems:'center'},
  container: { padding: 20, paddingBottom: 50, flexGrow: 1, backgroundColor: '#fff' },
  counter: { color: '#888', marginBottom: 10, textAlign:'center' },
  question: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  image: { width: '100%', height: 200, marginBottom: 20, resizeMode:'contain' },
  answers: { gap: 10, marginBottom: 30 },
  answerBtn: { padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, backgroundColor: '#fff' },
  answerText: { fontSize: 16, color: '#333' },
  
  selectedBg: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  correctBg: { backgroundColor: '#34C759', borderColor: '#34C759' },
  wrongBg: { backgroundColor: '#FF3B30', borderColor: '#FF3B30' },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  
  footer: { marginTop: 10 },
  actionBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  feedbackContainer: { gap: 15 },
  feedbackText: { textAlign: 'center', fontSize: 18, fontWeight: 'bold' }
});