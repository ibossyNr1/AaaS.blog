import Link from "next/link";
import Image from "next/image";
import { KineticBar } from "@aaas/ui";

const footerLinks = {
  Platform: [
    { label: "Platform", href: "/platform" },
    { label: "How it works", href: "/platform#how-it-works" },
    { label: "Capabilities", href: "/platform#capabilities" },
    { label: "Model Selection", href: "/platform#models" },
  ],
  Pricing: [
    { label: "Retainer", href: "/pricing#retainer" },
    { label: "Pay-per-task", href: "/pricing#pay-per-task" },
    { label: "Build with AaaS", href: "/pricing#build" },
    { label: "FAQ", href: "/pricing#faq" },
  ],
  Projects: [
    { label: "Enora-AI", href: "/projects#enora" },
    { label: "Vault", href: "/vault" },
    { label: "Skill Repository", href: "/vault#skills" },
  ],
  Collaborate: [
    { label: "Invest", href: "/collaborate#invest" },
    { label: "Co-innovate", href: "/collaborate#co-innovate" },
    { label: "Ambassador Program", href: "/collaborate#ambassador" },
  ],
};

export function Footer() {
  return (
    <>
      <KineticBar />
      <footer className="bedrock py-16 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4 group">
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/studio-1743338608-800f1.firebasestorage.app/o/Logos%2FAaaS.Points.png?alt=media"
                  alt="AaaS"
                  width={24}
                  height={24}
                  className="rounded"
                />
                <span className="font-mono text-xs uppercase tracking-widest text-text group-hover:text-circuit transition-colors">
                  AaaS
                </span>
              </Link>
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider mb-4">
                Autonomous Digital Workforce
              </p>
              <p className="font-mono text-[10px] text-text-muted/50 leading-relaxed">
                Context-engineered intelligence forged in basalt-grade reliability.
              </p>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-mono text-xs font-medium text-circuit uppercase tracking-wider mb-4">
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="font-mono text-xs text-text-muted hover:text-circuit hover:text-glow transition-all duration-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <KineticBar variant="red" className="my-8" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 font-mono text-xs text-text-muted">
              <a
                href="https://aaas.blog"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-circuit transition-colors"
              >
                Blog
              </a>
              <a
                href="https://www.linkedin.com/company/agents-as-a-service-com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-circuit transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://www.supra-forge.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-circuit transition-colors"
              >
                SupraForge
              </a>
            </div>
            <p className="font-mono text-[10px] text-text-muted/60">
              SYS_LOG: &copy; {new Date().getFullYear()} Agent-as-a-Service // UPTIME: 99.9999992% // AaaS Framework v2.4
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
