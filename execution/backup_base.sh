#!/bin/bash
# backup_base.sh
# Usage: ./backup_base.sh

BASE_DIR="/Users/user/.gemini/Base"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

cd "$BASE_DIR" || exit

echo "📦 Starting Agent Base Backup at $TIMESTAMP..."

# 1. Add all changes (respecting .gitignore)
git add .

# 2. Check if there are changes to commit
if git diff --cached --quiet; then
    echo "✅ No changes to backup."
else
    # 3. Commit
    git commit -m "Auto-backup: $TIMESTAMP"
    echo "📝 Changes committed."

    # 4. Push if remote 'origin' exists
    if git remote | grep -q "origin"; then
        echo "🚀 Pushing to remote repository..."
        if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
            echo "✅ Backup pushed successfully."
        else
            echo "⚠️  Push failed. Check your internet connection or remote settings."
        fi
    else
        echo "ℹ️  No remote 'origin' found. Backup is local-only for now."
        echo "   (Fix: git remote add origin https://github.com/USER/REPO.git)"
    fi
fi

echo "🏁 Backup Process Finished."
