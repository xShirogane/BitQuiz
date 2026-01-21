import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QUALIFICATIONS_DATA } from '../data/categories'; // Musimy zaimportować listę quizów

const GITHUB_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/xShirogane/BitQuiz-Assets/main/';

// Funkcja pomocnicza do pobierania pojedynczego zestawu obrazków (z poprzedniego kroku)
export const cacheImages = async (questions: any[]) => {
  // console.log('🔄 [Cache] Przetwarzam obrazki...');
  
  const updatedQuestions = await Promise.all(questions.map(async (q) => {
    // Jeśli to nie obrazek, pomijamy
    if (!q.media || q.media.type !== 'image') return q;

    try {
      // Zamieniamy ukośniki na podkreślniki, żeby stworzyć bezpieczną nazwę pliku
      const fileName = q.media.uri.replace(/\//g, '_');
      const localUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Sprawdzamy czy plik istnieje
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      
      // LOGIKA NAPRAWCZA:
      // Pobieramy tylko jeśli plik NIE istnieje LUB jeśli istnieje, ale jest pusty/za mały (np. < 100 bajtów)
      if (!fileInfo.exists || (fileInfo.exists && fileInfo.size < 100)) {
        // console.log(`⬇️ Pobieram/Naprawiam obrazek: ${fileName}`);
        
        // Jeśli plik istnieje ale jest zły, najpierw go usuńmy
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(localUri, { idempotent: true });
        }

        await FileSystem.downloadAsync(
          GITHUB_IMAGE_BASE_URL + q.media.uri,
          localUri
        );
      }

      return {
        ...q,
        media: {
          ...q.media,
          localFileName: fileName 
        }
      };
    } catch (e) {
      console.warn('⚠️ Błąd pobierania obrazka:', q.media.uri);
      // W razie błędu zwracamy pytanie bez localFileName - aplikacja spróbuje wczytać z sieci
      return q; 
    }
  }));

  return updatedQuestions;
};

// --- NOWOŚĆ: GŁÓWNA FUNKCJA SYNCHRONIZACJI ---
export const runBackgroundSync = async () => {
  console.log('🚀 [AutoSync] Rozpoczynam pobieranie całej zawartości w tle...');

  let downloadedCount = 0;

  // Lecimy pętlą po wszystkich dostępnych kwalifikacjach (INF.02, INF.03 itd.)
  for (const quizData of QUALIFICATIONS_DATA) {
    const cacheKey = `quiz_cache_${quizData.apiUrl}`;

    try {
      // 1. Sprawdzamy, czy już mamy to w cache (żeby nie pobierać w kółko tego samego przy każdym uruchomieniu)
      const existingData = await AsyncStorage.getItem(cacheKey);
      
      // Opcjonalnie: Możesz usunąć ten if, jeśli chcesz ZAWSZE aktualizować dane przy starcie (świeże pytania)
      // Ja zostawiam pobieranie zawsze, żeby aktualizować pytania, ale obrazki się nie dublują dzięki logice w cacheImages
      
      // 2. Pobieramy JSON (lekki tekst)
      const response = await fetch(quizData.apiUrl);
      if (!response.ok) continue; // Jak błąd, idź do następnego
      
      const rawQuestions = await response.json();

      // 3. Pobieramy obrazki (ciężka praca)
      const questionsWithImages = await cacheImages(rawQuestions);

      // 4. Zapisujemy gotowy pakiet do pamięci
      await AsyncStorage.setItem(cacheKey, JSON.stringify(questionsWithImages));
      
      downloadedCount++;
      // console.log(`✅ [AutoSync] Zapisano offline: ${quizData.title}`);

    } catch (error) {
      console.warn(`❌ [AutoSync] Błąd przy ${quizData.title}:`, error);
    }
  }

  console.log(`🏁 [AutoSync] Zakończono. Zaktualizowano ${downloadedCount} zestawów.`);
};