import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Image, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system'; 
// 1. ZMIANA: Nowa biblioteka wideo
import { useVideoPlayer, VideoView } from 'expo-video';

// Baza do zdjęć
const GITHUB_BASE = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

// 2. KOMPONENT POMOCNICZY DO WIDEO
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
        // USUNIĘTO: allowsFullscreen (bo generowało błąd)
        // USUNIĘTO: allowsPictureInPicture (opcjonalne, też można usunąć dla czystości)
        nativeControls={true} // To zapewnia systemowe przyciski (play, pauza, fullscreen)
      />
    </View>
  );
};

type Props = NativeStackScreenProps<RootStackParamList, 'MistakeReview'>;

interface MistakeQuestion {
  docId: string;
  questionId: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
  consecutiveCorrect: number;
  media?: {
    type: 'image' | 'video';
    uri: string;
    localFileName?: string;
  };
}

const { width } = Dimensions.get('window');

export default function MistakeReviewScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<MistakeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Stany interakcji
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState<string>('#333');

  // Adres obrazka
  const [activeImageUri, setActiveImageUri] = useState<string | null>(null);

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
            media: data.media || undefined,
          });
        });
        setQuestions(loadedQuestions.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error("Błąd pobierania:", error);
        Alert.alert("Błąd", "Nie udało się pobrać pytań.");
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, [user]);

  // LOGIKA OBRAZKÓW (Lokalne vs Zdalne)
  useEffect(() => {
    const currentQ = questions[currentIndex];
    if (currentQ?.media?.type === 'image') {
      const uri = currentQ.media.uri;
      const localFileName = currentQ.media.localFileName || uri.replace(/\//g, '_');
      
      const docDir = (FileSystem as any).documentDirectory; 
      
      if (docDir) {
        const localUri = `${docDir}${localFileName}`;
        FileSystem.getInfoAsync(localUri).then(info => {
          if (info.exists) {
            setActiveImageUri(localUri);
          } else {
            const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
            const remoteUrl = `${GITHUB_BASE}${cleanUri}`;
            setActiveImageUri(remoteUrl);
          }
        });
      } else {
         const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
         setActiveImageUri(`${GITHUB_BASE}${cleanUri}`);
      }
    } else {
      setActiveImageUri(null);
    }
  }, [currentIndex, questions]);

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
        setStatusMessage("✅ Świetnie! Pytanie usunięte z bazy błędów.");
        setStatusColor('#4CAF50');
        await deleteDoc(mistakeRef);
      } else {
        setStatusMessage("👍 Dobrze! Jeszcze raz i zniknie.");
        setStatusColor('#2196F3');
        await updateDoc(mistakeRef, { consecutiveCorrect: newConsecutive });
      }
    } else {
      setStatusMessage("❌ Błąd. Reset licznika.");
      setStatusColor('#F44336');
      await updateDoc(mistakeRef, { consecutiveCorrect: 0, mistakeCount: increment(1) });
    }

    setTimeout(() => nextQuestion(), 2000);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setStatusMessage(null);
    } else {
      Alert.alert("Koniec!", "To wszystkie błędy na teraz.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  if (questions.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-done-circle" size={100} color="#4CAF50" />
        <Text style={styles.emptyTitle}>Wszystko czyste!</Text>
        <Text style={styles.emptyText}>Nie masz żadnych zaległych pytań.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trener Błędów</Text>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={18} color="#FF9800" />
          <Text style={styles.streakText}>{currentQ.consecutiveCorrect}/2</Text>
        </View>
      </View>

      {/* PASEK POSTĘPU */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* KARTA PYTANIA */}
        <View style={styles.card}>
          <Text style={styles.questionCounter}>PYTANIE {currentIndex + 1} / {questions.length}</Text>
          <Text style={styles.questionText}>{currentQ.text}</Text>

          {/* --- OBSŁUGA MEDIÓW --- */}
          
          {/* 1. OBRAZEK */}
          {currentQ.media?.type === 'image' && activeImageUri && (
            <Image
              source={{ uri: activeImageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          )}

          {/* 2. WIDEO (NOWOŚĆ) */}
          {currentQ.media?.type === 'video' && (
            <View style={{ marginTop: 15 }}>
              <QuestionVideo uri={GITHUB_BASE + currentQ.media.uri} />
            </View>
          )}
        </View>

        {/* ODPOWIEDZI */}
        <View style={styles.answersContainer}>
          {currentQ.answers.map((ans, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = currentQ.correctAnswerIndex === idx;
            
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.answerWrapper,
                  isSelected && styles.answerWrapperSelected,
                  isAnswerChecked && isCorrect && styles.answerWrapperCorrect,
                  isAnswerChecked && isSelected && !isCorrect && styles.answerWrapperWrong,
                  isAnswerChecked && !isCorrect && !isSelected && styles.answerWrapperDimmed
                ]}
                onPress={() => handleAnswer(idx)}
                disabled={isAnswerChecked}
                activeOpacity={0.9}
              >
                <View style={[
                    styles.letterContainer,
                    isAnswerChecked && (isCorrect || (isSelected && !isCorrect)) && styles.letterContainerWhite
                ]}>
                  <Text style={[
                      styles.letterText,
                      isAnswerChecked && isCorrect && styles.letterTextCorrect,
                      isAnswerChecked && isSelected && !isCorrect && styles.letterTextWrong
                  ]}>
                      {String.fromCharCode(65 + idx)}
                  </Text>
                </View>

                <Text style={[
                    styles.answerText,
                    isAnswerChecked && (isCorrect || (isSelected && !isCorrect)) && styles.answerTextWhite
                ]}>
                    {ans}
                </Text>
                
                {isAnswerChecked && isCorrect && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
                {isAnswerChecked && isSelected && !isCorrect && <Ionicons name="close-circle" size={24} color="#fff" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* STATUS BAR NA DOLE */}
      {statusMessage && (
        <View style={[styles.bottomStatus, { backgroundColor: statusColor }]}>
          <Text style={styles.bottomStatusText}>{statusMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', 
    elevation: 2 
  },
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakText: { fontSize: 14, fontWeight: 'bold', color: '#E65100', marginLeft: 5 },

  progressBarBg: { height: 4, backgroundColor: '#E0E0E0', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50' },

  scrollContent: { padding: 16, paddingBottom: 80 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  questionCounter: { fontSize: 12, fontWeight: 'bold', color: '#9E9E9E', marginBottom: 8, letterSpacing: 1 },
  questionText: { fontSize: 18, fontWeight: '600', color: '#212121', lineHeight: 26 },
  
  image: { width: '100%', height: 200, marginTop: 15, borderRadius: 8, backgroundColor: '#FAFAFA' },

  // Nowe style dla wideo
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoView: {
    width: '100%',
    height: '100%'
  },

  answersContainer: { gap: 12 },
  answerWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E0E0',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
  },
  answerWrapperSelected: { borderColor: '#2196F3', backgroundColor: '#E3F2FD' },
  answerWrapperCorrect: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  answerWrapperWrong: { backgroundColor: '#F44336', borderColor: '#F44336' },
  answerWrapperDimmed: { opacity: 0.5, backgroundColor: '#F5F5F5' },

  letterContainer: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  letterContainerWhite: { backgroundColor: '#fff' },
  letterText: { fontSize: 14, fontWeight: 'bold', color: '#616161' },
  letterTextCorrect: { color: '#4CAF50' },
  letterTextWrong: { color: '#F44336' },

  answerText: { fontSize: 16, fontWeight: '500', color: '#424242', flex: 1 },
  answerTextWhite: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },

  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, color: '#333' },
  emptyText: { fontSize: 16, color: '#757575', marginTop: 10, marginBottom: 30 },
  backBtn: { backgroundColor: '#212121', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  bottomStatus: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16
  },
  bottomStatusText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});