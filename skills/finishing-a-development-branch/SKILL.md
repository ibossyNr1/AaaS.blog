---
name: finishing-a-development-branch
description: Guides completion of development work by presenting structured options for merge, PR, or cleanup
version: 1.0.0
dependencies: ["git", "bash"]
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main/master?"

### Step 3: Present 4 Structured Options

**Exactly 4 options, no more, no less:**

1. **Merge directly** - Fast-forward merge into base branch
2. **Create PR** - Push branch, create pull request
3. **Keep branch** - Push branch, keep for later
4. **Discard** - Delete branch and worktree

**Template:**
```
Tests pass. Choose completion method:

1. Merge directly
   • git merge --ff-only
   • Clean up worktree
   • Best for: Solo work, ready to integrate

2. Create PR
   • git push origin <branch>
   • Create PR via GitHub CLI/web
   • Keep worktree for review
   • Best for: Team review needed

3. Keep branch
   • git push origin <branch>
   • Leave worktree intact
   • Best for: Work in progress, not ready

4. Discard
   • git branch -D <branch>
   • rm -rf <worktree-path>
   • Best for: Experimental dead-ends

Type number (1-4):
```

### Step 4: Execute Chosen Option

#### Option 1: Merge directly
```bash
git checkout main
git merge --ff-only feature-branch
git branch -d feature-branch
# Clean up worktree if created by using-git-worktrees
rm -rf ../feature-branch-worktree
```

#### Option 2: Create PR
```bash
git push origin feature-branch
# Then create PR via:
#   gh pr create --title "..." --body "..."
# Or direct user to GitHub web interface
```

**Do NOT clean up worktree** - needed for review.

#### Option 3: Keep branch
```bash
git push origin feature-branch
# Leave everything as-is
```

#### Option 4: Discard
```bash
# Require typed confirmation
echo "Type 'discard' to confirm deletion:"
read confirmation
if [ "$confirmation" = "discard" ]; then
    git branch -D feature-branch
    rm -rf ../feature-branch-worktree
fi
```

### Step 5: Clean Up (Options 1 & 4 only)

**Only for Options 1 and 4:**
- Delete local branch
- Remove worktree directory (if exists)
- Return to base branch

**Options 2 & 3:** Keep everything.

## When to Use

**Use when:**
- Implementation complete
- All tests pass
- Ready to decide integration method

**Don't use when:**
- Tests failing
- Still debugging/developing
- Need more changes

## Decision Matrix

| Situation | Best Option | Why |
|-----------|-------------|-----|
| Solo project, ready | 1. Merge directly | Fast, clean |
| Team review needed | 2. Create PR | Standard workflow |
| Work in progress | 3. Keep branch | Continue later |
| Experimental dead-end | 4. Discard | Remove clutter |

## Verification Checklist

Before presenting options:
- [ ] All tests pass
- [ ] No linting errors
- [ ] Code compiles
- [ ] Commit messages clear

After choice:
- [ ] Option executed correctly
- [ ] Worktree cleaned (if Option 1/4)
- [ ] Branch status updated

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Only cleanup for Options 1 and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktree for Options 1 & 4 only

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill
