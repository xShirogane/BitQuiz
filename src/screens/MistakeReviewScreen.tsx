import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Image, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- Theme
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy'; 
import { useVideoPlayer, VideoView } from 'expo-video';

const GITHUB_BASE = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

const QuestionVideo = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });
  return (
    <View style={styles.videoContainer}>
      <VideoView style={styles.videoView} player={player} contentFit="contain" nativeControls={true} />
    </View>
  );
};

export default function MistakeReviewScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useTheme(); // <--- Theme
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState<string>('#333');
  const [activeImageUri, setActiveImageUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchMistakes = async () => {
      if (!user) return;
      try {
        const qSnap = await getDocs(collection(db, 'users', user.uid, 'mistakes'));
        const loaded: any[] = [];
        qSnap.forEach((d) => loaded.push({ docId: d.id, ...d.data() }));
        setQuestions(loaded.sort(() => Math.random() - 0.5));
      } catch (error) { Alert.alert("Błąd", "Nie udało się pobrać."); } 
      finally { setLoading(false); }
    };
    fetchMistakes();
  }, [user]);

  useEffect(() => {
    const currentQ = questions[currentIndex];
    if (currentQ?.media?.type === 'image') {
      const uri = currentQ.media.uri;
      const localFileName = currentQ.media.localFileName || uri.replace(/\//g, '_');
      const docDir = FileSystem.documentDirectory;
      if (docDir) {
        const localUri = `${docDir}${localFileName}`;
        FileSystem.getInfoAsync(localUri).then(info => {
          if (info.exists) setActiveImageUri(localUri);
          else {
            const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
            setActiveImageUri(`${GITHUB_BASE}${cleanUri}`);
          }
        });
      } else { setActiveImageUri(`${GITHUB_BASE}${uri.startsWith('/') ? uri.substring(1) : uri}`); }
    } else { setActiveImageUri(null); }
  }, [currentIndex, questions]);

  const handleAnswer = async (index: number) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(index);
    setIsAnswerChecked(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correctAnswerIndex;
    const mistakeRef = doc(db, 'users', user!.uid, 'mistakes', currentQ.docId);

    if (isCorrect) {
      const newConsecutive = (currentQ.consecutiveCorrect || 0) + 1;
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
      setSelectedAnswer(null); setIsAnswerChecked(false); setStatusMessage(null);
    } else {
      Alert.alert("Koniec!", "To wszystkie błędy.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    }
  };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" /></View>;

  if (questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="checkmark-done-circle" size={100} color="#4CAF50" />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Wszystko czyste!</Text>
        <Text style={[styles.emptyText, { color: theme.subText }]}>Brak zaległych błędów.</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Trener Błędów</Text>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={18} color="#FF9800" />
          <Text style={styles.streakText}>{currentQ.consecutiveCorrect || 0}/2</Text>
        </View>
      </View>

      <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={styles.questionCounter}>PYTANIE {currentIndex + 1} / {questions.length}</Text>
          <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.text}</Text>
          
          {activeImageUri && <Image source={{ uri: activeImageUri }} style={styles.image} resizeMode="contain" />}
          {currentQ.media?.type === 'video' && (
            <View style={{ marginTop: 15 }}>
              <QuestionVideo uri={GITHUB_BASE + currentQ.media.uri} />
            </View>
          )}
        </View>

        <View style={styles.answersContainer}>
          {currentQ.answers.map((ans: string, idx: number) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = currentQ.correctAnswerIndex === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.answerWrapper,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && { borderColor: theme.primary, backgroundColor: theme.background },
                  isAnswerChecked && isCorrect && styles.answerWrapperCorrect,
                  isAnswerChecked && isSelected && !isCorrect && styles.answerWrapperWrong,
                  isAnswerChecked && !isCorrect && !isSelected && { opacity: 0.5 }
                ]}
                onPress={() => handleAnswer(idx)}
                disabled={isAnswerChecked}
              >
                <View style={[styles.letterContainer, { backgroundColor: theme.background }]}>
                  <Text style={[styles.letterText, { color: theme.text }]}>{String.fromCharCode(65 + idx)}</Text>
                </View>
                <Text style={[styles.answerText, { color: theme.text }]}>{ans}</Text>
                {isAnswerChecked && isCorrect && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {statusMessage && (
        <View style={[styles.bottomStatus, { backgroundColor: statusColor }]}>
          <Text style={styles.bottomStatusText}>{statusMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, elevation: 2 },
  headerIcon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakText: { fontSize: 14, fontWeight: 'bold', color: '#E65100', marginLeft: 5 },
  progressBarBg: { height: 4, width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50' },
  scrollContent: { padding: 16, paddingBottom: 80 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20, elevation: 4 },
  questionCounter: { fontSize: 12, fontWeight: 'bold', color: '#9E9E9E', marginBottom: 8, letterSpacing: 1 },
  questionText: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  image: { width: '100%', height: 200, marginTop: 15, borderRadius: 8, backgroundColor: '#FAFAFA' },
  videoContainer: { width: '100%', height: 200, backgroundColor: '#000', borderRadius: 8, overflow: 'hidden' },
  videoView: { width: '100%', height: '100%' },
  answersContainer: { gap: 12 },
  answerWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16, borderWidth: 1 },
  answerWrapperCorrect: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  answerWrapperWrong: { backgroundColor: '#F44336', borderColor: '#F44336' },
  letterContainer: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  letterText: { fontSize: 14, fontWeight: 'bold' },
  answerText: { fontSize: 16, fontWeight: '500', flex: 1 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  emptyText: { fontSize: 16, marginTop: 10, marginBottom: 30 },
  backBtn: { paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bottomStatus: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  bottomStatusText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});