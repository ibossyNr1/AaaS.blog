#!/bin/bash
# Health check for shellcheck-configuration skill

echo "🔍 Validating shellcheck-configuration..."

# Check shellcheck availability
if command -v shellcheck &> /dev/null; then
    echo "✅ ShellCheck is available."
else
    echo "❌ ShellCheck is not installed. Please install shellcheck."
    exit 1
fi

# Check skill structure
if [ -f "SKILL.md" ]; then
    echo "✅ SKILL.md found."
else
    echo "❌ SKILL.md not found."
    exit 1
fi

echo "🚀 shellcheck-configuration is ready."
exit 0
