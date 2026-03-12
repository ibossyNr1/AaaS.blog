"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthChange, type User } from "@/lib/auth";

const STORAGE_KEY = "aaas-follows";
const CHANGE_EVENT = "follows-change";

interface FollowsData {
  followedEntities: string[]; // "type:slug"
  followedChannels: string[]; // channel slug
}

function emptyData(): FollowsData {
  return { followedEntities: [], followedChannels: [] };
}

function readStorage(): FollowsData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyData(), ...JSON.parse(raw) } : emptyData();
  } catch {
    return emptyData();
  }
}

function writeStorage(data: FollowsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

async function readFirestore(uid: string): Promise<FollowsData> {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      return {
        followedEntities: d.followedEntities ?? [],
        followedChannels: d.followedChannels ?? [],
      };
    }
  } catch {
    // fall through
  }
  return emptyData();
}

async function writeFirestore(uid: string, data: FollowsData) {
  try {
    const ref = doc(db, "users", uid);
    await setDoc(ref, {
      followedEntities: data.followedEntities,
      followedChannels: data.followedChannels,
    }, { merge: true });
  } catch {
    // silent fail — localStorage is the fallback
  }
}

export function useFollows() {
  const [data, setData] = useState<FollowsData>(emptyData());
  const [user, setUser] = useState<User | null>(null);

  // Auth listener
  useEffect(() => {
    return onAuthChange((u) => setUser(u));
  }, []);

  // Load data on mount / auth change
  useEffect(() => {
    if (user) {
      readFirestore(user.uid).then((remote) => {
        // Merge local into remote on first sign-in
        const local = readStorage();
        const merged: FollowsData = {
          followedEntities: Array.from(new Set([...remote.followedEntities, ...local.followedEntities])),
          followedChannels: Array.from(new Set([...remote.followedChannels, ...local.followedChannels])),
        };
        setData(merged);
        writeStorage(merged);
        writeFirestore(user.uid, merged);
      });
    } else {
      setData(readStorage());
    }
  }, [user]);

  // Cross-tab sync via storage event
  useEffect(() => {
    const handler = () => setData(readStorage());
    window.addEventListener(CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const persist = useCallback(
    (next: FollowsData) => {
      setData(next);
      writeStorage(next);
      if (user) writeFirestore(user.uid, next);
    },
    [user],
  );

  const followEntity = useCallback(
    (id: string) => {
      const current = readStorage();
      if (current.followedEntities.includes(id)) return;
      persist({ ...current, followedEntities: [...current.followedEntities, id] });
    },
    [persist],
  );

  const unfollowEntity = useCallback(
    (id: string) => {
      const current = readStorage();
      persist({ ...current, followedEntities: current.followedEntities.filter((e) => e !== id) });
    },
    [persist],
  );

  const followChannel = useCallback(
    (slug: string) => {
      const current = readStorage();
      if (current.followedChannels.includes(slug)) return;
      persist({ ...current, followedChannels: [...current.followedChannels, slug] });
    },
    [persist],
  );

  const unfollowChannel = useCallback(
    (slug: string) => {
      const current = readStorage();
      persist({ ...current, followedChannels: current.followedChannels.filter((c) => c !== slug) });
    },
    [persist],
  );

  const isFollowingEntity = useCallback(
    (id: string) => data.followedEntities.includes(id),
    [data.followedEntities],
  );

  const isFollowingChannel = useCallback(
    (slug: string) => data.followedChannels.includes(slug),
    [data.followedChannels],
  );

  return {
    followedEntities: data.followedEntities,
    followedChannels: data.followedChannels,
    followEntity,
    unfollowEntity,
    followChannel,
    unfollowChannel,
    isFollowingEntity,
    isFollowingChannel,
  };
}
