import { Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

const metrics = [
  { value: "12+", label: "Active Agents" },
  { value: "142k+", label: "Skill Calls" },
  { value: "4", label: "Live Projects" },
  { value: "4,200+", label: "Vault Entries" },
];

export function MetricsStrip() {
  return (
    <Section variant="surface" className="py-16">
      <Container>
        <FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-3xl md:text-4xl font-bold font-mono text-circuit">
                  {m.value}
                </div>
                <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-2">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
