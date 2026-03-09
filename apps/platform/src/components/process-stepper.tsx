"use client";

import { useState } from "react";
import { Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "./motion";

const steps = [
  {
    number: "01",
    title: "Define",
    heading: "Establish Your Strategic Foundations",
    description:
      "We map your vision, mission, values, target audience, competitive landscape, and strategic goals. This becomes the foundation that every agent references.",
  },
  {
    number: "02",
    title: "Structure",
    heading: "Convert Knowledge to Machine-Readable Data",
    description:
      "Qualitative business knowledge gets transformed into structured JSON context — brand voice, customer personas, product specs, market positioning. Agents consume this natively.",
  },
  {
    number: "03",
    title: "Create",
    heading: "Generate With Full Context",
    description:
      "Agents produce marketing copy, sales materials, research reports, outreach sequences, and more — all grounded in your actual business context, not generic outputs.",
  },
  {
    number: "04",
    title: "Iterate",
    heading: "Continuously Improve Through Insights",
    description:
      "Every agent interaction feeds back into the context layer. Agents identify patterns, surface opportunities, and refine their approach. Your digital workforce gets smarter every day.",
  },
];

export function ProcessStepper() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <Section variant="surface">
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-bold text-center mb-16 uppercase tracking-tight">
            How It Works
          </h2>
        </FadeUp>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => setActiveStep(i)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 transition-all font-mono",
                  i === activeStep
                    ? "text-circuit text-glow"
                    : "text-text-muted hover:text-text"
                )}
              >
                <span className="text-sm font-bold">{step.number}</span>
                <span className="hidden sm:inline text-xs uppercase tracking-wider">
                  {step.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 md:w-16 h-px mx-1",
                    i < activeStep ? "bg-circuit" : "bg-[rgba(255,255,255,0.05)]"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Active step content */}
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-semibold text-text mb-4">
            {steps[activeStep].heading}
          </h3>
          <p className="text-text-muted leading-relaxed">
            {steps[activeStep].description}
          </p>
        </div>
      </Container>
    </Section>
  );
}
