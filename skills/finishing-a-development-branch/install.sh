#!/bin/bash
# Install script for finishing-a-development-branch skill

echo "Installing finishing-a-development-branch..."

# Ensure git is installed
if ! command -v git >/dev/null 2>&1; then
    echo "Git not found. Installing..."
    apt-get update && apt-get install -y git
fi

echo "✅ finishing-a-development-branch installed."
