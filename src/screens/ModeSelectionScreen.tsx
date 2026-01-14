import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ModeSelectionScreen({ route, navigation }: any) {
  const { examData } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wybierz tryb nauki</Text>
      <Text style={styles.subtitle}>{examData.id.toUpperCase()}</Text>

      {/* 1. PEŁNY EGZAMIN */}
      <TouchableOpacity 
        style={[styles.card, styles.cardBlue]}
        onPress={() => navigation.navigate('Home', { 
          examData, 
          mode: 'exam',
          limit: 40, 
          time: 60,
          title: 'Egzamin Zawodowy'
        })}
      >
        <Text style={styles.cardTitle}>🎓 Egzamin Zawodowy</Text>
        <Text style={styles.cardDesc}>40 pytań • 60 minut • Wynik na końcu</Text>
      </TouchableOpacity>

      {/* 2. TEST SKRÓCONY */}
      <TouchableOpacity 
        style={[styles.card, styles.cardOrange]}
        onPress={() => navigation.navigate('Home', { 
          examData, 
          mode: 'short',
          limit: 20, 
          time: 30,
          title: 'Szybka Powtórka'
        })}
      >
        <Text style={styles.cardTitle}>⚡ Test Skrócony</Text>
        <Text style={styles.cardDesc}>20 pytań • 30 minut • Wynik na końcu</Text>
      </TouchableOpacity>

      {/* 3. TRYB NAUKI (TRENING) */}
      <TouchableOpacity 
        style={[styles.card, styles.cardGreen]}
        onPress={() => navigation.navigate('Training', { 
          apiUrl: examData.apiUrl 
        })}
      >
        <Text style={styles.cardTitle}>🧠 Tryb Nauki</Text>
        <Text style={styles.cardDesc}>Po jednym pytaniu • Natychmiastowe odpowiedzi</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F5F7FA' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#333' },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 40, color: '#666', fontWeight: '600' },
  card: { padding: 25, borderRadius: 16, marginBottom: 20, elevation: 4, shadowOpacity: 0.1, shadowRadius: 4 },
  cardBlue: { backgroundColor: '#fff', borderLeftWidth: 6, borderLeftColor: '#007AFF' },
  cardOrange: { backgroundColor: '#fff', borderLeftWidth: 6, borderLeftColor: '#FF9500' },
  cardGreen: { backgroundColor: '#fff', borderLeftWidth: 6, borderLeftColor: '#34C759' },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  cardDesc: { fontSize: 14, color: '#666' },
});