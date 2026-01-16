import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';

export default function StatisticsScreen({ route, navigation }: any) {
  // Odbieramy examId (opcjonalnie, jeśli wchodzimy z konkretnej karty)
  const { examId } = route.params || {}; 
  const { user, userProfile } = useAuth();
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const collectionRef = collection(db, 'users', user.uid, 'history');
        
        // Jeśli mamy examId, filtrujemy. Jeśli nie, pobieramy wszystko.
        let q;
        if (examId) {
            q = query(collectionRef, where('examId', '==', examId), orderBy('date', 'desc'));
        } else {
            q = query(collectionRef, orderBy('date', 'desc'));
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setHistory(data);
      } catch (error) {
        console.error("Błąd historii:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, examId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  if (!userProfile?.isPro) {
      // Zabezpieczenie na wypadek wejścia "na lewo", choć przycisk jest ukryty
      return (
          <View style={styles.center}>
              <Text>Widok dostępny tylko dla PRO.</Text>
          </View>
      )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {examId ? `Historia: ${examId.toUpperCase()}` : 'Pełna historia testów'}
      </Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.historyItem}
            // NOWOŚĆ: Po kliknięciu idziemy do podglądu
            onPress={() => {
                if (item.details) {
                    navigation.navigate('ExamReview', { 
                        questions: item.details.questions, 
                        userAnswers: item.details.userAnswers,
                        score: item.score,
                        total: item.total
                    });
                } else {
                    alert("Ten test jest stary i nie ma zapisanych szczegółów pytań.");
                }
            }}
          >
            <View>
              <Text style={styles.dateText}>
                {item.date?.toDate ? item.date.toDate().toLocaleDateString() + ' ' + item.date.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Data nieznana'}
              </Text>
              <Text style={styles.modeText}>
                Tryb: {item.mode === 'onelife' ? 'Nagła Śmierć' : 'Standard'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.scoreText, item.percentage >= 50 ? styles.green : styles.red]}>
                {item.percentage}%
              </Text>
              <Text style={styles.pointsText}>{item.score} / {item.total} pkt</Text>
              <Text style={styles.detailsHint}>Zobacz szczegóły &gt;</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Brak historii dla tego egzaminu.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  historyItem: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#333' },
  modeText: { fontSize: 12, color: '#888', marginTop: 4 },
  scoreText: { fontSize: 18, fontWeight: 'bold' },
  pointsText: { fontSize: 12, color: '#666' },
  detailsHint: { fontSize: 10, color: '#007AFF', marginTop: 4 },
  green: { color: '#4CAF50' },
  red: { color: '#F44336' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' },
});