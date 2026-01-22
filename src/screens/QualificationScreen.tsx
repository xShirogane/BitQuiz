import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, StatusBar, TextInput 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SCHOOLS, QUALIFICATIONS_DATA } from '../data/categories';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { runBackgroundSync } from '../utils/offlineManager';
import QualificationStatsCard from '../components/QualificationStatsCard';

export default function QualificationScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState('all');
  
  // 1. NOWY STAN DLA WYSZUKIWARKI
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- AUTOMATYCZNA SYNCHRONIZACJA ---
  useEffect(() => {
    runBackgroundSync();
  }, []); 

  useEffect(() => {
    if (userProfile?.favoriteSchool) {
      setSelectedSchool(userProfile.favoriteSchool);
    }
  }, [userProfile]);

  const handleSelectSchool = async (schoolId: string) => {
    setSelectedSchool(schoolId);
    setSearchQuery(''); // Czyścimy szukanie przy zmianie zakładki
    if (user && userProfile?.favoriteSchool !== schoolId) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { favoriteSchool: schoolId });
      } catch (error) { console.error(error); }
    }
  };

  // 2. ZAKTUALIZOWANA LOGIKA FILTROWANIA (Szkoła + Wyszukiwarka)
  const filteredQualifications = QUALIFICATIONS_DATA.filter(q => {
    // Krok A: Sprawdź czy pasuje do szkoły (obsługa nowej tablicy schoolIds)
    const matchesSchool = selectedSchool === 'all' 
      ? true 
      : q.schoolIds.includes(selectedSchool);

    // Krok B: Sprawdź czy pasuje do wyszukiwania (jeśli wpisano tekst)
    const matchesSearch = searchQuery === '' 
      ? true 
      : (q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         q.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSchool && matchesSearch;
  });

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
    <View>
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

      {/* 3. POLE WYSZUKIWANIA - Widoczne tylko w zakładce 'Wszystkie' */}
      {selectedSchool === 'all' && (
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.searchInput}
              placeholder="Szukaj kwalifikacji (np. INF.03)..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
               <TouchableOpacity onPress={() => setSearchQuery('')}>
                 <Text style={styles.clearIcon}>✕</Text>
               </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderGeneralStats = () => {
    if (selectedSchool === 'all') return null;
    if (filteredQualifications.length === 0) return null;

    const schoolExamIds = filteredQualifications.map(q => q.id);
    const schoolName = SCHOOLS.find(s => s.id === selectedSchool)?.name || 'Twoje Postępy';

    return (
      <QualificationStatsCard 
          examIds={schoolExamIds}    
          title={`Postępy: ${schoolName}`} 
          schoolId={selectedSchool}  
      />
    );
  };

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
        
        ListHeaderComponent={renderGeneralStats()}
        
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
            <Text style={styles.emptyText}>
              {searchQuery ? 'Nie znaleziono takiej kwalifikacji.' : 'Brak kwalifikacji w tej kategorii.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

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
  
  // NOWE STYLE DLA WYSZUKIWARKI
  searchSection: { paddingHorizontal: 20, marginTop: 15 },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F2F5', 
    borderRadius: 12, paddingHorizontal: 15, height: 45 
  },
  searchIcon: { marginRight: 10, fontSize: 16 },
  searchInput: { flex: 1, color: '#333', fontSize: 15 },
  clearIcon: { fontSize: 16, color: '#999', padding: 5 },

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