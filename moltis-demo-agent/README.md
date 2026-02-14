# Moltis Demo Agent

A simple AI agent built with Moltis - a personal AI gateway written in Rust.

## What is Moltis?

Moltis is a local-first AI gateway that:
- Runs as a single binary (no Node.js required)
- Supports multiple LLM providers (OpenAI Codex, GitHub Copilot, Local LLMs)
- Provides sandboxed execution for commands
- Has long-term memory with embeddings
- Multi-channel support (Web UI, Telegram, API)
- MCP (Model Context Protocol) support

## Installation

```bash
# Install Moltis
curl -fsSL https://www.moltis.org/install.sh | sh

# Or via Homebrew
brew install moltis-org/tap/moltis

# Or via Docker
docker pull ghcr.io/moltis-org/moltis:latest
```

## Quick Start

### 1. Configure Moltis

First run will create a default configuration:

```bash
moltis config check
```

This creates `~/.config/moltis/moltis.toml` with default settings.

### 2. Add Your API Key

Edit `~/.config/moltis/moltis.toml` and add your OpenAI API key:

```toml
[[providers]]
kind = "openai"
model = "gpt-4-turbo"
api_key = "sk-your-key-here"
```

Or set via environment:

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

### 3. Start the Gateway

```bash
moltis
```

This starts:
- Web UI at https://localhost:13131
- WebSocket server for real-time communication
- Telegram bot (if configured)

### 4. Access the Web UI

Open https://localhost:13131 in your browser.

On first run:
- Enter the setup code shown in terminal
- Set your password or register a passkey
- Configure your agent identity

## Building a Custom Agent

### Agent Configuration

Create a custom agent profile in `~/.config/moltis/moltis.toml`:

```toml
[agents.demo]
name = "DemoBot"
emoji = "🤖"
creature = "AI Assistant"
vibe = "helpful, direct, and efficient"
model = "gpt-4-turbo"

# Soul/personality (optional)
soul = """
I am a helpful AI assistant built with Moltis.
I provide direct answers without unnecessary fluff.
I can execute commands, search the web, and maintain long-term memory.
"""
```

### Tools Configuration

Enable tools your agent can use:

```toml
[tools]
enabled = [
    "exec",
    "web_search",
    "web_fetch",
    "memory_search",
    "spawn_agent",
]

[tools.exec]
enabled = true
timeout = 30

[tools.web_search]
enabled = true
provider = "brave"  # or "perplexity"

[tools.web_fetch]
enabled = true
max_chars = 50000
```

### Sandboxed Execution

Configure sandbox for safe command execution:

```toml
[tools.exec.sandbox]
backend = "docker"  # or "apple_container" on macOS
base_image = "ubuntu:25.10"
packages = [
    "curl",
    "git",
    "python3",
    "nodejs",
    "npm",
]
```

### Memory Configuration

Enable long-term memory:

```toml
[memory]
enabled = true
embedding_model = "text-embedding-3-small"
chunk_size = 512
watch_dirs = [
    "~/.config/moltis/memory",
    "~/Documents/notes",
]
```

## Usage Examples

### Via Web UI

1. Open https://localhost:13131
2. Type your message
3. Agent responds with streaming tokens
4. Tools execute automatically when needed

### Via CLI

```bash
# Send a message directly
moltis send "What's the weather like today?"

# Invoke agent with a specific model
moltis agent --model gpt-4-turbo "Analyze this data: ..."

# Check agent memory
moltis memory search "project ideas"
```

### Via Telegram

1. Configure Telegram bot in `moltis.toml`:

```toml
[channels.telegram]
enabled = true
bot_token = "your-bot-token"
allowed_users = [123456789]  # Your Telegram user ID
```

2. Start gateway: `moltis`
3. Message your bot on Telegram

## Advanced Features

### Hooks

Create lifecycle hooks to observe/modify actions:

```bash
# List available hooks
moltis hooks list

# Create a custom hook
mkdir -p ~/.moltis/hooks/custom-hook
```

Example hook (`.moltis/hooks/log-tool-calls/HOOK.md`):

```markdown
+++
name = "log-tool-calls"
description = "Log all tool executions"
events = ["BeforeToolCall", "AfterToolCall"]
command = "./handler.sh"
+++

Logs every tool call to a JSONL file for auditing.
```

### MCP Servers

Connect to Model Context Protocol servers:

```bash
# Edit MCP servers config
vim ~/.config/moltis/mcp-servers.json
```

Example:

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
      "env": {}
    }
  }
}
```

### Skills

Add custom skills:

```bash
# List available skills
moltis skills list

# Install a skill
moltis skills install github.com/user/skill-repo
```

## Project Structure

```
moltis-demo-agent/
├── README.md                    # This file
├── config/
│   └── moltis.toml             # Agent configuration
├── hooks/                       # Custom hooks
│   └── example-hook/
│       ├── HOOK.md
│       └── handler.sh
├── memory/                      # Long-term memory files
│   └── notes.md
└── examples/
    ├── cli-usage.sh            # CLI examples
    └── python-client.py        # Python API client
```

## Architecture

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Web UI      │ │ Telegram    │ │ API         │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┴───────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  Moltis Gateway         │
         │  ┌─────────┐ ┌────────┐│
         │  │ Agent   │ │ Tools  ││
         │  │ Loop    │◄│Registry││
         │  └────┬────┘ └────────┘│
         │       │                 │
         │  ┌────▼──────────────┐ │
         │  │ Provider Registry │ │
         │  │ Codex·Copilot·Local│ │
         │  └───────────────────┘ │
         └─────────────────────────┘
                       │
              ┌────────▼────────┐
              │   Sandbox       │
              │ Docker/Apple    │
              └─────────────────┘
```

## Resources

- **Moltis Website:** https://moltis.org
- **Documentation:** https://docs.moltis.org
- **GitHub:** https://github.com/moltis-org/moltis
- **Discord:** https://discord.gg/t873en2E

## License

MIT

---

**Built with Moltis** - A personal AI gateway in Rust 🦀
