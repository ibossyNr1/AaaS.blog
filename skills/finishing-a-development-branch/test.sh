#!/bin/bash
# Health check for finishing-a-development-branch skill

echo "🔍 Validating finishing-a-development-branch..."

# Check git
if command -v git >/dev/null 2>&1; then
    echo "✅ Git is available."
else
    echo "❌ Git not found. Install with: apt-get install git"
    exit 1
fi

# Check bash version
bash_version=$(bash --version | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
echo "✅ Bash version: $bash_version"

echo "🚀 finishing-a-development-branch is ready."
exit 0
