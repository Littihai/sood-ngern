import React, { createContext, useContext, useEffect, useState } from "react";
import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { DeletionStep, purgeUserData } from "../lib/accountDeletion";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True right after the user deleted their account (the login page shows a confirmation). */
  accountDeleted: boolean;
  dismissAccountDeleted: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (profile: { displayName: string; photoURL: string }) => Promise<void>;
  /**
   * Permanently deletes the signed-in user's data and Auth account.
   * Must be called from a click handler: step 1 opens a Google pop-up.
   */
  deleteAccount: (onStep: (step: DeletionStep) => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function clearLocalData() {
  if (typeof window === "undefined") return;
  Object.keys(window.localStorage).forEach((key) => {
    if (key.startsWith("sood-ngern-")) window.localStorage.removeItem(key);
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountDeleted, setAccountDeleted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setAccountDeleted(false);
    await signInWithPopup(auth, googleProvider);
  };

  const signOut = async () => {
    clearLocalData();
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

  const deleteAccount = async (onStep: (step: DeletionStep) => void) => {
    const current = auth.currentUser;
    if (!current) throw new Error("ยังไม่ได้เข้าสู่ระบบ");

    // Firebase only deletes an account after a recent sign-in, so re-confirm identity first.
    onStep("reauth");
    await reauthenticateWithPopup(current, googleProvider);

    await purgeUserData(current.uid, onStep);

    onStep("account");
    await deleteUser(current);

    clearLocalData();
    setAccountDeleted(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accountDeleted,
        dismissAccountDeleted: () => setAccountDeleted(false),
        signInWithGoogle,
        signOut,
        updateUserProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
