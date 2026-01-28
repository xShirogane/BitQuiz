import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUALIFICATIONS_DATA } from '../data/categories';

const screenWidth = Dimensions.get('window').width;

export default function StatisticsScreen({ route, navigation }: any) {
  const { examId: initialExamId, title, schoolId } = route.params || {};
  const { user, userProfile } = useAuth();
  const { theme } = useTheme();
  
  const [currentExamId, setCurrentExamId] = useState(initialExamId);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  const availableExams = schoolId 
    // @ts-ignore
    ? QUALIFICATIONS_DATA.filter(q => q.schoolIds.includes(schoolId))
    : [];

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const activeExamId = currentExamId; 
        let totalQ = 0;
        
        // 1. Pobieranie puli pytań
        if (activeExamId) {
          const examInfo = QUALIFICATIONS_DATA.find(q => q.id === activeExamId);
          if (examInfo) {
            const cacheKey = `quiz_cache_${examInfo.apiUrl}`;
            const cachedData = await AsyncStorage.getItem(cacheKey);
            if (cachedData) {
              const parsed = JSON.parse(cachedData);
              totalQ = parsed.length;
            } else {
              try {
                const res = await fetch(examInfo.apiUrl);
                const json = await res.json();
                totalQ = json.length;
              } catch (e) { console.log(e); }
            }
          }
        }
        setTotalQuestionsCount(totalQ);

        // 2. Historia
        const collectionRef = collection(db, 'users', user.uid, 'history');
        let qRef = activeExamId 
            ? query(collectionRef, where('examId', '==', activeExamId), orderBy('date', 'desc')) 
            : query(collectionRef, orderBy('date', 'desc'));

        const querySnapshot = await getDocs(qRef);
        const data = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as any))
            .filter(item => item.total === 40);

        setHistory(data);

        // 3. Wykres
        if (totalQ > 0) {
          const correctSet = new Set<number>();
          const wrongSet = new Set<number>();

          data.forEach((test: any) => {
            if (test.details?.questions && test.details?.userAnswers) {
              test.details.questions.forEach((qObj: any, idx: number) => {
                const userAns = test.details.userAnswers[idx];
                const qId = qObj.id; 
                if (qId !== undefined) {
                    if (userAns === qObj.correctAnswerIndex) {
                        correctSet.add(qId);
                        if (wrongSet.has(qId)) wrongSet.delete(qId);
                    } else {
                        if (!correctSet.has(qId)) wrongSet.add(qId);
                    }
                }
              });
            }
          });

          const knownCount = correctSet.size;
          const wrongCount = wrongSet.size;
          const unseenCount = Math.max(0, totalQ - knownCount - wrongCount);

          setChartData([
            { name: 'Znane', population: knownCount, color: '#4CAF50', legendFontColor: theme.text, legendFontSize: 12 },
            { name: 'Błędne', population: wrongCount, color: '#F44336', legendFontColor: theme.text, legendFontSize: 12 },
            { name: 'Do odkrycia', population: unseenCount, color: theme.border, legendFontColor: theme.text, legendFontSize: 12 },
          ]);
        } else { setChartData([]); }
      } catch (error) { console.error("Błąd statystyk:", error); } finally { setLoading(false); }
    };
    fetchData();
  }, [user, currentExamId]); 

  const renderExamSelector = () => {
    if (!schoolId || availableExams.length <= 1) {
      return (
        <Text style={[styles.header, { color: theme.text }]}>
          {currentExamId ? `Postępy: ${currentExamId.toUpperCase()}` : 'Statystyki'}
        </Text>
      );
    }
    return (
      <View style={{ height: 50, marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorContainer}>
          {availableExams.map((exam) => (
            <TouchableOpacity 
              key={exam.id}
              style={[
                styles.selectorPill, 
                { backgroundColor: theme.card, borderColor: theme.border },
                currentExamId === exam.id && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setCurrentExamId(exam.id)}
            >
              <Text style={[
                styles.selectorText, 
                { color: theme.text },
                currentExamId === exam.id && styles.selectorTextActive
              ]}>{exam.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading && !history.length) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  if (!userProfile?.isPro) return <View style={[styles.center, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>Widok dostępny tylko dla PRO.</Text></View>;

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: theme.card,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
    strokeWidth: 2, 
    barPercentage: 0.5,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderExamSelector()}

      {/* POPRAWIONY WARUNEK RENDEROWANIA WYKRESU */}
      {(chartData.length > 0 && totalQuestionsCount > 0) ? (
        <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <View style={styles.chartWrapper}>
                <PieChart
                    data={chartData} width={screenWidth} height={220} chartConfig={chartConfig}
                    accessor={"population"} backgroundColor={"transparent"} paddingLeft={"0"}
                    center={[screenWidth / 4, 0]} hasLegend={false} absolute
                />
                <View style={[styles.donutHole, { backgroundColor: theme.card }]}>
                    <Text style={[styles.donutTextVal, { color: theme.text }]}>{totalQuestionsCount}</Text>
                    <Text style={[styles.donutTextLabel, { color: theme.subText }]}>Pytań</Text>
                </View>
            </View>
            <View style={styles.legendContainer}>
                {chartData.map((item, index) => (
                    <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>
                            {item.name}: <Text style={{fontWeight: 'bold'}}>{item.population}</Text>
                        </Text>
                    </View>
                ))}
            </View>
        </View>
      ) : (
          !loading ? <Text style={{textAlign: 'center', margin: 20, color: theme.subText}}>Brak danych.</Text> : null
      )}

      <Text style={[styles.subHeader, { color: theme.subText }]}>Historia egzaminów ({currentExamId?.toUpperCase()})</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.historyItem, { backgroundColor: theme.card }]}
            onPress={() => {
                if (item.details) {
                    navigation.navigate('ExamReview', { questions: item.details.questions, userAnswers: item.details.userAnswers, score: item.score, total: item.total });
                } else { alert("Brak szczegółów."); }
            }}
          >
            <View>
              <Text style={[styles.dateText, { color: theme.text }]}>{item.date?.toDate ? item.date.toDate().toLocaleDateString() : 'Data nieznana'}</Text>
              <Text style={[styles.modeText, { color: theme.subText }]}>Egzamin Zawodowy (40 pytań)</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.scoreText, item.percentage >= 50 ? styles.green : styles.red]}>{item.percentage}%</Text>
              <Text style={[styles.pointsText, { color: theme.subText }]}>{item.score} / {item.total}</Text>
              <Text style={[styles.detailsHint, { color: theme.primary }]}>Szczegóły &gt;</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.subText }]}>Brak historii.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  selectorContainer: { alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  selectorPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  selectorText: { fontWeight: '600' },
  selectorTextActive: { color: '#fff' },
  chartCard: { borderRadius: 16, paddingVertical: 20, marginBottom: 20, elevation: 2, alignItems: 'center' },
  chartWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%', height: 220, position: 'relative' },
  donutHole: { position: 'absolute', width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', top: '50%', left: '50%', marginTop: -50, marginLeft: -50, elevation: 4 },
  donutTextVal: { fontSize: 24, fontWeight: 'bold' },
  donutTextLabel: { fontSize: 12 },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 15, marginTop: 10, width: '100%', paddingHorizontal: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 14 },
  historyItem: { padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  dateText: { fontSize: 14, fontWeight: '600' },
  modeText: { fontSize: 12, marginTop: 4 },
  scoreText: { fontSize: 18, fontWeight: 'bold' },
  pointsText: { fontSize: 12 },
  detailsHint: { fontSize: 10, marginTop: 4 },
  green: { color: '#4CAF50' },
  red: { color: '#F44336' },
  emptyText: { textAlign: 'center', marginTop: 50 },
});