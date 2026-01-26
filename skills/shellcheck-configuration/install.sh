#!/bin/bash
# Install script for shellcheck-configuration skill

echo "Installing dependencies for shellcheck-configuration..."

# Check if shellcheck is installed
if ! command -v shellcheck &> /dev/null; then
    echo "ShellCheck is required but not installed. Installing..."
    apt-get update && apt-get install -y shellcheck
fi

echo "✅ Dependencies installed."
echo "This skill provides comprehensive guidance for configuring and using ShellCheck to improve shell script quality, catch common pitfalls, and enforce best practices through static code analysis."
