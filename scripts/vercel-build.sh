#!/bin/bash
set -e

echo "=== Vercel Build Start ==="

# 1. Build backend with npm for flat node_modules
echo ">>> Building backend..."
cd server
rm -rf node_modules
npm install --no-optional --legacy-peer-deps 2>/dev/null || npm install --no-optional --legacy-peer-deps
npx nest build
cd ..

# 2. Build frontend (H5) - skip if taro fails, use pre-built
echo ">>> Building frontend..."
export NODE_OPTIONS="--max-old-space-size=4096"
npx taro build --type h5 || echo "Taro build failed, using pre-built dist-web"

# 3. Prepare serverless function files
echo ">>> Preparing serverless function..."
mkdir -p api

# Copy entire server directory (dist + node_modules) into api
cp -r server/dist api/server-dist
cp -r server/node_modules api/server-node-modules

echo "=== Vercel Build Complete ==="
