# skill-auditor

**Audit OpenClaw AgentSkills for quality, security, and best practices.**

Built by Friday during afternoon growth session 2026-02-12.

## What It Does

Scans OpenClaw skill directories and checks for:

### Critical Issues
- Missing or invalid `SKILL.md`
- Invalid YAML frontmatter
- Missing required fields (`name`, `description`)
- Hardcoded credentials (API keys, passwords, tokens)
- Dangerous commands (`rm -rf`, `curl | bash`, `eval()`)

### Warnings
- Referenced files/scripts not found
- Non-executable scripts
- Skill name formatting issues
- Description too short or too long
- Missing code examples
- Required binaries not on PATH

### Info
- Missing shebangs in Python scripts
- Third-party Python imports (needs documentation)
- Required environment variables not set

## Installation

```bash
npm install -g skill-auditor
```

Or run directly:

```bash
npx skill-auditor <skill-path>
```

## Usage

**Audit a single skill:**
```bash
skill-auditor ~/.openclaw/workspace/skills/my-skill
```

**Audit all skills in workspace:**
```bash
skill-auditor --all
```

## Exit Codes

- `0` - No critical issues
- `1` - Critical issues found

## Example Output

```
Auditing skill: image-gen

📊 Stats:
  Files: 2
  Scripts: 1
  Lines: 78

⚠️  Warnings (2):
  - Script not executable: scripts/generate_image.py
  - Third-party imports detected: openai, requests (document installation)

ℹ️  Info (1):
  - Required env var 'OPENAI_API_KEY' not set

✅ 3 total issues
```

## What It Checks

### SKILL.md Structure
- Frontmatter parseable
- Required fields present (`name`, `description`)
- Valid `metadata.openclaw` JSON (if present)
- Skill name format (lowercase-with-hyphens)
- Description length (10-200 chars)

### Documentation Quality
- Body content length
- Code examples present
- File references valid
- No broken paths

### Security
- No hardcoded credentials
- No dangerous shell commands
- No `eval()` or arbitrary `exec()` calls
- No piping remote content to shell

### Dependencies
- Required binaries exist on PATH
- Required env vars documented
- Python imports checked
- Proper shebangs in scripts

### File Structure
- Scripts executable
- Referenced files exist
- Relative paths correct

## Integration

Use in CI/CD:

```bash
#!/bin/bash
skill-auditor ./skills/my-skill || exit 1
```

Or as a pre-commit hook:

```bash
npx skill-auditor ./skills/* --all
```

## Why This Exists

OpenClaw skills can execute arbitrary code with access to the user's environment. Before publishing to ClawHub or installing third-party skills, you should audit them.

This tool automates common checks that would otherwise require manual code review.

## Limitations

- Does not execute code (static analysis only)
- Cannot catch all security issues
- PATH checks are host-specific
- Python import detection is regex-based (not AST)

Always review skills manually before enabling them, especially from untrusted sources.

## Contributing

Built in ~2 hours as a proof of concept. Improvements welcome:

- [ ] Add AST-based Python analysis
- [ ] Check bash script syntax
- [ ] Validate install instructions
- [ ] Test example commands
- [ ] Check for common typos
- [ ] Validate metadata schema against OpenClaw spec
- [ ] Support custom rules via config file

## License

MIT
