import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, StatusBar 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SCHOOLS, QUALIFICATIONS_DATA } from '../data/categories';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';

// IMPORTY DO SYNC
import { runBackgroundSync } from '../utils/offlineManager'; // <--- DODAJ TO

export default function QualificationScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState('all');

  // --- AUTOMATYCZNA SYNCHRONIZACJA ---
  useEffect(() => {
    // Odpalamy "Fire & Forget" - nie czekamy na wynik (brak await), niech się robi w tle
    runBackgroundSync();
  }, []); // Pusta tablica = uruchom tylko raz przy wejściu do aplikacji
  // -----------------------------------

  useEffect(() => {
    if (userProfile?.favoriteSchool) {
      setSelectedSchool(userProfile.favoriteSchool);
    }
  }, [userProfile]);

  const handleSelectSchool = async (schoolId: string) => {
    setSelectedSchool(schoolId);
    if (user && userProfile?.favoriteSchool !== schoolId) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { favoriteSchool: schoolId });
      } catch (error) { console.error(error); }
    }
  };

  const filteredQualifications = selectedSchool === 'all' 
    ? QUALIFICATIONS_DATA 
    : QUALIFICATIONS_DATA.filter(q => q.schoolId === selectedSchool);

  // --- UI ---
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.greetingText}>
          {user ? `Cześć, ${userProfile?.username || 'Uczniu'}! 👋` : 'Witaj w BitQuiz!'}
        </Text>
        <Text style={styles.subGreetingText}>
          Gotowy na naukę? Wybierz cel.
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.profileIcon}>👤</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {SCHOOLS.map((school) => (
          <TouchableOpacity 
            key={school.id} 
            style={[
              styles.categoryPill, 
              selectedSchool === school.id && styles.categoryPillActive
            ]}
            onPress={() => handleSelectSchool(school.id)}
          >
            <Text style={styles.categoryIcon}>{school.icon}</Text>
            <Text style={[
              styles.categoryText, 
              selectedSchool === school.id && styles.categoryTextActive
            ]}>
              {school.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      
      <View style={styles.topSection}>
        {renderHeader()}
        {renderCategories()}
      </View>

      <FlatList
        data={filteredQualifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.qualCard}
            onPress={() => navigation.navigate('ModeSelection', { 
              examData: { id: item.id, title: item.title, apiUrl: item.apiUrl } 
            })}
          >
            <View style={styles.qualIconContainer}>
              <Text style={styles.qualIconText}>{item.title.substring(0, 3)}</Text>
            </View>
            <View style={styles.qualInfo}>
              <Text style={styles.qualTitle}>{item.title}</Text>
              <Text style={styles.qualSubtitle}>{item.fullName}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak kwalifikacji w tej kategorii.</Text>
          </View>
        }
      />
    </View>
  );
}

// STYLE bez zmian (możesz zostawić te co były)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  topSection: { backgroundColor: '#fff', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, zIndex: 10 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 },
  greetingText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subGreetingText: { fontSize: 14, color: '#888', marginTop: 4 },
  profileButton: { backgroundColor: '#F0F2F5', padding: 10, borderRadius: 50, borderWidth: 1, borderColor: '#E1E4E8' },
  profileIcon: { fontSize: 20 },
  categoryContainer: { height: 50 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  categoryPillActive: { backgroundColor: '#007AFF' },
  categoryIcon: { marginRight: 8 },
  categoryText: { color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  listContent: { padding: 20, paddingTop: 30 },
  qualCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  qualIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  qualIconText: { color: '#007AFF', fontWeight: 'bold', fontSize: 12 },
  qualInfo: { flex: 1 },
  qualTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  qualSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  arrow: { fontSize: 20, color: '#CCC', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', fontStyle: 'italic' }
});