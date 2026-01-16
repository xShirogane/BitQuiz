import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; // Dodajemy onSnapshot do śledzenia zmian w bazie
import { auth, db } from '../config/firebase'; // Musimy zaimportować też db
import { View, ActivityIndicator } from 'react-native';

// Definiujemy kształt danych naszego użytkownika w bazie
export interface UserProfile {
  username: string;
  email: string;
  isPro: boolean;
  createdAt?: any;
  favoriteSchool?: string;
}

interface AuthContextProps {
  user: User | null;         // Obiekt techniczny Firebase (uid, email, tokeny)
  userProfile: UserProfile | null; // Nasze dane z bazy (nick, status PRO)
  loading: boolean;
  isAdmin: boolean;          // Opcjonalnie na przyszłość
}

const AuthContext = createContext<AuthContextProps>({ 
  user: null, 
  userProfile: null, 
  loading: true,
  isAdmin: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Nasłuchuj stanu autoryzacji (czy zalogowany)
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        // 2. Jeśli zalogowany, nasłuchuj zmian w jego dokumencie w bazie 'users'
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            console.log("Brak dokumentu użytkownika w bazie!");
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Błąd pobierania profilu:", error);
          setLoading(false);
        });

        // Musimy pamiętać, żeby odłączyć nasłuchiwanie bazy przy wylogowaniu
        return () => unsubscribeFirestore();
      } else {
        // Jeśli wylogowany, czyścimy profil
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isAdmin: false // na razie hardcoded
    }}>
      {children}
    </AuthContext.Provider>
  );
};