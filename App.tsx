import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Konteksty
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Ekrany
import ExamScreen, { Question } from './src/screens/ExamScreen';
import ResultScreen from './src/screens/ResultScreen';
import QualificationScreen from './src/screens/QualificationScreen';
import ModeSelectionScreen from './src/screens/ModeSelectionScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import ProfileScreen from './src/screens/ProfileScreen'; // <--- Zostaje zaimportowany
import OneLifeScreen from './src/screens/OneLifeScreen';
import MultiplayerSetupScreen from './src/screens/MultiplayerSetupScreen';
import MultiplayerGameScreen from './src/screens/MultiplayerGameScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import ExamReviewScreen from './src/screens/ExamReviewScreen';
import MistakeReviewScreen from './src/screens/MistakeReviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ContactScreen from './src/screens/ContactScreen';
import SearchScreen from './src/screens/SearchScreen';
import ShopScreen from './src/screens/ShopScreen';
import NewsScreen from './src/screens/NewsScreen';
import SupportScreen from './src/screens/SupportScreen';
import Contact2Screen from './src/screens/ContactScreen2';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- NASZ PŁYWAJĄCY PASEK (Floating Pill) ---
function HomeTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // Brak tekstu
        
        tabBarStyle: {
          position: 'absolute',
          bottom: 40,
          marginHorizontal: 20,
          height: 40,
          paddingBottom: 0,
          paddingTop: 0,
          backgroundColor: theme.card,
          borderRadius: 30,
          borderTopWidth: 0,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        },
        
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.subText,
        
        tabBarItemStyle: {
           height: 60,
           justifyContent: 'center',
           alignItems: 'center',
        },

        tabBarIcon: ({ focused, color }) => {
          let iconName: any;
          const size = 26;

          // Zostawiamy tylko Home i Search
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={QualificationScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
      {/* USUNĘLIŚMY STĄD PROFIL */}
    </Tab.Navigator>
  );
}

// --- EKRAN SUMMARY (HomeScreen) ---
function HomeScreen({ route, navigation }: any) {
  const { examData, limit, time, title } = route.params;
  const { theme } = useTheme();

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

// --- GŁÓWNA NAWIGACJA ---
const AppContent = () => {
  const { theme, isDark } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <Stack.Navigator 
        initialRouteName="MainTabs" 
        screenOptions={{
           headerStyle: { backgroundColor: theme.card },
           headerTitleStyle: { fontWeight: 'bold', color: theme.text },
           headerTintColor: theme.primary,
           headerBackTitle: 'Wróć',
           contentStyle: { backgroundColor: theme.background }
        }}
      >
        {/* NASZ PASEK Z DOKOWANIEM */}
        <Stack.Screen name="MainTabs" component={HomeTabs} options={{ headerShown: false }} />
        
        {/* DODALIŚMY PROFIL TUTAJ, DO GŁÓWNEJ NAWIGACJI */}
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mój Profil' }} />

        {/* Pozostałe ekrany */}
        <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} options={{ title: 'Wybór trybu' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Exam" component={ExamScreen} options={{ title: 'Egzamin', headerBackVisible: false }} />
        <Stack.Screen name="Training" component={TrainingScreen} options={{ title: 'Trening' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Wynik', headerShown: false }} />
        <Stack.Screen name="OneLife" component={OneLifeScreen} options={{ 
          title: 'Nagła Śmierć 💀',
          headerStyle: { backgroundColor: '#1c1c1e' },
          headerTintColor: '#FF3B30', 
          headerTitleStyle: { color: '#fff' }
        }} />
        <Stack.Screen name="MultiplayerSetup" component={MultiplayerSetupScreen} options={{ title: 'Lobby 1vs1' }} />
        <Stack.Screen name="MultiplayerGame" component={MultiplayerGameScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Twoje Statystyki 📊' }} />
        <Stack.Screen name="ExamReview" component={ExamReviewScreen} options={{ title: 'Szczegóły testu', presentation: 'modal' }} />
        <Stack.Screen name="MistakeReview" component={MistakeReviewScreen} options={{ title: 'Trener Błędów' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ustawienia' }} />
        <Stack.Screen name="Contact" component={ContactScreen} options={{ title: 'Kontakt' }} />
        <Stack.Screen name="Sklep" component={ShopScreen} />
        <Stack.Screen name="Aktualności" component={NewsScreen} />
        <Stack.Screen name="Wsparcie❤️" component={SupportScreen} />
         <Stack.Screen name="Kontakt" component={Contact2Screen} />
         <Stack.Screen name="ExamReviewScreen" component={ExamReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
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