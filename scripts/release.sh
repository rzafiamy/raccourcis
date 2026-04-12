#!/bin/bash

# Automation script for versioning, tagging, and releasing
# This script bumps the version, creates a tag, and pushes to GitHub.

set -e

# Check if we are in the project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️ You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

echo "🚀 Starting release process..."

# Ask for version bump type
echo "Select bump type:"
options=("patch" "minor" "major" "quit")
select opt in "${options[@]}"
do
    case $opt in
        "patch")
            BUMP="patch"
            break
            ;;
        "minor")
            BUMP="minor"
            break
            ;;
        "major")
            BUMP="major"
            break
            ;;
        "quit")
            exit 0
            ;;
        *) echo "invalid option $REPLY";;
    esac
done

# 1. Update version and create tag
echo "📈 Bumping $BUMP version..."
NEW_VERSION=$(npm version $BUMP -m "chore(release): %s")

echo "✅ Bumped to $NEW_VERSION"

# 2. Push to GitHub
echo "📤 Pushing changes and tags to origin..."
git push origin main
git push origin --tags

echo "🎉 Release $NEW_VERSION initiated!"
echo "🛠️ GitHub Actions will now build the AppImage and upload it to the releases page."
