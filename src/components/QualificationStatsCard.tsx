import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebase';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

interface Props {
  examId?: string;       
  examIds?: string[];    
  title?: string;        
  schoolId?: string;     
}

export default function QualificationStatsCard({ examId, examIds, title, schoolId }: Props) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, passed: 0 });
  const [streak, setStreak] = useState(0);

  const targetExamIds = examIds && examIds.length > 0 ? examIds : (examId ? [examId] : []);
  const displayTitle = title || (examId ? examId.toUpperCase() : 'STATYSTYKI');

  useEffect(() => {
    if (authLoading) return;
    if (!user || targetExamIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const historyRef = collection(db, 'users', user.uid, 'history');
        const q = query(
          historyRef, 
          where('examId', 'in', targetExamIds), 
          orderBy('date', 'desc'),
          limit(100) 
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map(doc => doc.data())
          .filter((item: any) => item.total === 40);

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
  }, [user, authLoading, JSON.stringify(targetExamIds), userProfile?.isPro]);

  if (!user) return null;

  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  const handlePress = () => {
    navigation.navigate('Statistics', { 
        examId: examId || targetExamIds[0], 
        title: displayTitle,
        schoolId: schoolId 
    });
  };

  if (userProfile?.isPro) {
    return (
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: theme.card }]}
        onPress={handlePress}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{displayTitle} 📊</Text>
          <Text style={[styles.seeMore, { color: theme.primary }]}>Szczegóły &gt;</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.statItem}>
            <Text style={[styles.value, { color: theme.text }]}>{stats.total}</Text>
            <Text style={[styles.label, { color: theme.subText }]}>Egzaminy</Text>
          </View>
          
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.value, { color: stats.avgScore >= 50 ? '#34C759' : theme.danger }]}>
              {stats.avgScore}%
            </Text>
            <Text style={[styles.label, { color: theme.subText }]}>Średnia</Text>
          </View>
          
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.value, { color: theme.text }]}>{stats.passed}</Text>
            <Text style={[styles.label, { color: theme.subText }]}>Zaliczone</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, styles.freeContainer, { backgroundColor: theme.card }]}
      onPress={handlePress}
    >
       <View style={styles.headerRowFree}>
          <Text style={[styles.headerTitleFree, { color: theme.subText }]}>{displayTitle}</Text>
      </View>
      <View style={styles.streakContent}>
        <Text style={styles.fireIcon}>🔥</Text>
        <View>
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={[styles.streakLabel, { color: theme.subText }]}>Twoja seria zaliczeń (Egzaminy)</Text>
        </View>
        <Text style={{ marginLeft: 'auto', color: theme.border, fontSize: 20 }}>&gt;</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, padding: 15, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  loadingContainer: { height: 80, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  seeMore: { fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  value: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 12, marginTop: 4 },
  separator: { width: 1, height: 30 },
  freeContainer: { borderLeftWidth: 4, borderLeftColor: '#FF9500' },
  headerRowFree: { marginBottom: 5 },
  headerTitleFree: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  streakContent: { flexDirection: 'row', alignItems: 'center' },
  fireIcon: { fontSize: 32, marginRight: 10 },
  streakValue: { fontSize: 24, fontWeight: 'bold', color: '#FF9500' },
  streakLabel: { fontSize: 12 },
});