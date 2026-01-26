#!/bin/bash
# Health check for bash-defensive-patterns skill

echo "🔍 Validating bash-defensive-patterns..."

# Check if SKILL.md exists
if [ ! -f "SKILL.md" ]; then
    echo "❌ SKILL.md not found."
    exit 1
fi

# Check if bash is available
if ! command -v bash &> /dev/null; then
    echo "❌ Bash is not installed or not in PATH."
    exit 1
fi

# Check if shellcheck is available (optional but recommended)
if command -v shellcheck &> /dev/null; then
    echo "✅ ShellCheck is available (optional)."
else
    echo "ℹ️  ShellCheck not installed (optional dependency)."
fi

echo "✅ Bash is available."
echo "✅ SKILL.md found."
echo "🚀 bash-defensive-patterns is ready."
exit 0
