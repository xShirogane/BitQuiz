import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// --- IMPORTY EKRANÓW ---
import ExamScreen, { Question } from './src/screens/ExamScreen';
import ResultScreen from './src/screens/ResultScreen';
import QualificationScreen from './src/screens/QualificationScreen';
import ModeSelectionScreen from './src/screens/ModeSelectionScreen';
import TrainingScreen from './src/screens/TrainingScreen';

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
  // ZMIANA TUTAJ: Dodajemy parametr 'time'
  Exam: { apiUrl: string, limit: number, time: number }; 
  Training: { apiUrl: string }; 
  Result: { score: number; total: number; questions: Question[]; userAnswers: (number | null)[]; };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// --- EKRAN HOME ---
function HomeScreen({ route, navigation }: any) {
  const { examData, limit, time, title } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>{examData.id.toUpperCase()}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{examData.title}</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>⏱ {time} minut</Text>
        <Text style={styles.infoText}>📝 {limit} pytań</Text>
      </View>

      <TouchableOpacity 
        style={styles.startButton} 
        // ZMIANA TUTAJ: Przekazujemy 'time' dalej do egzaminu!
        onPress={() => navigation.navigate('Exam', { 
          apiUrl: examData.apiUrl, 
          limit: limit, 
          time: time 
        })} 
      >
        <Text style={styles.startButtonText}>ROZPOCZNIJ TEST</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Wróć do wyboru trybu</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- GŁÓWNY KOMPONENT ---
export default function App() {
  useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Qualifications">
        <Stack.Screen name="Qualifications" component={QualificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} options={{ title: 'Wybór trybu', headerBackTitle: 'Wróć' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Exam" component={ExamScreen} options={{ title: 'Egzamin', headerBackVisible: false }} />
        <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'Trening' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Wynik', headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 20 },
  logo: { fontSize: 40, fontWeight: '900', color: '#007AFF', marginBottom: 5 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
  infoBox: { flexDirection: 'row', marginBottom: 50, gap: 20, backgroundColor: '#F5F7FA', padding: 15, borderRadius: 12 },
  infoText: { fontSize: 16, fontWeight: '600', color: '#444' },
  startButton: { backgroundColor: '#007AFF', paddingVertical: 16, paddingHorizontal: 60, borderRadius: 12, elevation: 3, marginBottom: 20, width: '100%', alignItems: 'center' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  backButton: { padding: 10 },
  backButtonText: { color: '#888', fontSize: 14 }
});