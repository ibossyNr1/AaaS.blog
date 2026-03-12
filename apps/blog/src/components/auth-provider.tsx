"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  signInWithGoogle,
  signOut as authSignOut,
  onAuthChange,
  type User,
} from "@/lib/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Persona } from "@/lib/types";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  persona: Persona | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setPersona: (persona: Persona) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  setPersona: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function upsertUserProfile(firebaseUser: User): Promise<Persona | null> {
  const ref = doc(db, "users", firebaseUser.uid);
  let persona: Persona | null = null;

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      persona = (snap.data().persona as Persona) ?? null;
      await setDoc(
        ref,
        {
          displayName: firebaseUser.displayName ?? "",
          email: firebaseUser.email ?? "",
          photoURL: firebaseUser.photoURL ?? "",
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      persona = "developer";
      await setDoc(ref, {
        displayName: firebaseUser.displayName ?? "",
        email: firebaseUser.email ?? "",
        photoURL: firebaseUser.photoURL ?? "",
        persona: "developer",
        followedChannels: [],
        digestFrequency: "weekly",
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Failed to upsert user profile:", err);
  }

  return persona;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const persona = await upsertUserProfile(firebaseUser);
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          persona,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign-in failed:", err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authSignOut();
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  }, []);

  const setPersona = useCallback(
    async (persona: Persona) => {
      if (!user) return;
      try {
        await updateDoc(doc(db, "users", user.uid), { persona });
        setUser((prev) => (prev ? { ...prev, persona } : null));
      } catch {
        await setDoc(doc(db, "users", user.uid), { persona }, { merge: true });
        setUser((prev) => (prev ? { ...prev, persona } : null));
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, setPersona }}>
      {children}
    </AuthContext.Provider>
  );
}
