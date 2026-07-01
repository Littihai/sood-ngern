import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: { displayName: string; photoURL: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith("sood-ngern-active-book-") || key === "sood-ngern-book-passwords") {
          window.localStorage.removeItem(key);
        }
      });
    }
    await firebaseSignOut(auth);
  };

  const updateUserProfile = async ({ displayName, photoURL }: { displayName: string; photoURL: string }) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, {
      displayName: displayName.trim() || null,
      photoURL: photoURL.trim() || null,
    });
    await auth.currentUser.reload();
    setUser(auth.currentUser ? ({ ...auth.currentUser } as User) : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
