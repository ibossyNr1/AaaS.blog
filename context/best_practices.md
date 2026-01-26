# Best Practices & Strategic Knowledge

**Purpose:** This file grounds agentic decisions in high-level strategic frameworks for architecture, product growth (PLG), and modularity.

---

## 🏗️ 1. Architecture (Design of Environment - DOE)

The **DOE framework** treats the agent's workspace as a living, self-evolving system.

### Key Workflows
- **Self-Evolution via `/wrap-up`**: Every session must conclude with a `/wrap-up` where the agent reflects on successes, failures, and "lessons learned".
- **Persistent Memory (`memory.md`)**: Learnings from the wrap-up are appended to `.context/memory.md`. Agents **MUST** read this file at startup to inherit the wisdom of previous sessions.
- **Deterministic Delegation**: Avoid asking the LLM to perform complex, multi-step logic (e.g., migrations, heavy scraping) in-stream. Delegate these to standalone Python/Bash scripts in `execution/` or `skills/*/scripts/`.

---

## 🚀 2. Product-Led Growth (PLG) & UX

When building or advising on user-facing features, prioritize these "Pricing & Onboarding Levers":

### Growth Levers
- **Value-Based Pricing (VBP)**: Align costs with business outcomes, not internal compute costs.
- **Usage-Based Pricing (UBP)**: Hybrid models correlate with higher NRR (aim for **120–130%**).
- **The 1% Pricing Optimization**: A 1% improvement in pricing can boost profits by **~11%**.

### Onboarding & UX
- **Gamification**: Use progress bars, milestones, and "quick win" rewards to reduce time-to-value.
- **Progressive Disclosure**: Show only the UI/instructions needed for the current step. Do not overwhelm the user with the full feature set at once.
- **LTV/CAC Ratio**: Aim for a **3:1** minimum; top-tier is **4:1+**.

---

## 🛠️ 3. Modular Capability Standards (Ultimate Skills)

To prevent context window bloat, skills follow the **Progressive Disclosure** pattern.

### Skill Formatting
- **YAML Frontmatter**: The `SKILL.md` file MUST start with a YAML block describing its trigger keywords.
- **Portable Directory**: Each skill is a self-contained folder:
  - `SKILL.md`: The "brain" (instructions).
  - `scripts/`: The "hands" (execution logic).
  - `resources/`: The "memory" (API docs/specs).
- **Metacognitive Monitoring**: Skills should include validation steps (e.g., taking a screenshot after a UI change) to ensure high-reliability execution.

---

## 📋 4. Strategic KPI Benchmarks

| Metric | Target | Frequency |
|--------|--------|-----------|
| **NRR (Net Revenue Retention)** | 120%+ | Quarterly |
| **Expansion Revenue** | 30% of total | Monthly |
| **CAC Payback** | < 12 Months | Continuous |
| **Free-to-Paid Conversion** | 15–30% | Monthly |

---

**Last Updated:** 2026-01-26  
**Sources:** Google NotebookLM (AntiGravity, PLG & UX, Agentic Skills)
