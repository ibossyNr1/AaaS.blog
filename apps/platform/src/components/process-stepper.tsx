"use client";

import { useState } from "react";
import { Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "./motion";
import { VideoPlayer } from "./video-player";

const steps = [
  {
    number: "01",
    title: "Define",
    heading: "Establish Your Strategic Foundations",
    description:
      "We map your vision, mission, values, target audience, competitive landscape, and strategic goals. This becomes the immutable foundation that every agent references — your business DNA, encoded for machines.",
    detail: "Duration: 1-2 sessions // Output: Structured context JSON",
  },
  {
    number: "02",
    title: "Structure",
    heading: "Convert Knowledge to Machine-Readable Data",
    description:
      "Qualitative business knowledge gets transformed into structured, agent-consumable context — brand voice matrices, customer personas, product specs, market positioning frameworks. Agents don't guess; they know.",
    detail: "Duration: 2-3 days // Output: Context Engine deployment",
  },
  {
    number: "03",
    title: "Create",
    heading: "Generate With Full Context",
    description:
      "Agents produce marketing copy, sales materials, research reports, outreach sequences, compliance audits, and more — all grounded in your actual business context. Every output sounds like you, thinks like you, operates like you.",
    detail: "Duration: Ongoing // Output: Production-grade deliverables",
  },
  {
    number: "04",
    title: "Iterate",
    heading: "Continuously Improve Through Insights",
    description:
      "Every agent interaction feeds back into the context layer. Agents identify patterns, surface opportunities, and refine their approach. Your digital workforce gets smarter every day — not just incrementally, but compounding.",
    detail: "Duration: Continuous // Output: Self-optimizing workflows",
  },
];

export function ProcessStepper() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <Section variant="surface" divider="red">
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-black text-center mb-16 uppercase tracking-tight">
            How It Works
          </h2>
        </FadeUp>

        {/* Step indicators with circuit line */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center">
              <button
                onClick={() => setActiveStep(i)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 transition-all duration-500 ease-liquid font-mono group",
                  i === activeStep
                    ? "text-circuit"
                    : "text-text-muted hover:text-text"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-500",
                  i === activeStep
                    ? "border-circuit bg-circuit/10 text-circuit shadow-[0_0_15px_var(--circuit-dim)]"
                    : i < activeStep
                    ? "border-circuit/30 bg-circuit/5 text-circuit/60"
                    : "border-border bg-transparent"
                )}>
                  {step.number}
                </span>
                <span className="hidden sm:inline text-xs uppercase tracking-wider">
                  {step.title}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className="relative w-8 md:w-16 h-px mx-1">
                  <div className="absolute inset-0 bg-border" />
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 bg-circuit transition-all duration-700 ease-liquid",
                      i < activeStep ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Active step content */}
        <div className={cn(
          "max-w-4xl mx-auto",
          activeStep === 0 ? "flex flex-col md:flex-row items-center gap-8 md:gap-12" : "text-center max-w-2xl"
        )}>
          {activeStep === 0 && (
            <FadeUp className="shrink-0">
              <VideoPlayer
                storagePath="Video/Jor_Intro_S.mp4"
                token="0d09aaac-cb46-4840-a736-96f16bf76fe3"
                aspect="aspect-square"
                buttonSize="sm"
                className="w-48 h-48 md:w-64 md:h-64 shadow-xl border border-border rounded-xl"
              />
            </FadeUp>
          )}
          <div className={cn(activeStep !== 0 && "mx-auto")}>
            <h3 className="text-2xl font-semibold text-text mb-4">
              {steps[activeStep]!.heading}
            </h3>
            <p className="text-text-muted leading-relaxed mb-6">
              {steps[activeStep]!.description}
            </p>
            <p className="font-mono text-xs text-circuit/60 uppercase tracking-wider">
              {steps[activeStep]!.detail}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
