"use client";

import type { EntityType } from "@/lib/types";

// --- Types ---

interface EntityViewEvent {
  type: EntityType;
  slug: string;
  timestamp: number;
}

interface SearchEvent {
  query: string;
  timestamp: number;
}

interface BehaviorStore {
  views: EntityViewEvent[];
  searches: SearchEvent[];
}

// --- Storage Keys ---

const STORAGE_KEY = "aaas-behavior";
const MAX_VIEWS = 200;
const MAX_SEARCHES = 100;

// --- Helpers ---

function getStore(): BehaviorStore {
  if (typeof window === "undefined") return { views: [], searches: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { views: [], searches: [] };
    return JSON.parse(raw) as BehaviorStore;
  } catch {
    return { views: [], searches: [] };
  }
}

function saveStore(store: BehaviorStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

// --- Public API ---

/** Record an entity page view with timestamp. Deduplicates consecutive views of the same entity. */
export function trackEntityView(type: EntityType, slug: string): void {
  const store = getStore();
  const now = Date.now();

  // Skip if the most recent view is the same entity (within 30 seconds)
  const last = store.views[0];
  if (last && last.type === type && last.slug === slug && now - last.timestamp < 30_000) {
    return;
  }

  store.views.unshift({ type, slug, timestamp: now });
  store.views = store.views.slice(0, MAX_VIEWS);
  saveStore(store);
}

/** Record a search query. */
export function trackSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;

  const store = getStore();
  store.searches.unshift({ query: trimmed, timestamp: Date.now() });
  store.searches = store.searches.slice(0, MAX_SEARCHES);
  saveStore(store);
}

/** Return the most recently viewed entity type+slug pairs (deduplicated by entity). */
export function getRecentlyViewed(limit = 10): { type: EntityType; slug: string }[] {
  const store = getStore();
  const seen = new Set<string>();
  const results: { type: EntityType; slug: string }[] = [];

  for (const view of store.views) {
    const key = `${view.type}:${view.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ type: view.type, slug: view.slug });
    if (results.length >= limit) break;
  }

  return results;
}

/** Return entity types and categories ordered by view frequency. */
export function getTopCategories(): { types: Record<string, number>; categories: Record<string, number> } {
  const store = getStore();
  const types: Record<string, number> = {};
  const categories: Record<string, number> = {};

  // We only have type info stored locally — categories come from the entity data.
  // Count type frequency from views.
  for (const view of store.views) {
    types[view.type] = (types[view.type] || 0) + 1;
  }

  return { types, categories };
}

/** Return full view history for analytics display. */
export function getViewHistory(): EntityViewEvent[] {
  return getStore().views;
}

/** Return full search history. */
export function getSearchHistory(): SearchEvent[] {
  return getStore().searches;
}

/** Get a set of viewed entity keys ("type:slug") for filtering. */
export function getViewedEntityKeys(): Set<string> {
  const store = getStore();
  return new Set(store.views.map((v) => `${v.type}:${v.slug}`));
}
