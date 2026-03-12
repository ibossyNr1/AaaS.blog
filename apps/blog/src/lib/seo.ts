/* ------------------------------------------------------------------ */
/*  SEO utilities — metadata and JSON-LD generation                    */
/* ------------------------------------------------------------------ */

import type { Metadata } from "next";
import type { Entity } from "@/lib/types";

const SITE_URL = "https://aaas.blog";
const ORG_NAME = "AaaS — Agents as a Service";

/**
 * Generate a canonical URL for a given path.
 */
export function canonicalUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/**
 * Generate Next.js Metadata for an entity page.
 */
export function generateEntityMeta(entity: Entity): Metadata {
  const title = `${entity.name} — ${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)} | AaaS Knowledge Index`;
  const description =
    entity.description.length > 160
      ? entity.description.slice(0, 157) + "..."
      : entity.description;

  const url = canonicalUrl(`/${entity.type}/${entity.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: ORG_NAME,
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate JSON-LD BreadcrumbList structured data.
 */
export function generateBreadcrumbJsonLd(
  crumbs: { name: string; url: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url.startsWith("http") ? crumb.url : canonicalUrl(crumb.url),
    })),
  };
}

/**
 * Generate JSON-LD FAQPage structured data.
 */
export function generateFAQJsonLd(
  faqs: { question: string; answer: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate JSON-LD Organization structured data for AaaS.
 */
export function generateOrganizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "The AI ecosystem knowledge index — schema-first entity database for tools, models, agents, skills, scripts, and benchmarks.",
    foundingDate: "2024",
    sameAs: [
      "https://github.com/supraforge",
      "https://x.com/supraforge",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "technical support",
      url: `${SITE_URL}/contact`,
    },
  };
}
