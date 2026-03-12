import { describe, it, expect } from 'vitest';
import {
  parseHexToRGB,
  generateCSSVariables,
  validateThemeColors,
  BUILT_IN_THEMES,
  type ThemeConfig,
  type ThemeColors,
} from '@/lib/theming';

describe('theming', () => {
  // -----------------------------------------------------------------------
  // parseHexToRGB
  // -----------------------------------------------------------------------
  describe('parseHexToRGB', () => {
    it('converts 6-digit hex to RGB', () => {
      expect(parseHexToRGB('#000000')).toBe('0 0 0');
      expect(parseHexToRGB('#ffffff')).toBe('255 255 255');
      expect(parseHexToRGB('#00f3ff')).toBe('0 243 255');
    });

    it('converts 3-digit shorthand hex', () => {
      expect(parseHexToRGB('#fff')).toBe('255 255 255');
      expect(parseHexToRGB('#000')).toBe('0 0 0');
      expect(parseHexToRGB('#abc')).toBe('170 187 204');
    });

    it('handles hex without # prefix', () => {
      expect(parseHexToRGB('ff0000')).toBe('255 0 0');
    });

    it('throws on invalid hex length', () => {
      expect(() => parseHexToRGB('#12')).toThrow('Invalid hex color');
      expect(() => parseHexToRGB('#12345')).toThrow('Invalid hex color');
      expect(() => parseHexToRGB('#1234567')).toThrow('Invalid hex color');
    });

    it('handles mixed case', () => {
      expect(parseHexToRGB('#FF0000')).toBe('255 0 0');
      expect(parseHexToRGB('#aaBBcc')).toBe('170 187 204');
    });
  });

  // -----------------------------------------------------------------------
  // generateCSSVariables
  // -----------------------------------------------------------------------
  describe('generateCSSVariables', () => {
    const testTheme: ThemeConfig = {
      id: 'test',
      name: 'Test Theme',
      isDark: true,
      colors: {
        primary: '#00f3ff',
        accent: '#F43F6C',
        background: '#080809',
        surface: '#1a1a1c',
        border: 'rgba(255, 255, 255, 0.05)',
        text: '#e0e0e0',
        textMuted: '#808080',
      },
    };

    it('produces :root block', () => {
      const css = generateCSSVariables(testTheme);
      expect(css).toContain(':root {');
      expect(css).toContain('}');
    });

    it('includes core color variables', () => {
      const css = generateCSSVariables(testTheme);
      expect(css).toContain('--basalt-deep:');
      expect(css).toContain('--circuit-glow:');
      expect(css).toContain('--accent-red:');
      expect(css).toContain('--text:');
    });

    it('sets aura-blend to screen for dark theme', () => {
      const css = generateCSSVariables(testTheme);
      expect(css).toContain('--aura-blend: screen');
    });

    it('sets aura-blend to multiply for light theme', () => {
      const lightTheme = { ...testTheme, isDark: false };
      const css = generateCSSVariables(lightTheme);
      expect(css).toContain('--aura-blend: multiply');
    });

    it('sets grain-opacity based on isDark', () => {
      const darkCss = generateCSSVariables(testTheme);
      expect(darkCss).toContain('--grain-opacity: 0.6');

      const lightCss = generateCSSVariables({ ...testTheme, isDark: false });
      expect(lightCss).toContain('--grain-opacity: 0.3');
    });

    it('includes typography variables when provided', () => {
      const themed: ThemeConfig = {
        ...testTheme,
        typography: {
          fontFamily: 'Inter',
          monoFontFamily: 'JetBrains Mono',
          headingWeight: '700',
        },
      };
      const css = generateCSSVariables(themed);
      expect(css).toContain('--font-body:');
      expect(css).toContain('Inter');
      expect(css).toContain('--font-mono:');
      expect(css).toContain('--heading-weight: 700');
    });

    it('includes border variables when provided', () => {
      const themed: ThemeConfig = {
        ...testTheme,
        borders: { radius: '8px', borderWidth: '1px' },
      };
      const css = generateCSSVariables(themed);
      expect(css).toContain('--radius: 8px');
      expect(css).toContain('--border-width: 1px');
    });
  });

  // -----------------------------------------------------------------------
  // validateThemeColors
  // -----------------------------------------------------------------------
  describe('validateThemeColors', () => {
    it('accepts valid hex colors', () => {
      const result = validateThemeColors({
        primary: '#00f3ff',
        accent: '#F43F6C',
        background: '#080809',
        text: '#e0e0e0',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts shorthand hex', () => {
      const result = validateThemeColors({ primary: '#0af' });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid hex values', () => {
      const result = validateThemeColors({ primary: 'not-a-color' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('primary');
    });

    it('accepts rgba border values', () => {
      const result = validateThemeColors({ border: 'rgba(255, 255, 255, 0.05)' });
      expect(result.valid).toBe(true);
    });

    it('accepts rgb border values', () => {
      const result = validateThemeColors({ border: 'rgb(255, 255, 255)' });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid border values', () => {
      const result = validateThemeColors({ border: 'solid 1px red' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('border');
    });

    it('validates empty object as valid (no fields to check)', () => {
      const result = validateThemeColors({});
      expect(result.valid).toBe(true);
    });

    it('reports multiple errors', () => {
      const result = validateThemeColors({
        primary: 'bad1',
        accent: 'bad2',
      });
      expect(result.errors).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // BUILT_IN_THEMES
  // -----------------------------------------------------------------------
  describe('BUILT_IN_THEMES', () => {
    it('includes at least 5 themes', () => {
      expect(BUILT_IN_THEMES.length).toBeGreaterThanOrEqual(5);
    });

    it('each theme has unique id', () => {
      const ids = BUILT_IN_THEMES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('includes both dark and light themes', () => {
      const darkCount = BUILT_IN_THEMES.filter((t) => t.isDark).length;
      const lightCount = BUILT_IN_THEMES.filter((t) => !t.isDark).length;
      expect(darkCount).toBeGreaterThan(0);
      expect(lightCount).toBeGreaterThan(0);
    });

    it('contains basalt and light themes', () => {
      const ids = BUILT_IN_THEMES.map((t) => t.id);
      expect(ids).toContain('basalt');
      expect(ids).toContain('light');
    });

    it('all themes have complete color definitions', () => {
      const requiredKeys: (keyof ThemeColors)[] = [
        'primary', 'accent', 'background', 'surface', 'border', 'text', 'textMuted',
      ];
      for (const theme of BUILT_IN_THEMES) {
        for (const key of requiredKeys) {
          expect(theme.colors[key]).toBeTruthy();
        }
      }
    });
  });
});
