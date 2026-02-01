import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Konteksty
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext'; // <--- Nowy import

// Ekrany
import ExamScreen, { Question } from './src/screens/ExamScreen';
import ResultScreen from './src/screens/ResultScreen';
import QualificationScreen from './src/screens/QualificationScreen';
import ModeSelectionScreen from './src/screens/ModeSelectionScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OneLifeScreen from './src/screens/OneLifeScreen';
import MultiplayerSetupScreen from './src/screens/MultiplayerSetupScreen';
import MultiplayerGameScreen from './src/screens/MultiplayerGameScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import ExamReviewScreen from './src/screens/ExamReviewScreen';
import MistakeReviewScreen from './src/screens/MistakeReviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ContactScreen from './src/screens/ContactScreen';
import QuickReviewScreen from './src/screens/QuickReviewScreen';


SplashScreen.preventAutoHideAsync();

// --- TYPY NAWIGACJI ---
export type RootStackParamList = {
  Qualifications: undefined; 
  ModeSelection: { examData: { id: string, title: string, apiUrl: string } };
  Home: { 
    examData: { id: string, title: string, apiUrl: string },
    mode: 'exam' | 'short',
    limit: number,
    time: number,
    title: string 
  }; 
  Exam: { apiUrl: string, limit: number, time: number, examData: { id: string } }; 
  Training: { apiUrl: string }; 
  Result: { 
    score: number; 
    total: number; 
    questions: Question[]; 
    userAnswers: (number | null)[]; 
    mode?: 'exam' | 'training' | 'onelife';
    examId?: string;
  };
  Profile: undefined;
  OneLife: { apiUrl: string, examId: string };
  MultiplayerSetup: { examData: any };
  MultiplayerGame: { roomCode: string, isHost: boolean, playerId: string };
  Statistics: { examId?: string, title?: string }; 
  ExamReview: { questions: any[], userAnswers: any[], score: number, total: number }; 
  MistakeReview: undefined;
  QuickReview: undefined
  Settings: undefined;
  Contact: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- EKRAN HOME (Podsumowanie przed startem) ---
// Zaktualizowany o obsługę motywów
function HomeScreen({ route, navigation }: any) {
  const { examData, limit, time, title } = route.params;
  const { theme } = useTheme(); // Pobieramy kolory

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.logo, { color: theme.primary }]}>{examData.id.toUpperCase()}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.subText }]}>{examData.title}</Text>
      
      <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
        <Text style={[styles.infoText, { color: theme.text }]}>⏱ {time} minut</Text>
        <Text style={[styles.infoText, { color: theme.text }]}>📝 {limit} pytań</Text>
      </View>

      <TouchableOpacity 
        style={[styles.startButton, { backgroundColor: theme.primary }]} 
        onPress={() => navigation.navigate('Exam', { 
          apiUrl: examData.apiUrl, 
          limit: limit, 
          time: time,
          examData: examData
        })} 
      >
        <Text style={styles.startButtonText}>ROZPOCZNIJ TEST</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backButtonText, { color: theme.subText }]}>Wróć do wyboru trybu</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- KOMPONENT ZAWIERAJĄCY NAWIGACJĘ ---
// Wydzielony, aby mógł korzystać z useTheme()
const AppContent = () => {
  const { theme, isDark } = useTheme();

  return (
    <NavigationContainer>
      {/* Dynamiczny StatusBar: biały tekst na ciemnym tle, czarny na jasnym */}
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <Stack.Navigator 
        initialRouteName="Qualifications"
        screenOptions={{
           // Tło nagłówka (belki)
           headerStyle: { backgroundColor: theme.card },
           // Kolor tytułu na belce
           headerTitleStyle: { fontWeight: 'bold', color: theme.text },
           // Kolor przycisku "Wróć"
           headerTintColor: theme.primary,
           headerBackTitle: 'Wróć',
           // Tło całego ekranu (domyślne dla wszystkich ekranów)
           contentStyle: { backgroundColor: theme.background }
        }}
      >
        <Stack.Screen name="Qualifications" component={QualificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mój Profil' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ustawienia' }} />
        <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} options={{ title: 'Wybór trybu' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Exam" component={ExamScreen} options={{ title: 'Egzamin', headerBackVisible: false }} />
        <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'Trening' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Wynik', headerShown: false }} />
        <Stack.Screen name="OneLife" component={OneLifeScreen} options={{ 
          title: 'Nagła Śmierć 💀',
          headerStyle: { backgroundColor: '#1c1c1e' }, // OneLife ma swój unikalny styl
          headerTintColor: '#FF3B30', 
          headerTitleStyle: { color: '#fff' }
        }} />
        <Stack.Screen name="MultiplayerSetup" component={MultiplayerSetupScreen} options={{ title: 'Lobby 1vs1' }} />
        <Stack.Screen name="MultiplayerGame" component={MultiplayerGameScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Twoje Statystyki 📊' }} />
        <Stack.Screen name="ExamReview" component={ExamReviewScreen} options={{ title: 'Szczegóły testu', presentation: 'modal' }} />
        <Stack.Screen name="MistakeReview" component={MistakeReviewScreen} options={{ title: 'Trener Błędów' }} />
        <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Kontakt' }} />
        <Stack.Screen name="QuickReview" component={QuickReviewScreen} options={{ title: 'Szybka Powtórka ⚡' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// --- GŁÓWNY KOMPONENT APP ---
export default function App() {
  useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        {/* Przenosimy logikę nawigacji do komponentu podrzędnego */}
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logo: { fontSize: 40, fontWeight: '900', marginBottom: 5 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  subtitle: { fontSize: 14, marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
  infoBox: { flexDirection: 'row', marginBottom: 50, gap: 20, padding: 15, borderRadius: 12 },
  infoText: { fontSize: 16, fontWeight: '600' },
  startButton: { paddingVertical: 16, paddingHorizontal: 60, borderRadius: 12, elevation: 3, marginBottom: 20, width: '100%', alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  backButton: { padding: 10 },
  backButtonText: { fontSize: 14 }
});