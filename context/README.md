# Context Layer

**Purpose:** The `context/` folder contains read-only project memory that grounds agent decisions.

## What Goes Here?

Context files define the **WHO** and **CONSTRAINTS** of your project:

- **Brand Voice:** `brand.md` - Tone, messaging, visual identity
- **Project Goals:** `goals.md` - Success metrics, KPIs, milestones
- **Domain Knowledge:** Custom files for industry-specific constraints

## How Agents Use Context

According to AGENTS.MD:

> Before starting any task, **SCAN** the `context/` folder.
> - If the task is "Write an email", read `context/brand_voice.md` first.
> - If the task is "Analyze data", read `context/kpis.md` first.
> - **Rule:** Context trumps general knowledge, but Directive trumps Context.

## File Hygiene

- ✅ **Static, curated content** (brand guidelines, project constraints)
- ❌ **Generated outputs** → These go to Cloud (Google Sheets/Docs)
- ❌ **Temporary data** → Use `.tmp/` instead

## Examples

- `context/brand.md` - Brand voice for all communications
- `context/goals.md` - Current project objectives
- `context/kpis.md` - Key performance indicators
- `context/compliance.md` - Regulatory requirements
