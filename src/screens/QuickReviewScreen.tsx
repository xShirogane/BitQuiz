import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Image, 
  Alert, 
  Modal, 
  StatusBar 
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

export default function QuickReviewScreen({ route, navigation }: any) {
  const { apiUrl } = route.params;
  const { theme } = useTheme();
  
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  
  // Nowy stan do obsługi powiększania zdjęcia
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      setAllQuestions(data);
      drawNewQuestion(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się pobrać pytań. Sprawdź internet.");
      navigation.goBack();
    }
  };

  const drawNewQuestion = (sourceData = allQuestions) => {
    if (sourceData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * sourceData.length);
    setCurrentQuestion(sourceData[randomIndex]);
    setSelectedAnswerIndex(null);
    setIsImageModalVisible(false); // Reset modala przy nowym pytaniu
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswerIndex !== null) return;
    setSelectedAnswerIndex(index);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 10, color: theme.subText }}>Losowanie pytań...</Text>
      </View>
    );
  }

  if (!currentQuestion) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Treść pytania */}
        <View style={[styles.questionBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.questionText, { color: theme.text }]}>
            {currentQuestion.text}
          </Text>

          {/* Obsługa obrazków z funkcją powiększania */}
          {currentQuestion.media && currentQuestion.media.type === 'image' && (
            <>
              <TouchableOpacity 
                onPress={() => setIsImageModalVisible(true)}
                activeOpacity={0.9}
                style={styles.imageContainer}
              >
                <Image
                  source={{ uri: GITHUB_BASE_URL + currentQuestion.media.uri }}
                  style={styles.image}
                  resizeMode="contain"
                />
                
                {/* ZMIANA: Kontener jest teraz pod zdjęciem, nie na nim */}
                <View style={styles.zoomHintContainer}>
                  <Text style={[styles.zoomHintText, { color: theme.subText }]}>
                    🔍 Kliknij zdjęcie, aby powiększyć
                  </Text>
                </View>
              </TouchableOpacity>

              {/* MODAL PEŁNOEKRANOWY */}
              <Modal 
                visible={isImageModalVisible} 
                transparent={true} 
                animationType="fade"
                onRequestClose={() => setIsImageModalVisible(false)} // Obsługa przycisku Wstecz na Androidzie
              >
                <View style={styles.modalContainer}>
                  {/* Ukrywamy pasek stanu dla lepszego efektu na pełnym ekranie */}
                  <StatusBar hidden={true} />
                  
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setIsImageModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕ Zamknij</Text>
                  </TouchableOpacity>

                  <Image
                    source={{ uri: GITHUB_BASE_URL + currentQuestion.media.uri }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                </View>
              </Modal>
            </>
          )}
        </View>

        {/* Lista odpowiedzi */}
        <View style={styles.answersContainer}>
          {currentQuestion.answers.map((answer: string, index: number) => {
            let backgroundColor = theme.card;
            let borderColor = 'transparent';

            if (selectedAnswerIndex !== null) {
              if (index === currentQuestion.correctAnswerIndex) {
                backgroundColor = 'rgba(52, 199, 89, 0.2)';
                borderColor = '#34C759';
              } else if (index === selectedAnswerIndex) {
                backgroundColor = 'rgba(255, 59, 48, 0.2)';
                borderColor = '#FF3B30';
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.answerButton,
                  { backgroundColor, borderColor, borderWidth: 2 }
                ]}
                onPress={() => handleAnswerSelect(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.answerText, { color: theme.text }]}>
                  {['A', 'B', 'C', 'D'][index]}. {answer}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Przycisk "Następne pytanie" */}
        {selectedAnswerIndex !== null && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.primary }]}
            onPress={() => drawNewQuestion()}
          >
            <Text style={styles.nextButtonText}>Następne pytanie 🎲</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  questionBox: { padding: 20, borderRadius: 12, marginBottom: 30, elevation: 2, alignItems: 'center' },
  questionText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', lineHeight: 26, marginBottom: 10 },
  
  // Style dla małego obrazka
  imageContainer: { width: '100%', alignItems: 'center', marginTop: 10,marginBottom: 10 },
  image: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#eee',borderWidth: 1, borderColor: '#ddd'},
  zoomHintContainer: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  zoomHintText: { fontSize: 12, fontWeight: '600',textAlign: 'center'},

  // Style dla Modala (Pełny ekran)
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '80%' },
  closeButton: { position: 'absolute', top: 40, right: 20, padding: 10, zIndex: 10, backgroundColor: 'rgba(50,50,50,0.5)', borderRadius: 20 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  answersContainer: { gap: 12 },
  answerButton: { padding: 16, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  answerText: { fontSize: 16 },
  nextButton: { marginTop: 40, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});