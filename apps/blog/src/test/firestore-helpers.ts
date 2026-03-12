import { vi } from 'vitest';

export function mockFirestoreDoc(data: Record<string, unknown> | null) {
  const exists = data !== null;
  return {
    exists: () => exists,
    data: () => data,
    id: 'mock-doc-id',
    ref: { id: 'mock-doc-id' },
  };
}

export function mockFirestoreSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    empty: docs.length === 0,
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
      ref: { id: d.id },
    })),
    size: docs.length,
  };
}

export function mockCountSnap(count: number) {
  return { data: () => ({ count }) };
}

export function resetFirestoreMocks() {
  vi.resetAllMocks();
}
