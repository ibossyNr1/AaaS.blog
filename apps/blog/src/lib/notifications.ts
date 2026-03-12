import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  getCountFromServer,
  setDoc,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | "entity_update"
  | "score_change"
  | "new_follower"
  | "mention"
  | "digest_ready"
  | "anomaly"
  | "workspace_invite"
  | "system"
  | "achievement";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  entityRef?: { slug: string; type: string };
  read: boolean;
  archived: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  channel: "in_app" | "email" | "webhook" | "push";
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  digestEmail: boolean;
  mutedTypes: NotificationType[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOTIFICATIONS_COL = "notifications";
const PREFERENCES_COL = "notification_preferences";

function toNotification(id: string, data: Record<string, unknown>): Notification {
  return {
    id,
    userId: (data.userId as string) ?? "",
    type: (data.type as NotificationType) ?? "system",
    title: (data.title as string) ?? "",
    body: (data.body as string) ?? "",
    link: data.link as string | undefined,
    entityRef: data.entityRef as { slug: string; type: string } | undefined,
    read: (data.read as boolean) ?? false,
    archived: (data.archived as boolean) ?? false,
    priority: (data.priority as Notification["priority"]) ?? "normal",
    channel: (data.channel as Notification["channel"]) ?? "in_app",
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : (data.createdAt as string) ?? new Date().toISOString(),
    readAt: data.readAt instanceof Timestamp
      ? data.readAt.toDate().toISOString()
      : (data.readAt as string | undefined),
  };
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export async function sendNotification(
  notification: Omit<Notification, "id" | "createdAt" | "read" | "archived">
): Promise<void> {
  await addDoc(collection(db, NOTIFICATIONS_COL), {
    ...notification,
    read: false,
    archived: false,
    createdAt: Timestamp.now(),
  });
}

export async function getUserNotifications(
  userId: string,
  opts?: { unreadOnly?: boolean; limit?: number; type?: NotificationType; offset?: number }
): Promise<Notification[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constraints: any[] = [
    where("userId", "==", userId),
    where("archived", "==", false),
  ];

  if (opts?.unreadOnly) {
    constraints.push(where("read", "==", false));
  }

  if (opts?.type) {
    constraints.push(where("type", "==", opts.type));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(firestoreLimit(opts?.limit ?? 50));

  const q = query(collection(db, NOTIFICATIONS_COL), ...constraints);
  const snap = await getDocs(q);

  return snap.docs.map((d) => toNotification(d.id, d.data()));
}

export async function markAsRead(notificationId: string): Promise<void> {
  const ref = doc(db, NOTIFICATIONS_COL, notificationId);
  await updateDoc(ref, {
    read: true,
    readAt: Timestamp.now(),
  });
}

export async function markAllRead(userId: string): Promise<void> {
  const q = query(
    collection(db, NOTIFICATIONS_COL),
    where("userId", "==", userId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  const now = Timestamp.now();
  await Promise.all(
    snap.docs.map((d) => updateDoc(d.ref, { read: true, readAt: now }))
  );
}

export async function archiveNotification(notificationId: string): Promise<void> {
  const ref = doc(db, NOTIFICATIONS_COL, notificationId);
  await updateDoc(ref, { archived: true });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const ref = doc(db, NOTIFICATIONS_COL, notificationId);
  await deleteDoc(ref);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const q = query(
    collection(db, NOTIFICATIONS_COL),
    where("userId", "==", userId),
    where("read", "==", false),
    where("archived", "==", false)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

const DEFAULT_PREFERENCES: NotificationPreferences = {
  inApp: true,
  email: true,
  push: false,
  digestEmail: true,
  mutedTypes: [],
};

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const ref = doc(db, PREFERENCES_COL, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULT_PREFERENCES };
  const data = snap.data();
  return {
    inApp: data.inApp ?? DEFAULT_PREFERENCES.inApp,
    email: data.email ?? DEFAULT_PREFERENCES.email,
    push: data.push ?? DEFAULT_PREFERENCES.push,
    digestEmail: data.digestEmail ?? DEFAULT_PREFERENCES.digestEmail,
    mutedTypes: data.mutedTypes ?? DEFAULT_PREFERENCES.mutedTypes,
    quietHoursStart: data.quietHoursStart,
    quietHoursEnd: data.quietHoursEnd,
  };
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const ref = doc(db, PREFERENCES_COL, userId);
  await setDoc(ref, prefs, { merge: true });
}
