import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Image, Dimensions 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system'; // Potrzebne do obrazków offline

// Stała do adresów URL obrazków (jeśli nie są offline) - dopasuj do swojej konfiguracji
const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

type Props = NativeStackScreenProps<RootStackParamList, 'MistakeReview'>;

interface MediaObject {
  type: 'image' | 'video';
  uri: string;
  localFileName?: string; // Jeśli mamy to z cache
}

interface MistakeQuestion {
  docId: string;
  questionId: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
  consecutiveCorrect: number;
  media?: MediaObject; // Dodano obsługę mediów
}

const { width } = Dimensions.get('window');

export default function MistakeReviewScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<MistakeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState<string>('#333');

  useEffect(() => {
    const fetchMistakes = async () => {
      if (!user) return;
      try {
        const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'mistakes'));
        const loadedQuestions: MistakeQuestion[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          loadedQuestions.push({
            docId: doc.id,
            questionId: data.questionId,
            text: data.text,
            answers: data.answers,
            correctAnswerIndex: data.correctAnswerIndex,
            consecutiveCorrect: data.consecutiveCorrect || 0,
            media: data.media || undefined, // Pobieramy media
          });
        });

        // Mieszamy pytania
        setQuestions(loadedQuestions.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error("Błąd pobierania błędów:", error);
        Alert.alert("Błąd", "Nie udało się pobrać pytań.");
      } finally {
        setLoading(false);
      }
    };

    fetchMistakes();
  }, [user]);

  const handleAnswer = async (index: number) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(index);
    setIsAnswerChecked(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correctAnswerIndex;
    const mistakeRef = doc(db, 'users', user!.uid, 'mistakes', currentQ.docId);

    if (isCorrect) {
      const newConsecutive = currentQ.consecutiveCorrect + 1;
      
      if (newConsecutive >= 2) {
        setStatusMessage("🎉 Świetnie! Pytanie usunięte z bazy błędów.");
        setStatusColor('#4CAF50'); // Zielony
        await deleteDoc(mistakeRef);
      } else {
        setStatusMessage("👍 Dobrze! Jeszcze raz i zniknie.");
        setStatusColor('#2196F3'); // Niebieski
        await updateDoc(mistakeRef, { consecutiveCorrect: newConsecutive });
      }
    } else {
      setStatusMessage("❌ Błąd. Resetujemy licznik postępu.");
      setStatusColor('#F44336'); // Czerwony
      await updateDoc(mistakeRef, {
        consecutiveCorrect: 0,
        mistakeCount: increment(1)
      });
    }

    setTimeout(() => {
      nextQuestion();
    }, 2000); // Troszkę dłuższy czas na przeczytanie komunikatu
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setStatusMessage(null);
    } else {
      Alert.alert("Koniec treningu!", "Wyczyściłeś listę na tę chwilę.", [
        { text: "Wróć do menu", onPress: () => navigation.goBack() }
      ]);
    }
  };

  // Funkcja pomocnicza do generowania źródła obrazka
  const getImageSource = (media: MediaObject) => {
    if (media.localFileName) {
      // Jeśli mamy plik offline
      return { uri: `${FileSystem.documentDirectory}${media.localFileName}` };
    }
    // Fallback do online
    return { uri: GITHUB_IMAGE_BASE_URL + media.uri };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analizuję Twoje błędy...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIconContainer}>
            <Ionicons name="trophy-outline" size={80} color="#FFD700" />
        </View>
        <Text style={styles.emptyTitle}>Wszystko czyste!</Text>
        <Text style={styles.emptyText}>Nie masz żadnych zaległych pytań do poprawy.</Text>
        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.goBack()}>
          <Text style={styles.mainButtonText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.headerRow}>
            <Text style={styles.counterText}>Pytanie {currentIndex + 1} z {questions.length}</Text>
            <View style={styles.streakBadge}>
                <Ionicons name="flame" size={14} color="#FF9500" />
                <Text style={styles.streakText}> Seria: {currentQ.consecutiveCorrect}/2</Text>
            </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- KARTA PYTANIA --- */}
        <View style={styles.questionCard}>
          {/* Obrazek (jeśli istnieje) */}
          {currentQ.media && currentQ.media.type === 'image' && (
            <Image 
              source={getImageSource(currentQ.media)} 
              style={styles.questionImage} 
              resizeMode="contain"
            />
          )}

          <Text style={styles.questionText}>{currentQ.text}</Text>
        </View>

        {/* --- ODPOWIEDZI --- */}
        <View style={styles.answersContainer}>
          {currentQ.answers.map((ans, idx) => {
            let btnStyle = styles.answerButton;
            let textStyle = styles.answerText;
            let iconName = "ellipse-outline"; // Domyślna ikona (puste kółko)

            if (isAnswerChecked) {
              if (idx === currentQ.correctAnswerIndex) {
                btnStyle = styles.answerCorrect;
                textStyle = styles.answerTextWhite;
                iconName = "checkmark-circle";
              } else if (idx === selectedAnswer) {
                btnStyle = styles.answerWrong;
                textStyle = styles.answerTextWhite;
                iconName = "close-circle";
              } else {
                 btnStyle = styles.answerDimmed; // Pozostałe opcje przygaszone
              }
            } else if (idx === selectedAnswer) {
                 btnStyle = styles.answerSelected; // Stan wciśnięcia (przed puszczeniem)
            }

            return (
              <TouchableOpacity
                key={idx}
                style={btnStyle}
                onPress={() => handleAnswer(idx)}
                disabled={isAnswerChecked}
                activeOpacity={0.8}
              >
                <View style={styles.answerContent}>
                    <Ionicons 
                        name={iconName as any} 
                        size={24} 
                        color={isAnswerChecked && (idx === currentQ.correctAnswerIndex || idx === selectedAnswer) ? '#fff' : '#007AFF'} 
                        style={{ marginRight: 10 }}
                    />
                    <Text style={textStyle}>
                       {ans}
                    </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* --- STATUS BAR (POJAWIA SIĘ NA DOLE) --- */}
      {statusMessage && (
        <View style={[styles.bottomStatus, { backgroundColor: statusColor }]}>
            <Text style={styles.bottomStatusText}>{statusMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666' },
  
  // Header styles
  header: { backgroundColor: '#fff', paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  progressBarContainer: { height: 4, backgroundColor: '#E0E0E0', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#007AFF' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  counterText: { fontSize: 14, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  streakText: { color: '#E65100', fontWeight: 'bold', fontSize: 12 },

  scrollContent: { padding: 16, paddingBottom: 100 },

  // Question Card
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    // Cienie
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#FAFAFA' // Tło zanim załaduje się obrazek
  },
  questionText: { fontSize: 18, fontWeight: '700', color: '#222', lineHeight: 26 },

  // Answers
  answersContainer: { gap: 12 },
  answerButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  answerSelected: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
  answerCorrect: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  answerWrong: { backgroundColor: '#F44336', borderColor: '#F44336' },
  answerDimmed: { opacity: 0.6, backgroundColor: '#f9f9f9', borderColor: '#eee' }, // Szary dla niewybranych
  
  answerContent: { flexDirection: 'row', alignItems: 'center' },
  answerText: { fontSize: 16, color: '#333', flex: 1, fontWeight: '500' },
  answerTextWhite: { fontSize: 16, color: '#fff', flex: 1, fontWeight: 'bold' },

  // Empty State
  emptyIconContainer: { marginBottom: 20, backgroundColor: '#FFF9C4', padding: 20, borderRadius: 50 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  mainButton: { backgroundColor: '#222', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30 },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Status Bar
  bottomStatus: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  bottomStatusText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});