import type { Entity, EntityType } from "./types";

export function generateJsonLd(entity: Entity): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    "@type": mapEntityTypeToSchemaOrg(entity.type),
    name: entity.name,
    description: entity.description,
    url: entity.url,
    provider: {
      "@type": "Organization",
      name: entity.provider,
    },
    dateCreated: entity.addedDate,
    dateModified: entity.lastUpdated,
    keywords: entity.tags.join(", "),
    version: entity.version,
  };

  switch (entity.type) {
    case "tool":
      return {
        ...base,
        "@type": "SoftwareApplication",
        applicationCategory: "AI Tool",
        operatingSystem: "Cloud",
        offers: {
          "@type": "Offer",
          price: entity.pricingModel === "free" ? "0" : undefined,
          priceCurrency: "USD",
        },
        programmingLanguage: entity.sdkLanguages,
      };
    case "model":
      return {
        ...base,
        "@type": "SoftwareApplication",
        applicationCategory: "AI Model",
        additionalProperty: [
          { "@type": "PropertyValue", name: "contextWindow", value: entity.contextWindow },
          { "@type": "PropertyValue", name: "parameterCount", value: entity.parameterCount },
          { "@type": "PropertyValue", name: "modalities", value: entity.modalities.join(", ") },
        ],
      };
    case "agent":
      return {
        ...base,
        "@type": "SoftwareApplication",
        applicationCategory: "AI Agent",
        additionalProperty: [
          { "@type": "PropertyValue", name: "autonomyLevel", value: entity.autonomyLevel },
        ],
      };
    case "benchmark":
      return {
        ...base,
        "@type": "Dataset",
        measurementTechnique: entity.methodology,
      };
    default:
      return base;
  }
}

function mapEntityTypeToSchemaOrg(type: EntityType): string {
  switch (type) {
    case "tool":
    case "model":
    case "agent":
    case "script":
      return "SoftwareApplication";
    case "skill":
      return "HowTo";
    case "benchmark":
      return "Dataset";
  }
}
