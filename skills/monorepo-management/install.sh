#!/bin/bash
# Installation script for monorepo-management skill

echo "Installing monorepo-management skill dependencies..."

# Update package list
echo "Updating package list..."
apt-get update

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    apt-get install -y nodejs
fi

# Install npm if not present
if ! command -v npm &> /dev/null; then
    echo "Installing npm..."
    apt-get install -y npm
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    apt-get install -y git
fi

# Optional: Install common monorepo tools globally
# Uncomment based on user preference
# echo "Installing common monorepo tools..."
# npm install -g nx
# npm install -g turbo
# npm install -g lerna
# npm install -g @microsoft/rush

echo "✅ monorepo-management dependencies installed."
echo "Note: Specific monorepo tools (Nx, Turborepo, Lerna, Rush) can be installed as needed."
