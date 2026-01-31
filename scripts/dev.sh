#!/bin/bash
# =============================================================================
# Grab - Development Script
# Runs Tauri in development mode with hot-reload
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🚀 Grab Development Server"
echo "=========================="

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

# Check for Rust/Cargo
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo not found. Install from https://rustup.rs/"
    exit 1
fi
echo "✅ Rust $(rustc --version | cut -d' ' -f2)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check for Tauri CLI
if ! command -v cargo-tauri &> /dev/null; then
    echo "⚠️  Tauri CLI not found. Installing..."
    cargo install tauri-cli
fi
echo "✅ Tauri CLI installed"

# Check for Linux system dependencies (required for xcap screen capture)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "📋 Checking Linux system libraries..."
    MISSING_DEPS=""
    
    pkg-config --exists libpipewire-0.3 2>/dev/null || MISSING_DEPS="$MISSING_DEPS libpipewire-0.3-dev"
    pkg-config --exists gtk+-3.0 2>/dev/null || MISSING_DEPS="$MISSING_DEPS libgtk-3-dev"
    pkg-config --exists webkit2gtk-4.1 2>/dev/null || MISSING_DEPS="$MISSING_DEPS libwebkit2gtk-4.1-dev"
    
    if [ -n "$MISSING_DEPS" ]; then
        echo "❌ Missing system libraries:$MISSING_DEPS"
        echo ""
        echo "   Install with:"
        echo "   sudo apt-get install -y$MISSING_DEPS libayatana-appindicator3-dev librsvg2-dev"
        echo ""
        exit 1
    fi
    echo "✅ All Linux system libraries present"
fi

# Install UI dependencies if needed
echo ""
echo "📦 Checking UI dependencies..."
if [ ! -d "$PROJECT_ROOT/src-ui/node_modules" ]; then
    echo "Installing UI dependencies..."
    cd "$PROJECT_ROOT/src-ui"
    npm install
    cd "$PROJECT_ROOT"
else
    echo "✅ UI dependencies already installed"
fi

# Run Tauri dev server
echo ""
echo "🔧 Starting Tauri development server..."
echo "   (Press Ctrl+C to stop)"
echo ""

# Software rendering for WebKitGTK stability on dual GPU systems
export LIBGL_ALWAYS_SOFTWARE=1
export __GLX_VENDOR_LIBRARY_NAME=mesa
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
export BINDGEN_EXTRA_CLANG_ARGS="-I/usr/lib/gcc/x86_64-linux-gnu/13/include"

cargo tauri dev
