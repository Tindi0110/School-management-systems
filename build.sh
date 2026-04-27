#!/usr/bin/env bash
# Root build script for Render
# Delegates to the backend build script

echo "Starting build from root..."
cd backend
chmod +x build.sh
./build.sh
