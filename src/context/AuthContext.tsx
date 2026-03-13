import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'; // Dodano updateDoc
import { auth, db } from '../config/firebase';
import { View, ActivityIndicator } from 'react-native';

export interface UserProfile {
  username: string;
  email: string;
  isPro: boolean;
  createdAt?: any;
  favoriteSchool?: string;
  favoriteQualifications?: string[];
  photoURL?: string;
}

interface AuthContextProps {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
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
    // 1. Nasłuchuj stanu autoryzacji
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);

        // 2. Nasłuchuj zmian w profilu użytkownika
        const unsubscribeFirestore = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;

            // --- MECHANIZM AUTO-SYNCHRONIZACJI ---
            // Sprawdzamy, czy email w bazie różni się od tego w Authentication
            if (currentUser.email && data.email !== currentUser.email) {
              console.log("Wykryto zmianę emaila. Synchronizacja bazy danych...");
              try {
                // Aktualizujemy tylko pole email w bazie, żeby pasowało do logowania
                await updateDoc(userDocRef, { email: currentUser.email });
                // Po aktualizacji onSnapshot wykona się ponownie samoczynnie z nowymi danymi
              } catch (err) {
                console.error("Błąd synchronizacji emaila:", err);
              }
            }
            // --------------------------------------

            setUserProfile(data);
          } else {
            console.log("Brak dokumentu użytkownika w bazie!");
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Błąd pobierania profilu:", error);
          setLoading(false);
        });

        return () => unsubscribeFirestore();
      } else {
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
      isAdmin: false
    }}>
      {children}
    </AuthContext.Provider>
  );
};