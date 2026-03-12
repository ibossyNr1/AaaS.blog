import { OrbitalBackground } from "@/components/orbital-background";
import { Hero } from "@/components/hero";
import { ValueStrip } from "@/components/value-strip";
import { ThreePillars } from "@/components/three-pillars";
import { ProcessStepper } from "@/components/process-stepper";
import { UseCases } from "@/components/use-cases";
import { LiveFeeds } from "@/components/live-feeds";
import { MetricsStrip } from "@/components/metrics-strip";
import { CTABlock } from "@/components/cta-block";

export default function Home() {
  return (
    <>
      <OrbitalBackground minimal planetScale={25} offset={{ x: 25, y: 10 }} />
      {/* Hero has no overlay — planet visible behind it */}
      <Hero />
      {/* Remaining sections get parallax overlay so content is readable
          but planet bleeds through the semi-transparent backgrounds */}
      <div className="relative z-10 parallax-sections">
        <ValueStrip />
        <ThreePillars />
        <ProcessStepper />
        <UseCases />
        <LiveFeeds />
        <MetricsStrip />
        <CTABlock />
      </div>
    </>
  );
}
