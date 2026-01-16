import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

interface Props {
  examId: string;
}

export default function QualificationStatsCard({ examId }: Props) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, passed: 0 });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // 1. Jeśli trwa ładowanie auth, czekamy
    if (authLoading) return;

    // 2. Jeśli nie ma użytkownika, kończymy ładowanie i nic nie robimy
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const historyRef = collection(db, 'users', user.uid, 'history');
        const q = query(
          historyRef, 
          where('examId', '==', examId), 
          orderBy('date', 'desc'),
          limit(50) 
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data());

        if (userProfile?.isPro) {
          let sumPercent = 0;
          let passedCount = 0;
          data.forEach(item => {
            const pct = item.percentage || 0;
            sumPercent += pct;
            if (pct >= 50) passedCount++;
          });

          setStats({
            total: data.length,
            avgScore: data.length > 0 ? Math.round(sumPercent / data.length) : 0,
            passed: passedCount
          });
        } else {
          let currentStreak = 0;
          for (const item of data) {
            if ((item.percentage || 0) >= 50) currentStreak++;
            else break; 
          }
          setStreak(currentStreak);
        }
      } catch (error) {
        console.error("Błąd statystyk:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, authLoading, examId, userProfile?.isPro]);

  // --- BRAK UŻYTKOWNIKA (Nic nie wyświetlamy lub zachętę do logowania, ale bez spinnera) ---
  if (!user) {
    return null; // Lub pusty View, jeśli wolisz
  }

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  // --- WIDOK DLA PRO (Klikalny -> Historia) ---
  if (userProfile?.isPro) {
    return (
      <TouchableOpacity 
        style={styles.container}
        onPress={() => navigation.navigate('Statistics', { examId, title: examId.toUpperCase() })}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Twoje Statystyki 📊</Text>
          <Text style={styles.seeMore}>Zobacz historię &gt;</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.statItem}>
            <Text style={styles.value}>{stats.total}</Text>
            <Text style={styles.label}>Testy</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: '#ddd' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.value, { color: stats.avgScore >= 50 ? '#34C759' : '#FF3B30' }]}>
              {stats.avgScore}%
            </Text>
            <Text style={styles.label}>Średnia</Text>
          </View>
          <View style={[styles.separator, { backgroundColor: '#ddd' }]} />
          <View style={styles.statItem}>
            <Text style={styles.value}>{stats.passed}</Text>
            <Text style={styles.label}>Zaliczone</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // --- WIDOK DLA FREE (Tylko seria, bez tekstu o kupnie) ---
  return (
    <View style={[styles.container, styles.freeContainer]}>
      <View style={styles.streakContent}>
        <Text style={styles.fireIcon}>🔥</Text>
        <View>
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={styles.streakLabel}>Seria zaliczeń z rzędu</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  loadingContainer: { height: 80, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  headerTitle: { fontWeight: 'bold', color: '#333' },
  seeMore: { color: '#007AFF', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  value: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  label: { fontSize: 12, color: '#666', marginTop: 4 },
  separator: { width: 1, height: 30 },
  freeContainer: { borderLeftWidth: 4, borderLeftColor: '#FF9500' },
  streakContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  fireIcon: { fontSize: 32, marginRight: 10 },
  streakValue: { fontSize: 24, fontWeight: 'bold', color: '#FF9500' },
  streakLabel: { fontSize: 12, color: '#666' },
});