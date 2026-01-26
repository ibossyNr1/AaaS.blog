#!/usr/bin/env python3
"""
Project Initialization Script

Use this script to "RESET" the Base directory when starting a NEW project.
It clears project-specific data while keeping the engine/infrastructure intact.

Usage:
  python3 execution/init_new_project.py
"""

import os
import shutil
from pathlib import Path

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent
CONTEXT_DIR = BASE_DIR / "context"
TMP_DIR = BASE_DIR / ".tmp"
EXECUTION_DIR = BASE_DIR / "execution"

# Templates for reset
GOALS_TEMPLATE = """# Project Goals & Success Metrics

> **Instructions for Agents:** Read this file before making strategic decisions or prioritizing work.

---

## Current Sprint Goals (Example)

### Primary Objective
- **Goal:** [Describe the main goal here]
- **Deadline:** [YYYY-MM-DD]
- **Owner:** [Team/Person]

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## Key Performance Indicators (KPIs)

| Metric | Current | Target | Deadline |
|--------|---------|--------|----------|
| Example Metric | 0 | 100 | Q1 |

---

## Strategic Priorities

1. Priority 1
2. Priority 2
3. Priority 3

---

## Constraints & Trade-offs

- **Budget:** ...
- **Technical Debt:** ...
- **Compliance:** ...

---

**Last Updated:** [Date]
"""

BRAND_TEMPLATE = """# Brand Voice & Identity

> **Instructions for Agents:** Read this file before generating any external communications (emails, marketing copy, social posts, documentation).

---

## Brand Voice

### Tone
- **Example:** Professional yet approachable, technical but accessible
- **Adjust:** Update this to match your brand's personality

### Messaging Principles
1. **Clarity**
2. **Authenticity**
3. **Value-driven**

---

## Visual Identity

### Colors
- Primary: [Hex Code]
- Secondary: [Hex Code]

### Typography
- Headings: [Font Name]
- Body: [Font Name]

---

## Writing Style

### Do's
- Use active voice
- Be concise

### Don'ts
- No jargon
- No fluff

---

**Last Updated:** [Date]
"""

WEBHOOKS_TEMPLATE = "{}"


def reset_context():
    """Resets context/goals.md and context/brand.md to templates."""
    print("🔄 Resetting Context...")
    
    goals_path = CONTEXT_DIR / "goals.md"
    brand_path = CONTEXT_DIR / "brand.md"
    
    with open(goals_path, "w") as f:
        f.write(GOALS_TEMPLATE)
    print(f"  ✅ Reset {goals_path.name}")
    
    with open(brand_path, "w") as f:
        f.write(BRAND_TEMPLATE)
    print(f"  ✅ Reset {brand_path.name}")


def clear_tmp():
    """Clears all files in .tmp/ except .gitkeep."""
    print("🧹 Clearing .tmp/ directory...")
    
    if not TMP_DIR.exists():
        TMP_DIR.mkdir()
        print("  ✅ Created missing .tmp/ directory")
        return

    files_removed = 0
    for item in TMP_DIR.iterdir():
        if item.name == ".gitkeep":
            continue
            
        try:
            if item.is_file() or item.is_symlink():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)
            files_removed += 1
        except Exception as e:
            print(f"  ❌ Failed to delete {item.name}: {e}")

    print(f"  ✅ Removed {files_removed} items from .tmp/")


def reset_infrastructure():
    """Resets webhooks.json and handles .env."""
    print("⚙️  Resetting Infrastructure config...")
    
    # 1. Webhooks
    webhooks_path = EXECUTION_DIR / "webhooks.json"
    with open(webhooks_path, "w") as f:
        f.write(WEBHOOKS_TEMPLATE)
    print(f"  ✅ Cleared {webhooks_path.name}")
    
    # 2. .env
    env_path = BASE_DIR / ".env"
    env_example_path = BASE_DIR / ".env.example"
    
    if env_path.exists():
        # Create backup if not exists
        if not env_example_path.exists():
            shutil.copy(env_path, env_example_path)
            print("  ✅ Created .env.example from current .env")
        
        # We don't delete .env automatically to prevent total key loss, 
        # but we warn the user.
        print("  ⚠️  .env file exists. PLEASE REVIEW IT MANUALLY.")
        print("     (We did not delete it to prevent accidental API key loss)")
    else:
        # Create empty .env.example
        with open(env_example_path, "w") as f:
            f.write("# Add your API keys here\nOPENAI_API_KEY=\n")
        print("  ✅ Created blank .env.example")


def main():
    print("🚀 Initializing New Project from Base...")
    print("========================================")
    
    if input("⚠️  Are you sure you want to RESET this project? (y/n): ").lower() != 'y':
        print("❌ Aborted.")
        return

    reset_context()
    clear_tmp()
    reset_infrastructure()
    
    print("\n✅ Project Reset Complete!")
    print("👉 NEXT STEPS:")
    print("1. Update context/brand.md")
    print("2. Update context/goals.md")
    print("3. Check .env for API keys")

if __name__ == "__main__":
    main()
