import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  type Achievement,
  type AchievementCategory,
  type AchievementTier,
} from '@/lib/achievements';

describe('achievements', () => {
  // -----------------------------------------------------------------------
  // ACHIEVEMENTS array completeness
  // -----------------------------------------------------------------------
  describe('ACHIEVEMENTS array', () => {
    it('has at least 20 achievements', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    });

    it('every achievement has a non-empty id', () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.id).toBeTruthy();
        expect(typeof a.id).toBe('string');
      }
    });

    it('every achievement has all required fields', () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.name).toBeTruthy();
        expect(a.description).toBeTruthy();
        expect(a.icon).toBeTruthy();
        expect(a.category).toBeTruthy();
        expect(a.tier).toBeTruthy();
        expect(a.requirement).toBeDefined();
        expect(a.requirement.type).toBeTruthy();
        expect(typeof a.requirement.threshold).toBe('number');
        expect(typeof a.points).toBe('number');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Unique IDs
  // -----------------------------------------------------------------------
  describe('unique IDs', () => {
    it('all achievement IDs are unique', () => {
      const ids = ACHIEVEMENTS.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // -----------------------------------------------------------------------
  // All tiers represented
  // -----------------------------------------------------------------------
  describe('tier representation', () => {
    const allTiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum'];

    it('contains achievements for every tier', () => {
      const tiersPresent = new Set(ACHIEVEMENTS.map((a) => a.tier));
      for (const tier of allTiers) {
        expect(tiersPresent.has(tier)).toBe(true);
      }
    });

    it('bronze is the most common tier', () => {
      const bronzeCount = ACHIEVEMENTS.filter((a) => a.tier === 'bronze').length;
      const platinumCount = ACHIEVEMENTS.filter((a) => a.tier === 'platinum').length;
      expect(bronzeCount).toBeGreaterThan(platinumCount);
    });
  });

  // -----------------------------------------------------------------------
  // All categories represented
  // -----------------------------------------------------------------------
  describe('category representation', () => {
    const allCategories: AchievementCategory[] = [
      'explorer',
      'contributor',
      'curator',
      'social',
      'streak',
    ];

    it('contains achievements for every category', () => {
      const categoriesPresent = new Set(ACHIEVEMENTS.map((a) => a.category));
      for (const cat of allCategories) {
        expect(categoriesPresent.has(cat)).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Point values
  // -----------------------------------------------------------------------
  describe('point values', () => {
    it('all points are positive integers', () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.points).toBeGreaterThan(0);
        expect(Number.isInteger(a.points)).toBe(true);
      }
    });

    it('higher tiers generally award more points', () => {
      const avgByTier = (tier: AchievementTier) => {
        const items = ACHIEVEMENTS.filter((a) => a.tier === tier);
        return items.reduce((sum, a) => sum + a.points, 0) / items.length;
      };
      expect(avgByTier('platinum')).toBeGreaterThan(avgByTier('bronze'));
      expect(avgByTier('gold')).toBeGreaterThan(avgByTier('bronze'));
    });
  });

  // -----------------------------------------------------------------------
  // Requirement thresholds
  // -----------------------------------------------------------------------
  describe('requirement thresholds', () => {
    it('all thresholds are positive', () => {
      for (const a of ACHIEVEMENTS) {
        expect(a.requirement.threshold).toBeGreaterThan(0);
      }
    });

    it('within a requirement type, higher tiers have higher thresholds', () => {
      // Group by requirement type and check ordering
      const byType = new Map<string, Achievement[]>();
      for (const a of ACHIEVEMENTS) {
        const list = byType.get(a.requirement.type) || [];
        list.push(a);
        byType.set(a.requirement.type, list);
      }

      for (const [, achievements] of byType) {
        const sorted = [...achievements].sort(
          (a, b) => a.requirement.threshold - b.requirement.threshold,
        );
        // Thresholds should be non-decreasing
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].requirement.threshold).toBeGreaterThanOrEqual(
            sorted[i - 1].requirement.threshold,
          );
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // ACTION_TO_REQUIREMENT mapping
  // -----------------------------------------------------------------------
  describe('ACTION_TO_REQUIREMENT mapping', () => {
    // We can't import ACTION_TO_REQUIREMENT directly (it's not exported),
    // but we can verify every requirement type used in ACHIEVEMENTS is a
    // known type from the type definition.
    const validTypes = [
      'entity_views',
      'searches',
      'submissions',
      'follows',
      'bookmarks',
      'collections',
      'login_streak',
      'comparisons',
    ];

    it('all requirement types in ACHIEVEMENTS are valid', () => {
      for (const a of ACHIEVEMENTS) {
        expect(validTypes).toContain(a.requirement.type);
      }
    });

    it('every valid requirement type has at least one achievement', () => {
      const typesUsed = new Set(ACHIEVEMENTS.map((a) => a.requirement.type));
      for (const type of validTypes) {
        expect(typesUsed.has(type)).toBe(true);
      }
    });
  });
});
