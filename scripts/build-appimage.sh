#!/bin/bash

# Build script for Raccourcis AppImage
# This script builds the application and generates an AppImage.
# If GITHUB_TOKEN is set, it can also publish the build to GitHub Releases.

set -e

echo "🚀 Starting build process..."

# 1. Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# 2. Build and Optionally Publish
if [ -n "$GITHUB_TOKEN" ]; then
    echo "🏗️ Building and Publishing to GitHub Releases..."
    # We use --publish always to ensure it pushes to assets
    npm run build -- --publish always
else
    echo "🏗️ Building AppImage (GITHUB_TOKEN not set, skipping publish)..."
    npm run build
fi

echo "✅ Done! You can find the AppImage in the release/ directory."
