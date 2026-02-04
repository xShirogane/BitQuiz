import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { QUALIFICATIONS_DATA } from '../data/categories';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = QUALIFICATIONS_DATA.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wyszukiwarka</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color={theme.subText} style={{ marginRight: 10 }} />
        <TextInput 
          style={{ flex: 1, color: theme.text, fontSize: 16 }}
          placeholder="Wpisz np. INF.02..."
          placeholderTextColor={theme.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={true}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.subText} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList 
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.resultItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('ModeSelection', { examData: item })}
          >
            <View>
              <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.itemSub, { color: theme.subText }]}>{item.fullName}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: theme.subText, marginTop: 20 }}>
            Nie znaleziono egzaminów.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  resultItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: { fontSize: 18, fontWeight: 'bold' },
  itemSub: { fontSize: 12, marginTop: 4 },
});