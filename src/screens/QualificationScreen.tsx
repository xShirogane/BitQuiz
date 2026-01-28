import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, StatusBar, TextInput 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- Theme
import { SCHOOLS, QUALIFICATIONS_DATA } from '../data/categories';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../config/firebase';
import { runBackgroundSync } from '../utils/offlineManager';
import QualificationStatsCard from '../components/QualificationStatsCard';

export default function QualificationScreen({ navigation }: any) {
  const { user, userProfile } = useAuth();
  const { theme, isDark } = useTheme(); // <--- Theme

  const [selectedSchool, setSelectedSchool] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => { runBackgroundSync(); }, []); 
  useEffect(() => { if (userProfile?.favoriteSchool) setSelectedSchool(userProfile.favoriteSchool); }, [userProfile]);

  const handleSelectSchool = async (schoolId: string) => {
    setSelectedSchool(schoolId);
    setSearchQuery(''); 
    if (user && userProfile?.favoriteSchool !== schoolId) {
      try { await updateDoc(doc(db, 'users', user.uid), { favoriteSchool: schoolId }); } catch (error) { console.error(error); }
    }
  };

  const filteredQualifications = QUALIFICATIONS_DATA.filter(q => {
    const matchesSchool = selectedSchool === 'all' ? true : q.schoolIds.includes(selectedSchool);
    const matchesSearch = searchQuery === '' ? true : (q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSchool && matchesSearch;
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={[styles.greetingText, { color: theme.text }]}>
          {user ? `Cześć, ${userProfile?.username || 'Uczniu'}! 👋` : 'Witaj w BitQuiz!'}
        </Text>
        <Text style={[styles.subGreetingText, { color: theme.subText }]}>
          Gotowy na naukę? Wybierz cel.
        </Text>
      </View>
      <TouchableOpacity style={[styles.profileButton, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={() => navigation.navigate('Profile')}>
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
                { backgroundColor: theme.background },
                selectedSchool === school.id && styles.categoryPillActive
              ]}
              onPress={() => handleSelectSchool(school.id)}
            >
              <Text style={styles.categoryIcon}>{school.icon}</Text>
              <Text style={[
                styles.categoryText, 
                { color: theme.text },
                selectedSchool === school.id && styles.categoryTextActive
              ]}>
                {school.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedSchool === 'all' && (
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: theme.background }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Szukaj kwalifikacji (np. INF.03)..."
              placeholderTextColor={theme.subText}
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
    return <QualificationStatsCard examIds={schoolExamIds} title={`Postępy: ${schoolName}`} schoolId={selectedSchool} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.card} />
      
      <View style={[styles.topSection, { backgroundColor: theme.card }]}>
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
            style={[styles.qualCard, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate('ModeSelection', { examData: { id: item.id, title: item.title, apiUrl: item.apiUrl } })}
          >
            <View style={[styles.qualIconContainer, { backgroundColor: theme.iconBg }]}>
              <Text style={[styles.qualIconText, { color: theme.primary }]}>{item.title.substring(0, 3)}</Text>
            </View>
            <View style={styles.qualInfo}>
              <Text style={[styles.qualTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.qualSubtitle, { color: theme.subText }]}>{item.fullName}</Text>
            </View>
            <Text style={[styles.arrow, { color: theme.border }]}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              {searchQuery ? 'Nie znaleziono takiej kwalifikacji.' : 'Brak kwalifikacji w tej kategorii.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 20, elevation: 4, zIndex: 10 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, marginBottom: 20 },
  greetingText: { fontSize: 22, fontWeight: 'bold' },
  subGreetingText: { fontSize: 14, marginTop: 4 },
  profileButton: { padding: 10, borderRadius: 50, borderWidth: 1 },
  profileIcon: { fontSize: 20 },
  categoryContainer: { height: 50 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  categoryPillActive: { backgroundColor: '#007AFF' },
  categoryIcon: { marginRight: 8 },
  categoryText: { fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  searchSection: { paddingHorizontal: 20, marginTop: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 15, height: 45 },
  searchIcon: { marginRight: 10, fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  clearIcon: { fontSize: 16, color: '#999', padding: 5 },
  listContent: { padding: 20, paddingTop: 30 },
  qualCard: { borderRadius: 16, padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  qualIconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  qualIconText: { fontWeight: 'bold', fontSize: 12 },
  qualInfo: { flex: 1 },
  qualTitle: { fontSize: 18, fontWeight: 'bold' },
  qualSubtitle: { fontSize: 13, marginTop: 2 },
  arrow: { fontSize: 20, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontStyle: 'italic' }
});