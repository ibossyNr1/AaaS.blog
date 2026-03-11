import { Container, Section } from "@aaas/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-text mb-4">404</h1>
        <p className="text-text-muted mb-6">Entity not found in the Knowledge Index.</p>
        <Link href="/" className="text-sm text-circuit hover:underline font-mono">
          Return to Index →
        </Link>
      </Container>
    </Section>
  );
}
