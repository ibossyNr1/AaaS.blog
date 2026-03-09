import { Badge, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

export function ValueStrip() {
  return (
    <Section variant="surface">
      <Container className="text-center">
        <FadeUp>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge>Context Engineering</Badge>
            <Badge>Tool Connectivity</Badge>
            <Badge>Agentic Work</Badge>
          </div>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            AaaS transforms your business strategy into structured context that
            powers a continuously evolving network of AI agents — so they
            actually understand your business.
          </p>
        </FadeUp>
      </Container>
    </Section>
  );
}
