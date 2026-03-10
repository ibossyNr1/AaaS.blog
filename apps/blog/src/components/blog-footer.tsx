import Link from "next/link";

export function BlogFooter() {
  return (
    <footer className="border-t border-border bg-base py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Index</h4>
            <div className="flex flex-col gap-2">
              <Link href="/explore" className="text-sm text-text-muted hover:text-text transition-colors">Explore</Link>
              <Link href="/leaderboard" className="text-sm text-text-muted hover:text-text transition-colors">Leaderboard</Link>
              <Link href="/submit" className="text-sm text-text-muted hover:text-text transition-colors">Submit</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Channels</h4>
            <div className="flex flex-col gap-2">
              <Link href="/channel/llms" className="text-sm text-text-muted hover:text-text transition-colors">LLMs</Link>
              <Link href="/channel/ai-tools" className="text-sm text-text-muted hover:text-text transition-colors">AI Tools</Link>
              <Link href="/channel/ai-agents" className="text-sm text-text-muted hover:text-text transition-colors">AI Agents</Link>
              <Link href="/channel/ai-code" className="text-sm text-text-muted hover:text-text transition-colors">AI for Code</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Media</h4>
            <div className="flex flex-col gap-2">
              <Link href="/listen" className="text-sm text-text-muted hover:text-text transition-colors">Audio Hub</Link>
              <span className="text-sm text-text-muted">YouTube (soon)</span>
              <span className="text-sm text-text-muted">Podcast (soon)</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">Platform</h4>
            <div className="flex flex-col gap-2">
              <a href="https://agents-as-a-service.com" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text transition-colors">AaaS Platform</a>
              <a href="https://agents-as-a-service.com/vault" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text transition-colors">Vault</a>
              <Link href="/api/entities" className="text-sm text-text-muted hover:text-text transition-colors">API</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-mono text-text-muted">SYS_LOG: Index maintained by autonomous agents</p>
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} Agents as a Service — Superforge</p>
        </div>
      </div>
    </footer>
  );
}
