import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, validateFirestoreConnection } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync or retrieve user profile
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            userId: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Member',
            email: currentUser.email || '',
            avatarUrl: currentUser.photoURL || '',
            bio: '',
            username: (currentUser.displayName || currentUser.email?.split('@')[0] || 'member').toLowerCase().replace(/[^a-z0-9_]/g, ''),
            theme: 'dark',
            accentColor: '#8B5CF6',
            compactMode: false,
            aiModel: 'Balanced (Gemini 3.6 Flash)',
            aiBehavior: 'Helpful and concise',
            aiMemoryEnabled: true,
            emailNotifications: true,
            pushNotifications: true,
            taskReminders: true,
            calendarReminders: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          setProfile(userDoc.data() as UserProfile);
        }

        // Listen for profile changes in real time
        const unsubProfile = onSnapshot(
          userRef,
          (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            }
          },
          (err) => {
            console.warn('User profile sync notice:', err?.message || err);
          }
        );

        setLoading(false);
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      return !!cred?.user;
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('cancelled-popup-request')
      ) {
        // User closed or dismissed the popup window before completing sign-in.
        // This is a normal user cancellation, so we exit quietly without throwing an error.
        return false;
      }
      console.error('Google Sign-in Error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      const userRef = doc(db, 'users', cred.user.uid);
      const newProfile: UserProfile = {
        userId: cred.user.uid,
        name: name.trim() || email.split('@')[0],
        email: cred.user.email || email,
        avatarUrl: '',
        bio: '',
        username: (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, ''),
        theme: 'dark',
        accentColor: '#8B5CF6',
        compactMode: false,
        aiModel: 'Balanced (Gemini 3.6 Flash)',
        aiBehavior: 'Helpful and concise',
        aiMemoryEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        calendarReminders: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      setProfile(newProfile);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, updated, { merge: true });
    setProfile((prev) => prev ? { ...prev, ...updated } : null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        signOut: logout,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
