import { Button, Card, Container, Section, Badge } from "@aaas/ui";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const statusCards = [
  { label: "Extract", value: "Strategic Fundamentals", icon: "01" },
  { label: "Map", value: "Context into AI Workflows", icon: "02" },
  { label: "Deploy", value: "Proprietary Tools & Agents", icon: "03" },
];

export function Hero() {
  return (
    <Section className="relative pt-32 pb-24 overflow-hidden">
      {/* Dual accent glows */}
      <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-accent-red/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <Container className="relative z-10 max-w-[1600px]">
        <div className="relative">
          {/* System status badge */}
          <Badge className="mb-6 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse-dot inline-block mr-2" />
            System Online — 12 Agents Active
          </Badge>

          {/* Monolith Title */}
          <h1 className="monolith-title text-[clamp(4rem,12vw,10rem)] font-black leading-[0.85] tracking-[-0.04em] uppercase mb-8">
            CONTEXT<br />IS KING
          </h1>

          <p className="max-w-lg text-lg leading-relaxed mb-4">
            <span className="font-bold text-text">Your business context, structured for machines.</span>
            <br />
            <span className="text-text/50 font-light">
              Deploy autonomous AI agents that truly understand your strategy,
              brand, market, and operations — then execute with surgical precision.
            </span>
          </p>

          {/* Outline accent text */}
          <p className="outline-text text-[clamp(1.5rem,4vw,3rem)] font-black uppercase tracking-tight mb-12 opacity-30">
            Autonomous Digital Workforce
          </p>

          {/* Status Cards — Glass variant */}
          <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 mt-8">
            {statusCards.map((card) => (
              <Card
                key={card.label}
                variant="glass"
                spotlight
                className="flex-1 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-[0.65rem] text-circuit uppercase tracking-wider">
                    {card.label}
                  </span>
                  <span className="font-mono text-[0.55rem] text-text-muted">
                    {card.icon}
                  </span>
                </div>
                <span className="text-xl font-medium text-text leading-tight">
                  {card.value}
                </span>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 flex flex-wrap gap-4">
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="red" size="lg">Initialize System</Button>
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
