import { describe, it, expect } from 'vitest';
import {
  canonicalUrl,
  generateBreadcrumbJsonLd,
  generateOrganizationJsonLd,
  generateFAQJsonLd,
  generateEntityMeta,
} from '@/lib/seo';

describe('seo', () => {
  // -----------------------------------------------------------------------
  // canonicalUrl
  // -----------------------------------------------------------------------
  describe('canonicalUrl', () => {
    it('prepends site URL to path with leading slash', () => {
      expect(canonicalUrl('/tools')).toBe('https://aaas.blog/tools');
    });

    it('adds leading slash when missing', () => {
      expect(canonicalUrl('models')).toBe('https://aaas.blog/models');
    });

    it('handles root path', () => {
      expect(canonicalUrl('/')).toBe('https://aaas.blog/');
    });

    it('preserves nested paths', () => {
      expect(canonicalUrl('/tools/langchain')).toBe('https://aaas.blog/tools/langchain');
    });
  });

  // -----------------------------------------------------------------------
  // generateBreadcrumbJsonLd
  // -----------------------------------------------------------------------
  describe('generateBreadcrumbJsonLd', () => {
    it('generates valid BreadcrumbList schema', () => {
      const result = generateBreadcrumbJsonLd([
        { name: 'Home', url: '/' },
        { name: 'Tools', url: '/tools' },
      ]) as Record<string, unknown>;

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('BreadcrumbList');
    });

    it('assigns correct positions starting from 1', () => {
      const result = generateBreadcrumbJsonLd([
        { name: 'Home', url: '/' },
        { name: 'Tools', url: '/tools' },
        { name: 'LangChain', url: '/tools/langchain' },
      ]) as { itemListElement: Array<{ position: number; name: string }> };

      expect(result.itemListElement).toHaveLength(3);
      expect(result.itemListElement[0].position).toBe(1);
      expect(result.itemListElement[1].position).toBe(2);
      expect(result.itemListElement[2].position).toBe(3);
    });

    it('converts relative URLs to canonical', () => {
      const result = generateBreadcrumbJsonLd([
        { name: 'Tools', url: '/tools' },
      ]) as { itemListElement: Array<{ item: string }> };

      expect(result.itemListElement[0].item).toBe('https://aaas.blog/tools');
    });

    it('preserves absolute URLs', () => {
      const result = generateBreadcrumbJsonLd([
        { name: 'External', url: 'https://example.com/page' },
      ]) as { itemListElement: Array<{ item: string }> };

      expect(result.itemListElement[0].item).toBe('https://example.com/page');
    });

    it('handles empty crumbs array', () => {
      const result = generateBreadcrumbJsonLd([]) as { itemListElement: unknown[] };
      expect(result.itemListElement).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // generateOrganizationJsonLd
  // -----------------------------------------------------------------------
  describe('generateOrganizationJsonLd', () => {
    it('returns Organization schema type', () => {
      const result = generateOrganizationJsonLd() as Record<string, unknown>;
      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Organization');
    });

    it('includes required org fields', () => {
      const result = generateOrganizationJsonLd() as Record<string, unknown>;
      expect(result.name).toBeTruthy();
      expect(result.url).toBe('https://aaas.blog');
      expect(result.logo).toBeTruthy();
      expect(result.description).toBeTruthy();
    });

    it('includes social links', () => {
      const result = generateOrganizationJsonLd() as { sameAs: string[] };
      expect(Array.isArray(result.sameAs)).toBe(true);
      expect(result.sameAs.length).toBeGreaterThan(0);
    });

    it('includes contact point', () => {
      const result = generateOrganizationJsonLd() as { contactPoint: Record<string, string> };
      expect(result.contactPoint).toBeDefined();
      expect(result.contactPoint['@type']).toBe('ContactPoint');
    });
  });

  // -----------------------------------------------------------------------
  // generateFAQJsonLd
  // -----------------------------------------------------------------------
  describe('generateFAQJsonLd', () => {
    it('generates FAQPage schema', () => {
      const result = generateFAQJsonLd([
        { question: 'What is AaaS?', answer: 'Agents as a Service.' },
      ]) as Record<string, unknown>;

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('FAQPage');
    });

    it('maps questions and answers correctly', () => {
      const faqs = [
        { question: 'Q1?', answer: 'A1' },
        { question: 'Q2?', answer: 'A2' },
      ];
      const result = generateFAQJsonLd(faqs) as {
        mainEntity: Array<{
          name: string;
          acceptedAnswer: { text: string };
        }>;
      };

      expect(result.mainEntity).toHaveLength(2);
      expect(result.mainEntity[0].name).toBe('Q1?');
      expect(result.mainEntity[0].acceptedAnswer.text).toBe('A1');
    });
  });

  // -----------------------------------------------------------------------
  // generateEntityMeta
  // -----------------------------------------------------------------------
  describe('generateEntityMeta', () => {
    const mockEntity = {
      name: 'LangChain',
      type: 'tool' as const,
      slug: 'langchain',
      description: 'A framework for building LLM applications with composable components.',
      // Minimal fields to satisfy the Entity type
      status: 'published' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      tags: ['llm'],
      compositeScore: 85,
      channels: [],
    };

    it('generates title with entity name and type', () => {
      const meta = generateEntityMeta(mockEntity as never);
      expect(meta.title).toContain('LangChain');
      expect(meta.title).toContain('Tool');
    });

    it('truncates long descriptions to 160 chars', () => {
      const longDesc = 'A'.repeat(200);
      const entity = { ...mockEntity, description: longDesc };
      const meta = generateEntityMeta(entity as never);
      expect((meta.description as string).length).toBeLessThanOrEqual(160);
    });

    it('includes canonical URL', () => {
      const meta = generateEntityMeta(mockEntity as never);
      expect((meta.alternates as { canonical: string }).canonical).toBe(
        'https://aaas.blog/tool/langchain',
      );
    });

    it('includes OpenGraph metadata', () => {
      const meta = generateEntityMeta(mockEntity as never);
      expect(meta.openGraph).toBeDefined();
      expect((meta.openGraph as Record<string, unknown>).type).toBe('article');
    });

    it('includes Twitter card metadata', () => {
      const meta = generateEntityMeta(mockEntity as never);
      expect(meta.twitter).toBeDefined();
      expect((meta.twitter as Record<string, unknown>).card).toBe('summary_large_image');
    });
  });
});
