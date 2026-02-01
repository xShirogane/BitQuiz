import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // <--- Importujemy motyw
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

export default function ContactScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme, isDark } = useTheme(); // <--- Używamy hooka
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [attachment, setAttachment] = useState<any>(null);
  const [sending, setSending] = useState(false);

  // --- WYBIERANIE PLIKU ---
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Wszystkie typy plików
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        setAttachment(result.assets[0]);
      }
    } catch (err) {
      console.log('Anulowano wybór pliku', err);
    }
  };

  // --- WYSYŁANIE ZGŁOSZENIA ---
  const handleSend = async () => {
    if (!subject || !message || !contactEmail) {
      Alert.alert('Błąd', 'Wypełnij temat, treść i email kontaktowy.');
      return;
    }

    setSending(true);

    try {
      let attachmentUrl = null;

      // 1. Jeśli jest plik, wyślij go do Storage
      if (attachment) {
        const response = await fetch(attachment.uri);
        const blob = await response.blob();
        
        const filename = attachment.name || `file_${new Date().getTime()}`;
        const storageRef = ref(storage, `contact_attachments/${user?.uid || 'guest'}/${filename}`);
        
        await uploadBytes(storageRef, blob);
        attachmentUrl = await getDownloadURL(storageRef);
      }

      // 2. Zapisz zgłoszenie w Firestore
      await addDoc(collection(db, 'contact_messages'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        contactEmail: contactEmail,
        subject: subject,
        message: message,
        attachmentUrl: attachmentUrl,
        attachmentName: attachment?.name || null,
        status: 'new',
        createdAt: serverTimestamp(),
        deviceInfo: Platform.OS
      });

      Alert.alert('Sukces', 'Zgłoszenie zostało wysłane! Odpowiemy najszybciej jak to możliwe.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Błąd wysyłania', error.message);
    } finally {
      setSending(false);
    }
  };

  // Style dynamiczne dla Inputów, aby uniknąć powtórzeń w JSX
  const inputStyle = [
    styles.input, 
    { 
      backgroundColor: theme.card, 
      color: theme.text, 
      borderColor: theme.border 
    }
  ];

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Formularz kontaktowy</Text>
      <Text style={[styles.subHeader, { color: theme.subText }]}>Masz problem lub sugestię? Napisz do nas.</Text>

      {/* Email kontaktowy */}
      <Text style={[styles.label, { color: theme.text }]}>Twój Email do kontaktu</Text>
      <TextInput
        style={inputStyle}
        value={contactEmail}
        onChangeText={setContactEmail}
        placeholder="np. jan@kowalski.pl"
        placeholderTextColor={theme.subText}
        keyboardType="email-address"
        autoCapitalize="none"
        keyboardAppearance={isDark ? 'dark' : 'light'}
      />

      {/* Temat */}
      <Text style={[styles.label, { color: theme.text }]}>Temat</Text>
      <TextInput
        style={inputStyle}
        value={subject}
        onChangeText={setSubject}
        placeholder="Czego dotyczy zgłoszenie?"
        placeholderTextColor={theme.subText}
        keyboardAppearance={isDark ? 'dark' : 'light'}
      />

      {/* Treść */}
      <Text style={[styles.label, { color: theme.text }]}>Treść wiadomości</Text>
      <TextInput
        style={[inputStyle, styles.textArea]}
        value={message}
        onChangeText={setMessage}
        placeholder="Opisz szczegółowo sprawę..."
        placeholderTextColor={theme.subText}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        keyboardAppearance={isDark ? 'dark' : 'light'}
      />

      {/* Załącznik */}
      <Text style={[styles.label, { color: theme.text }]}>Załącznik (opcjonalne)</Text>
      <TouchableOpacity 
        style={[
          styles.attachButton, 
          { 
            backgroundColor: isDark ? '#1A1A1A' : '#E8EAF6', 
            borderColor: isDark ? '#444' : '#9FA8DA' 
          }
        ]} 
        onPress={handlePickDocument}
      >
        <Ionicons name={attachment ? "document-attach" : "attach"} size={24} color={theme.primary} />
        <Text style={[styles.attachText, { color: theme.primary }]}>
          {attachment ? attachment.name : "Dodaj zrzut ekranu lub plik"}
        </Text>
        {attachment && (
            <TouchableOpacity onPress={() => setAttachment(null)} style={{marginLeft: 10}}>
                <Ionicons name="close-circle" size={20} color={theme.danger} />
            </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Przycisk Wyślij */}
      <TouchableOpacity 
        style={[styles.sendButton, { backgroundColor: theme.primary }, sending && styles.buttonDisabled]} 
        onPress={handleSend}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.sendButtonText}>WYŚLIJ ZGŁOSZENIE</Text>
          </>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subHeader: { fontSize: 16, marginBottom: 25 },
  
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: { padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, fontSize: 16 },
  textArea: { height: 120, paddingTop: 12 }, // paddingTop poprawia wygląd tekstu w multiline na Androidzie
  
  attachButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 30, borderStyle: 'dashed', borderWidth: 1 },
  attachText: { marginLeft: 10, fontWeight: '500', flex: 1 },

  sendButton: { flexDirection: 'row', padding: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
}); 