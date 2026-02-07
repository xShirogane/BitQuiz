import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, increment, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy'; 
import { useVideoPlayer, VideoView } from 'expo-video';

// Stała do GitHub Assets
const GITHUB_BASE = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

// Komponent wideo (wydzielony dla czytelności)
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

export default function MistakeReviewScreen({ route, navigation }: any) {
  // Odbieramy dane egzaminu. Jeśli ich nie ma, wracamy bezpiecznie (fallback).
  const { examData } = route.params || {};
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState<string>('#333');
  const [activeImageUri, setActiveImageUri] = useState<string | null>(null);

  // 1. POBIERANIE PYTAŃ (Bez limitów!)
  useEffect(() => {
    const fetchMistakes = async () => {
      if (!user || !examData?.id) return;
      
      try {
        setLoading(true);
        
        // Tworzymy listę wariantów ID (małe i duże litery)
        // Dzięki temu znajdzie zarówno "inf03" jak i "INF03"
        const targetId = examData.id; 
        const possibleIds = [
            targetId, 
            targetId.toLowerCase(), 
            targetId.toUpperCase()
        ];
        
        // Usuwamy duplikaty (np. jeśli targetId to już 'inf03')
        const uniqueIds = [...new Set(possibleIds)];

        //console.log(`🔍 Szukam błędów dla ID: ${JSON.stringify(uniqueIds)}...`);

        const q = query(
          collection(db, 'users', user.uid, 'mistakes'),
          where('examId', 'in', uniqueIds) // <--- TU JEST KLUCZOWA ZMIANA
        );
        
        const qSnap = await getDocs(q);
        const loaded: any[] = [];
        qSnap.forEach((d) => loaded.push({ docId: d.id, ...d.data() }));

      //  console.log(`✅ Znaleziono: ${loaded.length} błędów.`);

        if (loaded.length === 0) {
            // OSTATNIA DESKA RATUNKU: DIAGNOSTYKA
            // Jeśli nadal 0, pobierzmy 1 dowolny błąd, żeby zobaczyć jak wygląda w bazie
           // console.log("⚠️ Nadal 0? Pobieram przykładowy błąd do analizy...");
            const debugQ = query(collection(db, 'users', user.uid, 'mistakes'));
            const debugSnap = await getDocs(debugQ);
            if (!debugSnap.empty) {
                //console.log("💡 Przykładowy błąd z bazy (sprawdź pole examId):", debugSnap.docs[0].data());
            } else {
               // console.log("💀 Baza błędów jest całkowicie pusta.");
            }
        }

        const shuffled = [...loaded].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      } catch (error) { 
        console.error("Błąd pobierania błędów:", error);
        Alert.alert("Błąd", "Nie udało się pobrać pytań."); 
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchMistakes();
  }, [user, examData?.id]);

  // 2. OBSŁUGA OBRAZKÓW (Cache + GitHub)
  useEffect(() => {
    const currentQ = questions[currentIndex];
    
    if (currentQ?.media?.type === 'image') {
      const uri = currentQ.media.uri;
      const localFileName = currentQ.media.localFileName || uri.replace(/\//g, '_');
      const docDir = FileSystem.documentDirectory;

      if (docDir) {
        const localUri = `${docDir}${localFileName}`;
        FileSystem.getInfoAsync(localUri).then(info => {
          if (info.exists) {
            setActiveImageUri(localUri);
          } else {
            // Fallback do GitHuba
            const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
            setActiveImageUri(`${GITHUB_BASE}${cleanUri}`);
          }
        }).catch(() => {
           // W razie błędu FileSystem, też fallback
           const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
           setActiveImageUri(`${GITHUB_BASE}${cleanUri}`);
        });
      } else { 
        const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
        setActiveImageUri(`${GITHUB_BASE}${cleanUri}`); 
      }
    } else { 
      setActiveImageUri(null); 
    }
  }, [currentIndex, questions]);

  // 3. LOGIKA ODPOWIEDZI
  const handleAnswer = async (index: number) => {
    if (isAnswerChecked) return;
    
    setSelectedAnswer(index);
    setIsAnswerChecked(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correctAnswerIndex;
    const mistakeRef = doc(db, 'users', user!.uid, 'mistakes', currentQ.docId);

    if (isCorrect) {
      const newConsecutive = (currentQ.consecutiveCorrect || 0) + 1;
      // Jeśli użytkownik odpowiedział poprawnie 2 razy z rzędu -> usuwamy błąd
      if (newConsecutive >= 2) {
        setStatusMessage("✅ Świetnie! Błąd usunięty.");
        setStatusColor('#4CAF50');
        await deleteDoc(mistakeRef);
      } else {
        setStatusMessage("👍 Dobrze! Jeszcze raz i zniknie.");
        setStatusColor('#2196F3');
        await updateDoc(mistakeRef, { consecutiveCorrect: newConsecutive });
      }
    } else {
      setStatusMessage("❌ Błąd. Seria zresetowana.");
      setStatusColor('#F44336');
      await updateDoc(mistakeRef, { consecutiveCorrect: 0, mistakeCount: increment(1) });
    }
    
    // Automatyczne przejście dalej po 1.5s
    setTimeout(() => nextQuestion(), 1500);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null); 
      setIsAnswerChecked(false); 
      setStatusMessage(null);
    } else {
      Alert.alert(
        "Sesja zakończona!", 
        "Przerobiłeś wszystkie błędy z tej sesji.", 
        [{ text: "Super", onPress: () => navigation.goBack() }]
      );
    }
  };

  // 4. LOADING I EMPTY STATES
  if (loading) {
    return (
        <View style={[styles.center, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
        </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="trophy" size={100} color="#FFD700" />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Czysto!</Text>
        <Text style={[styles.emptyText, { color: theme.subText }]}>
            Nie masz błędów w kategorii {examData?.id?.toUpperCase() || 'tej kategorii'}.
        </Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Wróć do Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = questions[currentIndex];

  // 5. RENDEROWANIE GŁÓWNE
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* KARTA PYTANIA */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          
          <View style={styles.cardHeader}>
             <Text style={styles.questionCounter}>PYTANIE {currentIndex + 1} / {questions.length}</Text>
             
             {/* Odznaka serii poprawnych odpowiedzi */}
             <View style={styles.streakBadge}>
                <Ionicons name="flame" size={16} color="#FF5722" />
                <Text style={styles.streakText}>{currentQ.consecutiveCorrect || 0}/2</Text>
             </View>
          </View>

          <Text style={[styles.questionText, { color: theme.text }]}>{currentQ.text}</Text>
          
          {/* Obrazek */}
          {activeImageUri && (
            <Image 
                source={{ uri: activeImageUri }} 
                style={styles.image} 
                resizeMode="contain" 
            />
          )}
          
          {/* Wideo */}
          {currentQ.media?.type === 'video' && (
            <View style={{ marginTop: 15 }}>
              <QuestionVideo uri={GITHUB_BASE + currentQ.media.uri} />
            </View>
          )}
        </View>

        {/* ODPOWIEDZI */}
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

      {/* PASEK STATUSU NA DOLE */}
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
  
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingTop: 0,       // Brak odstępu od góry (wg Twojej prośby)
    paddingBottom: 100   // Dużo miejsca na dole, żeby status nie zasłaniał przycisków
  },
  
  card: { borderRadius: 16, padding: 20, marginBottom: 20, elevation: 3, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: {width: 0, height: 2} },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionCounter: { fontSize: 12, fontWeight: 'bold', color: '#9E9E9E', letterSpacing: 1 },
  
  streakBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFECB3', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  streakText: { fontSize: 12, fontWeight: 'bold', color: '#FF6F00', marginLeft: 4 },

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
  emptyText: { fontSize: 16, marginTop: 10, marginBottom: 30, textAlign: 'center' },
  backBtn: { paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  bottomStatus: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, alignItems: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  bottomStatusText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});