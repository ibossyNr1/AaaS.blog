#!/bin/bash
# Install script for bash-defensive-patterns skill

echo "Installing dependencies for bash-defensive-patterns..."

# Check if bash is installed (should be)
if ! command -v bash &> /dev/null; then
    echo "Bash is required but not installed. Installing..."
    apt-get update && apt-get install -y bash
fi

# Optional: Install shellcheck for better script validation
if ! command -v shellcheck &> /dev/null; then
    echo "\nShellCheck is recommended for defensive Bash programming."
    echo "Would you like to install it? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Installing ShellCheck..."
        apt-get update && apt-get install -y shellcheck
    fi
fi

echo "✅ Dependencies installed."
echo "\nThis skill provides defensive programming patterns for Bash scripting to prevent common pitfalls, security vulnerabilities, and edge-case failures in production shell scripts."
echo "\nKey features:"
echo "- Strict mode configuration (set -Eeuo pipefail)"
echo "- Error handling and input validation patterns"
echo "- Safe variable expansion techniques"
echo "- Logging and cleanup best practices"
echo "- Testing and validation approaches"
