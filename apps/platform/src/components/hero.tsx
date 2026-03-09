import { Button, Card, Container, Section } from "@aaas/ui";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const statusCards = [
  { label: "Processing Latency", value: "0.002ms" },
  { label: "Active Instances", value: "4,812 / \u221E" },
  { label: "Neural Density", value: "98.4%" },
];

export function Hero() {
  return (
    <Section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <Container className="relative z-10 max-w-[1600px]">
        <div className="relative">
          {/* Monolith Title */}
          <h1 className="monolith-title text-[clamp(4rem,12vw,10rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-8">
            CARVED<br />LOGIC
          </h1>

          <p className="max-w-lg text-lg text-text/70 font-light leading-relaxed">
            High-fidelity autonomous agents forged in basalt-grade reliability.
            Deploy scalable intelligence across private circuitry.
          </p>

          {/* Status Cards */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-16 mt-16">
            {statusCards.map((card) => (
              <Card key={card.label} carved className="flex-1">
                <span className="font-mono text-[0.65rem] text-circuit uppercase tracking-wider block mb-4">
                  {card.label}
                </span>
                <span className="text-2xl font-medium text-text">
                  {card.value}
                </span>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 flex flex-wrap gap-4">
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button size="lg">Initialize System</Button>
            </a>
            <a href="/platform">
              <Button variant="secondary" size="lg">
                Explore Platform
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
