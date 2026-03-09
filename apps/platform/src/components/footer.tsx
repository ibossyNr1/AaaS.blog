import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Platform: [
    { label: "Platform", href: "/platform" },
    { label: "How it works", href: "/platform#how-it-works" },
  ],
  Pricing: [
    { label: "Retainer", href: "/pricing#retainer" },
    { label: "Pay-per-task", href: "/pricing#pay-per-task" },
    { label: "Build with AaaS", href: "/pricing#build" },
  ],
  Projects: [{ label: "Enora.ai", href: "/projects#enora" }],
  Vault: [
    { label: "Browse", href: "/vault" },
    { label: "Search", href: "/vault#search" },
  ],
  Collaborate: [
    { label: "Invest", href: "/collaborate#invest" },
    { label: "Co-innovate", href: "/collaborate#co-innovate" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.05)] bg-base py-16 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/studio-1743338608-800f1.firebasestorage.app/o/Logos%2FAaaS.Points.png?alt=media"
                alt="AaaS"
                width={24}
                height={24}
                className="rounded"
              />
              <span className="font-mono text-xs uppercase tracking-widest text-text">
                AaaS
              </span>
            </Link>
            <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
              Autonomous Digital Workforce
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-mono text-xs font-medium text-circuit uppercase tracking-wider mb-3">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-mono text-xs text-text-muted hover:text-circuit hover:text-glow transition-all"
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
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-4">
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
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-circuit transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-circuit transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="font-mono text-xs text-text-muted">
            SYS_LOG: &copy; {new Date().getFullYear()} Agent-as-a-Service // UPTIME: 99.9999992%
          </p>
        </div>
      </div>
    </footer>
  );
}
