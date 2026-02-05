import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, StatusBar, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { QUALIFICATIONS_DATA, Qualification } from '../data/categories'; 

export default function SearchScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<Qualification[]>([]);

  // Logika filtrowania i sortowania
  useEffect(() => {
    // 1. Pobierz wszystkie dane i posortuj alfabetycznie po kodzie (ID)
    const allDataSorted = [...QUALIFICATIONS_DATA].sort((a, b) => 
      a.id.localeCompare(b.id)
    );

    // 2. Jeśli brak zapytania -> pokaż wszystko
    if (searchQuery.trim() === '') {
      setFilteredData(allDataSorted);
    } else {
      // 3. Jeśli jest zapytanie -> filtruj
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = allDataSorted.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) || 
        item.fullName.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery)
      );
      setFilteredData(filtered);
    }
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  // Karta wyniku (Kafelek listy)
  const renderItem = ({ item }: { item: Qualification }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ModeSelection', { examData: item })}
      style={[styles.resultCard, { backgroundColor: theme.card }]}
    >
      {/* IKONA PRZYPISANA DO KWALIFIKACJI */}
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F2F5' }]}>
        <Ionicons 
          name={item.iconName || 'school-outline'} 
          size={24} 
          color={theme.primary} 
        />
      </View>
      
      <View style={styles.textContainer}>
        <View style={styles.codeBadge}>
           <Text style={[styles.codeText, { color: theme.primary }]}>{item.title}</Text>
        </View>
        <Text style={[styles.nameText, { color: theme.text }]} numberOfLines={1}>
          {item.fullName}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.subText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* NAGŁÓWEK */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wyszukiwarka</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* PASEK WYSZUKIWANIA */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.subText} style={styles.searchIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Szukaj kodu lub nazwy..."
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            // Usunąłem autoFocus, żeby klawiatura nie wyskakiwała agresywnie przy wejściu
            autoFocus={false} 
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ZAWARTOŚĆ */}
      <View style={styles.content}>
        
        {/* Stan: Brak wyników (Tylko gdy coś wpisano i nic nie znaleziono) */}
        {searchQuery !== '' && filteredData.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: theme.card }]}>
              <Ionicons name="search" size={40} color={theme.subText} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nie znaleziono</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
              Sprawdź literówki lub spróbuj wpisać inny kod.
            </Text>
          </View>
        ) : (
          /* Stan: Lista wyników (Wyświetla się ZAWSZE, gdy są dane) */
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              /* Opcjonalny nagłówek listy dla estetyki */
              <Text style={[styles.listHeader, { color: theme.subText }]}>
                {searchQuery === '' ? 'Wszystkie egzaminy' : `Wyniki wyszukiwania (${filteredData.length})`}
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60, 
    paddingBottom: 10,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  clearButton: { padding: 5 },

  // Content
  content: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  listHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Result Card (Kafelek)
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: { flex: 1 },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,122,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  codeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});