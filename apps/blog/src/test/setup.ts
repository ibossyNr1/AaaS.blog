import { vi } from 'vitest';

// Mock Firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: () => ({ toDate: () => new Date('2026-01-01T00:00:00Z') }),
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
  getCountFromServer: vi.fn(),
  serverTimestamp: vi.fn(),
}));
