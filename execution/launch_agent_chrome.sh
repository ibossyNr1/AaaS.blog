#!/bin/bash
# launch_agent_chrome.sh
# Launches Google Chrome in 'Agent-Ready' mode (Remote Debugging Enabled).
# usage: ./launch_agent_chrome.sh

PORT=9222

echo "🚀 Launching Chrome in Agent-Ready Mode..."
echo "----------------------------------------"
echo "🔧 Debug Port: $PORT"
echo "🔓 Origins:    Allowed (*)"
echo ""

# Check if Chrome is already running
if pgrep -x "Google Chrome" > /dev/null; then
    echo "⚠️  Chrome is already running!"
    echo "   To enable Agent-Ready mode, you must quit Chrome fully (Cmd+Q) first."
    read -p "   Do you want me to kill Chrome for you? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill "Google Chrome"
        sleep 1
        echo "💀 Chrome killed."
    else
        echo "❌ Aborted. Please quit Chrome manually and try again."
        exit 1
    fi
fi

# Launch Chrome with remote debugging flags
# Using 'open' on macOS to ensure it attaches to the UI correctly
open -a "Google Chrome" --args --remote-debugging-port=$PORT --remote-allow-origins=*

echo "✅ Chrome launched!"
echo "   You can now run 'notebooklm-mcp-auth' without manual intervention."
