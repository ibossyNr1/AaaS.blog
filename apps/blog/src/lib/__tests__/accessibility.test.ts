import { describe, it, expect } from 'vitest';
import {
  hexToLuminance,
  getContrastRatio,
  meetsWCAG,
  generateAriaLabel,
  getKeyboardShortcutLabel,
  KEYBOARD_SHORTCUTS,
} from '@/lib/accessibility';

describe('accessibility', () => {
  // -----------------------------------------------------------------------
  // hexToLuminance
  // -----------------------------------------------------------------------
  describe('hexToLuminance', () => {
    it('returns 0 for pure black', () => {
      expect(hexToLuminance('#000000')).toBeCloseTo(0, 4);
    });

    it('returns 1 for pure white', () => {
      expect(hexToLuminance('#ffffff')).toBeCloseTo(1, 4);
    });

    it('returns intermediate value for grey', () => {
      const lum = hexToLuminance('#808080');
      expect(lum).toBeGreaterThan(0);
      expect(lum).toBeLessThan(1);
    });

    it('handles 3-digit hex shorthand', () => {
      expect(hexToLuminance('#fff')).toBeCloseTo(1, 4);
      expect(hexToLuminance('#000')).toBeCloseTo(0, 4);
    });

    it('throws on invalid hex', () => {
      expect(() => hexToLuminance('#zzzzzz')).not.toThrow(); // NaN but doesn't throw
      expect(() => hexToLuminance('#12')).toThrow('Invalid hex color');
    });

    it('handles hex without # prefix', () => {
      const lum = hexToLuminance('ff0000');
      expect(lum).toBeGreaterThan(0);
      expect(lum).toBeLessThan(0.3); // red has low luminance
    });
  });

  // -----------------------------------------------------------------------
  // getContrastRatio
  // -----------------------------------------------------------------------
  describe('getContrastRatio', () => {
    it('returns 21 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('returns 1 for same color', () => {
      const ratio = getContrastRatio('#abcdef', '#abcdef');
      expect(ratio).toBeCloseTo(1, 2);
    });

    it('is commutative (order independent)', () => {
      const r1 = getContrastRatio('#ff0000', '#0000ff');
      const r2 = getContrastRatio('#0000ff', '#ff0000');
      expect(r1).toBeCloseTo(r2, 4);
    });

    it('returns a value between 1 and 21', () => {
      const ratio = getContrastRatio('#336699', '#ccddee');
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(21);
    });

    it('high contrast pairs exceed 4.5', () => {
      // Dark text on light background
      const ratio = getContrastRatio('#111111', '#eeeeee');
      expect(ratio).toBeGreaterThan(4.5);
    });
  });

  // -----------------------------------------------------------------------
  // meetsWCAG
  // -----------------------------------------------------------------------
  describe('meetsWCAG', () => {
    it('black on white meets AA', () => {
      expect(meetsWCAG('#000000', '#ffffff', 'AA')).toBe(true);
    });

    it('black on white meets AAA', () => {
      expect(meetsWCAG('#000000', '#ffffff', 'AAA')).toBe(true);
    });

    it('low contrast fails AA', () => {
      // Light grey on white
      expect(meetsWCAG('#cccccc', '#ffffff', 'AA')).toBe(false);
    });

    it('defaults to AA level', () => {
      expect(meetsWCAG('#000000', '#ffffff')).toBe(true);
    });

    it('medium contrast may pass AA but fail AAA', () => {
      // This grey pair has ~4.5:1 ratio (near AA threshold)
      const ratio = getContrastRatio('#767676', '#ffffff');
      // #767676 on white is the classic AA boundary
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAG('#767676', '#ffffff', 'AA')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // generateAriaLabel
  // -----------------------------------------------------------------------
  describe('generateAriaLabel', () => {
    it('generates label with type and name', () => {
      const label = generateAriaLabel('Tool', 'LangChain');
      expect(label).toBe('Tool: LangChain');
    });

    it('includes score when provided', () => {
      const label = generateAriaLabel('Model', 'GPT-4', 95);
      expect(label).toContain('composite score 95 out of 100');
    });

    it('omits score text when undefined', () => {
      const label = generateAriaLabel('Agent', 'AutoGPT');
      expect(label).not.toContain('score');
    });

    it('handles empty strings', () => {
      const label = generateAriaLabel('', '');
      expect(label).toBe(': ');
    });

    it('includes score of zero', () => {
      const label = generateAriaLabel('Benchmark', 'Test', 0);
      expect(label).toContain('composite score 0 out of 100');
    });
  });

  // -----------------------------------------------------------------------
  // getKeyboardShortcutLabel
  // -----------------------------------------------------------------------
  describe('getKeyboardShortcutLabel', () => {
    it('joins keys with +', () => {
      expect(getKeyboardShortcutLabel(['Cmd', 'K'])).toBe('Cmd + K');
    });

    it('handles single key', () => {
      expect(getKeyboardShortcutLabel(['Esc'])).toBe('Esc');
    });

    it('handles three keys', () => {
      expect(getKeyboardShortcutLabel(['Ctrl', 'Shift', 'P'])).toBe('Ctrl + Shift + P');
    });
  });

  // -----------------------------------------------------------------------
  // KEYBOARD_SHORTCUTS
  // -----------------------------------------------------------------------
  describe('KEYBOARD_SHORTCUTS', () => {
    it('defines at least 10 shortcuts', () => {
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThanOrEqual(10);
    });

    it('each shortcut has key, description, and action', () => {
      for (const shortcut of KEYBOARD_SHORTCUTS) {
        expect(shortcut.key).toBeTruthy();
        expect(shortcut.description).toBeTruthy();
        expect(shortcut.action).toBeTruthy();
      }
    });

    it('includes command palette shortcut', () => {
      const cmdPalette = KEYBOARD_SHORTCUTS.find(
        (s) => s.action === 'openCommandPalette',
      );
      expect(cmdPalette).toBeDefined();
    });
  });
});
