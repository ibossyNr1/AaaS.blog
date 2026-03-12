"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { OrbitalBackground } from "@/components/orbital-background";

interface PitchBlock {
  type: "title" | "heading" | "paragraph" | "accent";
  text: string;
}

interface Persona {
  id: string;
  label: string;
  icon: string;
  audio: string;
  duration: number;
  pitch: PitchBlock[];
}

const PERSONAS: Persona[] = [
  {
    id: "general",
    label: "Overview",
    icon: "◎",
    audio: "/audio/aaas-pitch-kokoro.mp3",
    duration: 137,
    pitch: [
      { type: "title", text: "AGENTS AS A SERVICE" },
      { type: "accent", text: "Every business runs on context.\nThe problem is — your AI doesn't have any." },
      { type: "paragraph", text: "Your strategy lives in documents nobody reads. Your brand voice lives in one person's head. Your industry knowledge lives in tribal memory. Your competitive edge lives in spreadsheets that expire quarterly." },
      { type: "accent", text: "Agents as a Service changes this." },
      { type: "paragraph", text: "The system takes your business DNA — vision, brand, market positioning, competitive landscape, operational knowledge — and encodes it into structured context that machines can actually use." },
      { type: "paragraph", text: "Then it deploys autonomous AI agents that don't guess. They know." },
      { type: "heading", text: "The Process" },
      { type: "paragraph", text: "The process is systematic. Goal. Research. Requirements. Context definition. Production. Each step feeds the next — building intelligence through structure, not just prompting." },
      { type: "heading", text: "For Founders" },
      { type: "paragraph", text: "Stop briefing freelancers. Stop correcting AI outputs. Your agents produce marketing, sales materials, research, and operational workflows that sound like you, think like you, and execute like your best people — at machine scale. Template-based systems route your work to the best agentic processes with the biggest toolset available." },
      { type: "heading", text: "For Partners & Ambassadors" },
      { type: "paragraph", text: "White-label the platform. Co-brand agent workforces for your clients. Every methodology you've built becomes an automated, scalable service. Your expertise, multiplied." },
      { type: "heading", text: "For Investors" },
      { type: "paragraph", text: "This is the infrastructure layer between business strategy and AI execution. Every company needs it. Nobody else is building it. Context is the moat — and the system owns the encoding. Today, ninety-nine percent of users only prompt in LLM chats. Agents as a Service delivers full agentic execution." },
      { type: "accent", text: "The convergence model is simple." },
      { type: "paragraph", text: "Brand. Context. Industry. Strategy. Four dimensions orbiting a single autonomous core. When they converge, AI doesn't just execute — it understands." },
      { type: "accent", text: "This is not another AI tool.\nThis is the operating system for your autonomous workforce." },
      { type: "title", text: "Welcome to\nAgents as a Service." },
    ],
  },
  {
    id: "founder",
    label: "Founders",
    icon: "⚡",
    audio: "/audio/aaas-pitch-founder.mp3",
    duration: 109,
    pitch: [
      { type: "title", text: "BUILT FOR FOUNDERS" },
      { type: "accent", text: "You didn't start a company to brief freelancers.\nYou didn't raise capital to manually correct AI outputs." },
      { type: "paragraph", text: "And you definitely didn't sacrifice your weekends to babysit chatbots." },
      { type: "heading", text: "The Problem" },
      { type: "paragraph", text: "Your strategy lives in documents nobody reads. Your brand voice lives in your head. Your competitive edge lives in spreadsheets that expire quarterly. Every time you hand work to AI, you spend more time fixing it than doing it yourself." },
      { type: "accent", text: "Agents as a Service changes this." },
      { type: "paragraph", text: "The system takes your business DNA — your vision, your brand, your market positioning, your operational knowledge — and encodes it into structured context that machines can actually use. Not prompts. Not templates. Structured intelligence." },
      { type: "paragraph", text: "Then it deploys autonomous AI agents that don't guess. They know." },
      { type: "heading", text: "The Process" },
      { type: "paragraph", text: "The process is systematic. Goal. Research. Requirements. Context definition. Production. Each step feeds the next. Your agents produce marketing, sales materials, research, and operational workflows that sound like you, think like you, and execute like your best people — at machine scale." },
      { type: "paragraph", text: "Template-based systems route your work to the best agentic processes with the biggest toolset available. No more prompt engineering. No more copy-paste workflows. No more hoping the AI gets it right." },
      { type: "accent", text: "Today, ninety-nine percent of users\nonly prompt in LLM chats." },
      { type: "paragraph", text: "You're not ninety-nine percent. You need full agentic execution." },
      { type: "paragraph", text: "Stop being the bottleneck in your own company. Let your agents handle the execution while you focus on what only you can do — leading." },
      { type: "title", text: "Welcome to\nAgents as a Service." },
    ],
  },
  {
    id: "investor",
    label: "Investors",
    icon: "📊",
    audio: "/audio/aaas-pitch-investor.mp3",
    duration: 128,
    pitch: [
      { type: "title", text: "THE INVESTMENT THESIS" },
      { type: "accent", text: "Every company is about to need\nan AI operations layer." },
      { type: "paragraph", text: "Not another chatbot. Not another copilot. An infrastructure layer between business strategy and AI execution. That's Agents as a Service." },
      { type: "heading", text: "Market Reality" },
      { type: "paragraph", text: "Enterprises are spending billions on AI tools, but ninety-nine percent of users only prompt in LLM chats. They copy, they paste, they hope for the best. There's no structured context. No persistent intelligence. No autonomous execution." },
      { type: "accent", text: "The gap between what AI can do\nand what businesses actually get from it —\nthat's the opportunity." },
      { type: "heading", text: "The Encoding Layer" },
      { type: "paragraph", text: "Agents as a Service owns the encoding layer. The system takes a company's business DNA — vision, brand, market positioning, competitive landscape, operational knowledge — and encodes it into structured context that machines can actually use." },
      { type: "paragraph", text: "Then it deploys autonomous AI agents that execute with full business understanding. Not generic responses. Contextual, branded, strategically aligned output at machine scale." },
      { type: "heading", text: "Convergence Model" },
      { type: "paragraph", text: "Brand. Context. Industry. Strategy. Four dimensions orbiting a single autonomous core. When they converge, AI doesn't just execute — it understands." },
      { type: "heading", text: "The Moat" },
      { type: "paragraph", text: "The moat is the context encoding. Every client that onboards deepens the system's structured intelligence. Every workflow that runs generates compounding returns. This is not a feature — it's infrastructure." },
      { type: "paragraph", text: "Template-based systems route work to the best agentic processes with the biggest toolset available. The process is systematic. Goal. Research. Requirements. Context definition. Production. Each step feeds the next, building intelligence through structure." },
      { type: "accent", text: "Every company needs this.\nNobody else is building it." },
      { type: "paragraph", text: "Context is the moat — and the system owns the encoding." },
      { type: "title", text: "Welcome to\nAgents as a Service." },
    ],
  },
  {
    id: "business",
    label: "Business Owners",
    icon: "🏢",
    audio: "/audio/aaas-pitch-business.mp3",
    duration: 115,
    pitch: [
      { type: "title", text: "FOR BUSINESS OWNERS" },
      { type: "accent", text: "You've built something real." },
      { type: "paragraph", text: "A business with customers, a reputation, operational knowledge that took years to develop. Now AI promises to multiply your output — but every tool you try needs constant hand-holding." },
      { type: "heading", text: "The Problem Is Context" },
      { type: "paragraph", text: "Your AI doesn't know your business. It doesn't know your customers. It doesn't know your industry. Every prompt starts from zero." },
      { type: "accent", text: "Agents as a Service solves this permanently." },
      { type: "paragraph", text: "The system takes everything that makes your business unique — your brand voice, your service standards, your market positioning, your operational workflows — and encodes it into structured context that AI agents can actually use." },
      { type: "heading", text: "Not Chatbots — Agents" },
      { type: "paragraph", text: "These are autonomous agents that understand your business as well as your best employee. They produce marketing that sounds like you. Customer communications that reflect your standards. Research that knows your competitive landscape. Operational documents that follow your processes." },
      { type: "heading", text: "The Process" },
      { type: "paragraph", text: "Define your goal. The system researches, gathers requirements, builds context, and produces results. Each step feeds the next, building intelligence through structure, not just prompting." },
      { type: "paragraph", text: "Template-based systems route your work to the best agentic processes available. No technical expertise required. No prompt engineering. No AI knowledge needed." },
      { type: "accent", text: "Stop adapting your business to AI.\nLet AI adapt to your business." },
      { type: "title", text: "Welcome to\nAgents as a Service." },
    ],
  },
  {
    id: "user",
    label: "Individual Users",
    icon: "👤",
    audio: "/audio/aaas-pitch-user.mp3",
    duration: 100,
    pitch: [
      { type: "title", text: "FOR INDIVIDUAL USERS" },
      { type: "accent", text: "You've tried the AI tools.\nChatGPT, Claude, Gemini — you've prompted them all." },
      { type: "paragraph", text: "Sometimes the results are great. Mostly, you spend more time refining outputs than you save." },
      { type: "heading", text: "Why It Fails" },
      { type: "paragraph", text: "Every conversation starts from zero. The AI doesn't remember your preferences. It doesn't know your writing style. It doesn't understand your industry. You're doing the same setup work, every single time." },
      { type: "accent", text: "Agents as a Service is different." },
      { type: "paragraph", text: "The system learns your context once — your goals, your style, your domain expertise, your preferences — and deploys personal AI agents that already know you. Not a chat window. A personal workforce." },
      { type: "heading", text: "Your Personal Agents" },
      { type: "paragraph", text: "Need a research report? Your agent knows what sources you trust, what format you prefer, what depth you need. Need marketing copy? Your agent writes in your voice, not generic AI-speak. Need a strategy document? Your agent understands your market and your position in it." },
      { type: "heading", text: "The Process" },
      { type: "paragraph", text: "Set your goal. Your agents handle the research, requirements, context, and production. Each step builds on the last — creating results that get better over time, not just per-prompt." },
      { type: "accent", text: "Stop prompting.\nStart delegating." },
      { type: "title", text: "Welcome to\nAgents as a Service." },
    ],
  },
  {
    id: "partner",
    label: "Partners",
    icon: "🤝",
    audio: "/audio/aaas-pitch-partner.mp3",
    duration: 114,
    pitch: [
      { type: "title", text: "FOR PARTNERS &\nAMBASSADORS" },
      { type: "accent", text: "You've built methodologies.\nFrameworks. Consulting playbooks\nthat deliver real results." },
      { type: "paragraph", text: "Your expertise is your competitive advantage — but it doesn't scale. You can only serve so many clients. You can only train so many teams." },
      { type: "accent", text: "Agents as a Service changes\nthe economics entirely." },
      { type: "heading", text: "White-Label & Scale" },
      { type: "paragraph", text: "White-label the platform. Co-brand autonomous agent workforces for your clients. Every methodology you've built becomes an automated, scalable service. Your expertise, multiplied — without multiplying your headcount." },
      { type: "heading", text: "How It Works" },
      { type: "paragraph", text: "The system takes your proprietary frameworks — your consulting methodology, your industry knowledge, your best practices — and encodes them into structured context. Then it deploys autonomous AI agents that execute your methodology at machine scale." },
      { type: "paragraph", text: "Your clients get your expertise delivered through AI agents that actually understand the framework. Not generic AI output. Your methodology, your standards, your quality — automated." },
      { type: "heading", text: "The Process" },
      { type: "paragraph", text: "Goal. Research. Requirements. Context definition. Production. Each step follows your framework, building intelligence through the structure you've already proven works." },
      { type: "paragraph", text: "Template-based systems route client work to the best agentic processes with the biggest toolset available. You define the templates. You control the quality. The system handles the scale." },
      { type: "accent", text: "Your expertise is the moat.\nAgents as a Service is the multiplier." },
      { type: "title", text: "Welcome to\nthe partnership." },
    ],
  },
];

