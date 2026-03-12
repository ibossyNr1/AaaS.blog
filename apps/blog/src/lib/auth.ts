import type { User } from "firebase/auth";

let _module: typeof import("firebase/auth") | null = null;

async function getFirebaseAuth() {
  if (!_module) {
    _module = await import("firebase/auth");
  }
  return _module;
}

let _authPromise: Promise<import("firebase/auth").Auth> | null = null;

function getAuthInstance() {
  if (!_authPromise) {
    _authPromise = (async () => {
      const { getAuth } = await getFirebaseAuth();
      const { app } = await import("@/lib/firebase");
      return getAuth(app);
    })();
  }
  return _authPromise;
}

export async function signInWithGoogle() {
  const [{ signInWithPopup, GoogleAuthProvider }, auth] = await Promise.all([
    getFirebaseAuth(),
    getAuthInstance(),
  ]);
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function signOut() {
  const [{ signOut: firebaseSignOut }, auth] = await Promise.all([
    getFirebaseAuth(),
    getAuthInstance(),
  ]);
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  let unsubscribe: (() => void) | null = null;

  getAuthInstance().then(async (auth) => {
    const { onAuthStateChanged } = await getFirebaseAuth();
    unsubscribe = onAuthStateChanged(auth, callback);
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}

export type { User };
