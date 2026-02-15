#!/bin/bash
#
# Moltis CLI Usage Examples
# Demonstrates various ways to interact with Moltis via command line
#

set -euo pipefail

echo "🤖 Moltis CLI Usage Examples"
echo "=" $(printf '=%.0s' {1..50})
echo

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_example() {
    echo -e "${BLUE}Example: $1${NC}"
    echo -e "${GREEN}$2${NC}"
    echo
}

# 1. Basic message sending
print_example \
    "Send a simple message" \
    "moltis send \"What is Rust?\""

# 2. Send with model override
print_example \
    "Send with specific model" \
    "moltis send --model gpt-4-turbo \"Explain quantum computing\""

# 3. Direct agent invocation
print_example \
    "Invoke agent directly (bypasses gateway)" \
    "moltis agent \"Write a haiku about programming\""

# 4. Check configuration
print_example \
    "Validate configuration file" \
    "moltis config check"

# 5. List available models
print_example \
    "List configured LLM providers and models" \
    "moltis models"

# 6. Session management
print_example \
    "List all sessions" \
    "moltis sessions list"

print_example \
    "Show session details" \
    "moltis sessions show <session-id>"

print_example \
    "Delete a session" \
    "moltis sessions delete <session-id>"

# 7. Memory operations
print_example \
    "Search long-term memory" \
    "moltis memory search \"rust programming\""

print_example \
    "Show memory status" \
    "moltis memory status"

# 8. Skills management
print_example \
    "List available skills" \
    "moltis skills list"

print_example \
    "Install a skill from GitHub" \
    "moltis skills install github.com/user/repo"

# 9. Hooks management
print_example \
    "List all hooks" \
    "moltis hooks list"

print_example \
    "Show hook details" \
    "moltis hooks info log-tool-calls"

print_example \
    "List only eligible hooks (requirements met)" \
    "moltis hooks list --eligible"

# 10. Sandbox management
print_example \
    "List sandbox images" \
    "moltis sandbox list"

print_example \
    "Build sandbox image" \
    "moltis sandbox build"

print_example \
    "Clean sandbox images" \
    "moltis sandbox clean"

# 11. Authentication
print_example \
    "Generate API key" \
    "moltis auth key create --name \"my-app\" --scopes \"chat:send,sessions:read\""

print_example \
    "List API keys" \
    "moltis auth key list"

# 12. Database management
print_example \
    "Reset database (WARNING: deletes all data)" \
    "moltis db reset"

print_example \
    "Clear session history" \
    "moltis db clear --sessions"

# 13. Onboarding wizard
print_example \
    "Run interactive onboarding" \
    "moltis onboard"

# 14. Start gateway with custom options
print_example \
    "Start gateway on custom port" \
    "moltis gateway --port 8080"

print_example \
    "Start with custom config directory" \
    "moltis --config-dir /path/to/config gateway"

print_example \
    "Start with debug logging" \
    "moltis --log-level debug gateway"

print_example \
    "Start with JSON logs" \
    "moltis --json-logs gateway"

# 15. Tailscale integration
print_example \
    "Expose via Tailscale Serve (private HTTPS)" \
    "moltis gateway --tailscale serve"

print_example \
    "Expose via Tailscale Funnel (public HTTPS)" \
    "moltis gateway --tailscale funnel"

print_example \
    "Check Tailscale status" \
    "moltis tailscale status"

# 16. Trust CA certificate
print_example \
    "Install Moltis CA to system trust store" \
    "moltis trust-ca"

# Interactive examples
echo -e "${YELLOW}Interactive Examples${NC}"
echo

# Example 1: Simple Q&A
read -p "Press Enter to run Example 1: Simple Q&A..."
echo -e "\n${BLUE}Running: moltis send \"What is the difference between async and sync in Rust?\"${NC}\n"
moltis send "What is the difference between async and sync in Rust?" || echo "Gateway not running. Start with: moltis gateway"

# Example 2: Code generation
read -p "Press Enter to run Example 2: Code generation..."
echo -e "\n${BLUE}Running: moltis send \"Write a simple HTTP server in Rust using tokio\"${NC}\n"
moltis send "Write a simple HTTP server in Rust using tokio" || echo "Gateway not running. Start with: moltis gateway"

# Example 3: Tool execution
read -p "Press Enter to run Example 3: Tool execution..."
echo -e "\n${BLUE}Running: moltis send \"Run 'ls -la' and tell me what files are in the current directory\"${NC}\n"
moltis send "Run 'ls -la' and tell me what files are in the current directory" || echo "Gateway not running. Start with: moltis gateway"

echo
echo "✓ Examples complete!"
echo
echo "To start the Moltis gateway:"
echo "  moltis gateway"
echo
echo "Then open: https://localhost:13131"
