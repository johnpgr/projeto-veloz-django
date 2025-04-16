#!/bin/bash

# Make script exit on any error
set -e

# Create cmd directory if it doesn't exist
CMD_DIR="./bin"
mkdir -p "$CMD_DIR"

# Function to detect OS and architecture
detect_os_and_arch() {
    local os=""
    local arch=""
    local musl=false

    # Detect OS
    case "$(uname -s)" in
        Linux*)
            os="linux"
            # Check if using musl (Alpine Linux)
            if ldd --version 2>&1 | grep -q "musl"; then
                musl=true
            fi
            ;;
        Darwin*)
            os="macos"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            os="windows"
            ;;
        *)
            echo "Unsupported operating system"
            exit 1
            ;;
    esac

    # Detect architecture
    case "$(uname -m)" in
        x86_64|amd64)
            arch="x64"
            ;;
        arm64|aarch64)
            arch="arm64"
            ;;
        *)
            echo "Unsupported architecture"
            exit 1
            ;;
    esac

    # Construct executable name
    local exe_name="tailwindcss-${os}"
    if [ "$os" = "windows" ]; then
        exe_name="${exe_name}-${arch}.exe"
    else
        if [ "$os" = "linux" ] && [ "$musl" = true ]; then
            exe_name="${exe_name}-${arch}-musl"
        else
            exe_name="${exe_name}-${arch}"
        fi
    fi

    echo "$exe_name"
}

TAILWIND_EXE_NAME=$(detect_os_and_arch)
TAILWIND_EXE="$CMD_DIR/$TAILWIND_EXE_NAME"

# Download executable if it doesn't exist
if [ ! -f "$TAILWIND_EXE" ]; then
    echo "Downloading $TAILWIND_EXE_NAME..."
    curl -sL "https://github.com/tailwindlabs/tailwindcss/releases/latest/download/$TAILWIND_EXE_NAME" -o "$TAILWIND_EXE"
    chmod +x "$TAILWIND_EXE"
fi

# Default command is watch
COMMAND=${1:-watch}

case $COMMAND in
    "watch")
        echo "Starting Tailwind CSS in watch mode..."
        "$TAILWIND_EXE" -i ./src/static/css/input.css -o ./src/static/css/styles.css --watch
        ;;
    "build")
        echo "Building Tailwind CSS..."
        "$TAILWIND_EXE" -i ./src/static/css/input.css -o ./src/static/css/styles.css --minify
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Usage: ./css.sh [watch|build]"
        exit 1
        ;;
esac