export function DeliveryClient() {
  const [personaId, setPersonaId] = useState("general");
  const [scrolling, setScrolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  const persona = PERSONAS.find((p) => p.id === personaId)!;

  const stopScroll = useCallback(() => {
    setScrolling(false);
    cancelAnimationFrame(animRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setProgress(0);
    if (scrollRef.current) {
      scrollRef.current.style.transform = "translateY(0)";
    }
  }, []);

  const startScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setScrolling(true);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    const scrollEl = scrollRef.current;
    const totalDistance = scrollEl.scrollHeight - window.innerHeight + 200;
    const duration = persona.duration;
    startTimeRef.current = performance.now();

    function animate(now: number) {
      const elapsed = (now - startTimeRef.current) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const eased =
        t < 0.05
          ? t * 20 * t
          : t > 0.95
            ? 1 - (1 - t) * 20 * (1 - t)
            : t;

      const y = eased * totalDistance;
      scrollEl.style.transform = `translateY(-${y}px)`;
      setProgress(t);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setScrolling(false);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, [persona.duration]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && scrolling) stopScroll();
      if (e.key === " " && !scrolling) {
        e.preventDefault();
        startScroll();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [scrolling, startScroll, stopScroll]);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <>
      <OrbitalBackground />
      <audio ref={audioRef} src={persona.audio} preload="auto" />

      {/* Controls — visible when not scrolling */}
      {!scrolling && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 animate-fade-up">
          {/* Persona selector */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonaId(p.id)}
                className={`glass rounded-full px-4 py-2 border text-xs font-mono uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                  personaId === p.id
                    ? "border-circuit/40 text-circuit shadow-[0_0_12px_var(--circuit-dim)]"
                    : "border-border/30 text-text-muted hover:border-circuit/20 hover:text-text"
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Play button */}
          <button
            onClick={startScroll}
            className="group glass rounded-full px-8 py-4 border border-circuit/20 flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_var(--circuit-dim)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-circuit"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span className="font-mono text-sm uppercase tracking-wider text-text">
              Start Pitch
            </span>
          </button>
          <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
            or press Space
          </span>
        </div>
      )}

      {/* Stop button + progress — visible while scrolling */}
      {scrolling && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
          <button
            onClick={stopScroll}
            className="glass rounded-full px-6 py-3 border border-accent-red/20 flex items-center gap-2 transition-all duration-300 hover:scale-105"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-accent-red"
            >
              <path d="M6 6h12v12H6z" />
            </svg>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Stop
            </span>
          </button>
          <div className="w-48 h-[2px] bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-circuit transition-[width] duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Scrolling content */}
      <div className="relative z-10 min-h-screen flex items-end justify-center overflow-hidden">
        <div
          ref={scrollRef}
          className="max-w-2xl mx-auto px-6 pt-[100vh] pb-[60vh] text-center"
          style={{ willChange: scrolling ? "transform" : "auto" }}
        >
          {persona.pitch.map((block, i) => {
            if (block.type === "title") {
              return (
                <h1
                  key={i}
                  className="monolith-title text-[clamp(2.5rem,8vw,5rem)] font-black leading-[0.9] tracking-[-0.04em] uppercase mb-16 whitespace-pre-line"
                >
                  {block.text}
                </h1>
              );
            }
            if (block.type === "heading") {
              return (
                <h2
                  key={i}
                  className="font-mono text-sm uppercase tracking-[0.4em] text-circuit mt-20 mb-6"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "accent") {
              return (
                <p
                  key={i}
                  className="text-2xl md:text-3xl font-light text-text leading-relaxed mb-12 whitespace-pre-line"
                >
                  {block.text}
                </p>
              );
            }
            return (
              <p
                key={i}
                className="text-lg text-text-muted leading-relaxed mb-10 max-w-xl mx-auto"
              >
                {block.text}
              </p>
            );
          })}
        </div>
      </div>
    </>
  );
}
