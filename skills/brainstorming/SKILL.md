---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
version: 1.0.0
dependencies: ["git"]
---

# Brainstorming Ideas Into Designs

## 🎯 Triggers
- "Let's brainstorm ideas for..."
- "I need to design a new feature..."
- "Help me plan the implementation of..."
- "Before we start coding, let's explore..."
- "I have an idea, can you help me flesh it out?"

## ⚡ Quick Start (Self-Check)
Before starting any brainstorming session, verify readiness:
- [ ] Run `bash ~/.gemini/skills/brainstorming/test.sh` to check dependencies.
- [ ] Ensure you have access to the project context (files, docs, recent commits).

## 📋 Workflow

### 1. **Ingest: Understand the Idea**
- Analyze the current project state (files, documentation, recent commits)
- Ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible
- Focus on understanding: purpose, constraints, success criteria

### 2. **Execute: Explore Approaches**
- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

### 3. **Verify: Present and Validate Design**
- Once you understand what you're building, present the design
- Break it into sections of 200-300 words
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

## 🤖 System Instructions

### Key Principles
- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design in sections, validate each
- **Be flexible** - Go back and clarify when something doesn't make sense

### After the Design

**Documentation:**
- Write the validated design to `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Use clear, concise writing skills if available
- Commit the design document to git

**Implementation (if continuing):**
- Ask: "Ready to set up for implementation?"
- Create an isolated workspace for implementation
- Create a detailed implementation plan

## 🛠️ Script Reference
- Use `templates/` for design document templates
- Use `scripts/` for any automation scripts

