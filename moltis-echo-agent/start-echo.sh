#!/bin/bash
#
# Start ECHO - Friday's Personal AI Assistant
#

set -euo pipefail

echo "🔮 Starting ECHO - Enhanced Cognitive Heuristic Oracle"
echo "=" $(printf '=%.0s' {1..50})
echo

# Check if Moltis is installed
if ! command -v moltis &> /dev/null; then
    echo "❌ Moltis is not installed"
    echo "Install with: curl -fsSL https://www.moltis.org/install.sh | sh"
    exit 1
fi

# Check for config
CONFIG_FILE="${HOME}/.config/moltis/echo.toml"
if [ ! -f "${CONFIG_FILE}" ]; then
    echo "⚠️  Config not found: ${CONFIG_FILE}"
    echo "Copying default config..."
    mkdir -p "${HOME}/.config/moltis"
    cp "$(dirname "$0")/config/echo.toml" "${CONFIG_FILE}"
    echo "✓ Config copied"
    echo
fi

# Check for API key
if ! grep -q "api_key.*=.*\"sk-" "${CONFIG_FILE}" && [ -z "${OPENAI_API_KEY:-}" ]; then
    echo "⚠️  OpenAI API key not configured"
    echo
    echo "Set it in ${CONFIG_FILE}:"
    echo '  api_key = "sk-your-key-here"'
    echo
    echo "Or export as environment variable:"
    echo '  export OPENAI_API_KEY="sk-your-key-here"'
    echo
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create necessary directories
mkdir -p "${HOME}/.config/moltis/logs"
mkdir -p "${HOME}/.config/moltis/research"
mkdir -p "${HOME}/.config/moltis/complexity"
mkdir -p "${HOME}/.config/moltis/synthesis"
mkdir -p "${HOME}/.config/moltis/memory"

# Make hooks executable
HOOKS_DIR="$(dirname "$0")/hooks"
if [ -d "${HOOKS_DIR}" ]; then
    find "${HOOKS_DIR}" -name "*.sh" -exec chmod +x {} \;
    echo "✓ Hooks made executable"
fi

echo
echo "Starting ECHO gateway..."
echo "  Port: 13132"
echo "  Config: ${CONFIG_FILE}"
echo "  Logs: ${HOME}/.config/moltis/logs/echo.log"
echo

# Start Moltis with ECHO config
exec moltis gateway \
    --config-dir "${HOME}/.config/moltis" \
    --port 13132 \
    --log-level info \
    2>&1 | tee -a "${HOME}/.config/moltis/logs/echo.log"
