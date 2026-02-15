#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

// Severity levels
const Severity = {
  SAFE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

// Context types
const Context = {
  STRING: 0,   // Inside string literal
  DOCS: 1,     // Documentation
  CONFIG: 2,   // Config file
  CODE: 3      // Executable code
};

// File type to context mapping
const FILE_CONTEXTS = {
  '.md': Context.DOCS,
  '.txt': Context.DOCS,
  '.rst': Context.DOCS,
  '.yaml': Context.CONFIG,
  '.yml': Context.CONFIG,
  '.json': Context.CONFIG,
  '.toml': Context.CONFIG,
  '.ini': Context.CONFIG,
  '.py': Context.CODE,
  '.js': Context.CODE,
  '.ts': Context.CODE,
  '.sh': Context.CODE,
  '.bash': Context.CODE,
  '.mjs': Context.CODE,
  '.cjs': Context.CODE
};

// Security patterns (ported from Heimdall)
const PATTERNS = [
  // Credential Access
  { pattern: /cat\s+.*\.env\b/, severity: Severity.CRITICAL, category: 'credential_access', description: 'Reading .env file' },
  { pattern: /source\s+.*\.env\b/, severity: Severity.HIGH, category: 'credential_access', description: 'Sourcing .env file' },
  { pattern: /open\([^)]*\.env[^)]*\)/, severity: Severity.HIGH, category: 'credential_access', description: 'Opening .env file' },
  { pattern: /secrets?\/[a-zA-Z]/, severity: Severity.HIGH, category: 'credential_access', description: 'Accessing secrets directory' },
  { pattern: /password\s*=\s*["'][^"']+["']/, severity: Severity.CRITICAL, category: 'credential_access', description: 'Hardcoded password' },
  { pattern: /api[_-]?key\s*=\s*["'][^"']{10,}["']/, severity: Severity.CRITICAL, category: 'credential_access', description: 'Hardcoded API key' },
  { pattern: /token\s*=\s*["'][^"']{20,}["']/, severity: Severity.CRITICAL, category: 'credential_access', description: 'Hardcoded token' },
  { pattern: /BEGIN\s+(RSA|PRIVATE|OPENSSH)\s+PRIVATE\s+KEY/, severity: Severity.CRITICAL, category: 'credential_access', description: 'Embedded private key' },
  
  // Network Exfiltration
  { pattern: /curl\s+-[^s]*\s+(http|https):\/\/(?!localhost|127\.0\.0\.1)/, severity: Severity.HIGH, category: 'network_exfil', description: 'Curl to external URL' },
  { pattern: /wget\s+(http|https):\/\/(?!localhost|127\.0\.0\.1)/, severity: Severity.HIGH, category: 'network_exfil', description: 'Wget to external URL' },
  { pattern: /requests\.(get|post|put|delete)\s*\(["']https?:\/\/(?!localhost)/, severity: Severity.MEDIUM, category: 'network_exfil', description: 'HTTP request to external' },
  { pattern: /fetch\s*\(\s*["']https?:\/\/(?!localhost)/, severity: Severity.MEDIUM, category: 'network_exfil', description: 'Fetch to external URL' },
  { pattern: /webhook\.site/, severity: Severity.CRITICAL, category: 'network_exfil', description: 'Known exfil domain' },
  { pattern: /ngrok\.io/, severity: Severity.HIGH, category: 'network_exfil', description: 'Ngrok tunnel' },
  { pattern: /requestbin\.(com|net)/, severity: Severity.CRITICAL, category: 'network_exfil', description: 'Known exfil service' },
  { pattern: /burpcollaborator/, severity: Severity.CRITICAL, category: 'network_exfil', description: 'Burp collaborator' },
  
  // Shell Execution
  { pattern: /subprocess\.(?:run|call|Popen)\s*\(\s*["']/, severity: Severity.HIGH, category: 'shell_exec', description: 'Subprocess with string command' },
  { pattern: /subprocess\.(?:run|call|Popen)\s*\(\s*\[/, severity: Severity.MEDIUM, category: 'shell_exec', description: 'Subprocess with list command' },
  { pattern: /os\.system\s*\(\s*["']/, severity: Severity.HIGH, category: 'shell_exec', description: 'OS system call' },
  { pattern: /os\.popen\s*\(\s*["']/, severity: Severity.HIGH, category: 'shell_exec', description: 'OS popen' },
  { pattern: /exec\s*\(\s*(?:compile|open)/, severity: Severity.CRITICAL, category: 'shell_exec', description: 'Exec with dynamic code' },
  { pattern: /eval\s*\(\s*(?:input|request|argv)/, severity: Severity.CRITICAL, category: 'shell_exec', description: 'Eval with user input' },
  { pattern: /\|\s*bash\s*$/, severity: Severity.CRITICAL, category: 'shell_exec', description: 'Pipe to bash' },
  { pattern: /\|\s*sh\s*$/, severity: Severity.CRITICAL, category: 'shell_exec', description: 'Pipe to shell' },
  { pattern: /bash\s+-c\s+["']/, severity: Severity.HIGH, category: 'shell_exec', description: 'Bash -c execution' },
  { pattern: /child_process\.exec\(/, severity: Severity.HIGH, category: 'shell_exec', description: 'Node.js exec call' },
  { pattern: /child_process\.spawn\(/, severity: Severity.MEDIUM, category: 'shell_exec', description: 'Node.js spawn call' },
  
  // Filesystem
  { pattern: /shutil\.rmtree\s*\(\s*["']?\//, severity: Severity.CRITICAL, category: 'filesystem', description: 'Recursive delete from root' },
  { pattern: /os\.remove\s*\(\s*["']?~/, severity: Severity.HIGH, category: 'filesystem', description: 'Delete in home directory' },
  { pattern: /\/etc\/passwd/, severity: Severity.CRITICAL, category: 'filesystem', description: 'System file access' },
  { pattern: /\/etc\/shadow/, severity: Severity.CRITICAL, category: 'filesystem', description: 'Password file access' },
  { pattern: /~\/\.ssh\/(?:id_|authorized)/, severity: Severity.CRITICAL, category: 'filesystem', description: 'SSH key access' },
  { pattern: /fs\.unlinkSync\(/, severity: Severity.MEDIUM, category: 'filesystem', description: 'File deletion (Node.js)' },
  { pattern: /fs\.rmdirSync\(/, severity: Severity.HIGH, category: 'filesystem', description: 'Directory deletion (Node.js)' },
  
  // Obfuscation
  { pattern: /exec\s*\(\s*base64\.b64decode/, severity: Severity.CRITICAL, category: 'obfuscation', description: 'Exec base64 payload' },
  { pattern: /eval\s*\(\s*base64\.b64decode/, severity: Severity.CRITICAL, category: 'obfuscation', description: 'Eval base64 payload' },
  { pattern: /exec\s*\(\s*codecs\.decode/, severity: Severity.CRITICAL, category: 'obfuscation', description: 'Exec encoded payload' },
  { pattern: /exec\s*\(\s*["']\\x/, severity: Severity.CRITICAL, category: 'obfuscation', description: 'Exec hex-encoded payload' },
  { pattern: /getattr\s*\([^,]+,\s*["']__(?:import|builtins|globals)/, severity: Severity.CRITICAL, category: 'obfuscation', description: 'Dynamic dunder access' },
  { pattern: /Buffer\.from\([^)]*,\s*["']base64["']\)/, severity: Severity.HIGH, category: 'obfuscation', description: 'Base64 decoding (Node.js)' },
  
  // Data Exfiltration
  { pattern: /(post|put|send)\s*\([^)]*\b(password|token|api_?key|secret)\b/, severity: Severity.CRITICAL, category: 'data_exfil', description: 'Sending credentials' },
  { pattern: /json\.dumps\s*\([^)]*\benv\b/, severity: Severity.HIGH, category: 'data_exfil', description: 'Serializing env' },
  { pattern: /JSON\.stringify\([^)]*process\.env/, severity: Severity.HIGH, category: 'data_exfil', description: 'Serializing env (Node.js)' },
  
  // Privilege Escalation
  { pattern: /sudo\s+-S/, severity: Severity.CRITICAL, category: 'privilege', description: 'Sudo with stdin password' },
  { pattern: /chmod\s+[47]77/, severity: Severity.HIGH, category: 'privilege', description: 'World-writable permissions' },
  { pattern: /setuid\s*\(/, severity: Severity.CRITICAL, category: 'privilege', description: 'Setuid call' },
  
  // Persistence
  { pattern: /crontab\s+-[el]/, severity: Severity.MEDIUM, category: 'persistence', description: 'Cron listing' },
  { pattern: /crontab\s+<</, severity: Severity.CRITICAL, category: 'persistence', description: 'Cron injection' },
  { pattern: /echo\s+.*>>\s*~\/\.(bashrc|zshrc|profile)/, severity: Severity.HIGH, category: 'persistence', description: 'Shell config injection' },
  { pattern: /\/etc\/rc\.local/, severity: Severity.HIGH, category: 'persistence', description: 'Startup script modification' },
  
  // Crypto/Mining
  { pattern: /xmrig/i, severity: Severity.CRITICAL, category: 'crypto', description: 'Crypto miner detected' },
  { pattern: /stratum\+tcp:\/\//, severity: Severity.CRITICAL, category: 'crypto', description: 'Mining pool protocol' },
  { pattern: /monero.*wallet|wallet.*monero/i, severity: Severity.CRITICAL, category: 'crypto', description: 'Monero wallet' },
  
  // Remote Fetch (Heimdall v3.0)
  { pattern: /curl\s+.*skill\.md/i, severity: Severity.CRITICAL, category: 'remote_fetch', description: 'Fetching skill from internet' },
  { pattern: /curl\s+.*SKILL\.md/i, severity: Severity.CRITICAL, category: 'remote_fetch', description: 'Fetching skill from internet' },
  { pattern: /curl\s+.*heartbeat\.md/i, severity: Severity.CRITICAL, category: 'remote_fetch', description: 'Fetching heartbeat from internet' },
  { pattern: /wget\s+.*skill\.md/i, severity: Severity.CRITICAL, category: 'remote_fetch', description: 'Fetching skill from internet' },
  { pattern: /https?:\/\/.*\.md\s*>\s*~\//, severity: Severity.CRITICAL, category: 'remote_fetch', description: 'Downloading MD to home dir' },
  
  // Heartbeat Injection
  { pattern: />>\s*.*HEARTBEAT\.md/i, severity: Severity.CRITICAL, category: 'heartbeat_injection', description: 'Appending to heartbeat file' },
  { pattern: />\s*.*HEARTBEAT\.md/i, severity: Severity.HIGH, category: 'heartbeat_injection', description: 'Overwriting heartbeat file' },
  { pattern: /echo\s+.*>.*heartbeat/i, severity: Severity.HIGH, category: 'heartbeat_injection', description: 'Writing to heartbeat' },
  
  // MCP Abuse
  { pattern: /no[_-]?human[_-]?(approval|review|confirm)/i, severity: Severity.CRITICAL, category: 'mcp_abuse', description: 'Bypassing human approval' },
  { pattern: /auto[_-]?approve/i, severity: Severity.CRITICAL, category: 'mcp_abuse', description: 'Auto-approve pattern' },
  { pattern: /skip[_-]?(confirm|approval|review)/i, severity: Severity.HIGH, category: 'mcp_abuse', description: 'Skipping confirmation' },
  
  // Unicode Injection
  { pattern: /\\u[Ee]00[0-7][0-9a-fA-F]/, severity: Severity.HIGH, category: 'unicode_injection', description: 'Unicode tag escape sequence' },
  
  // Crypto Wallets
  { pattern: /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/, severity: Severity.HIGH, category: 'crypto_wallet', description: 'Bitcoin address pattern' },
  { pattern: /0x[a-fA-F0-9]{40}/, severity: Severity.HIGH, category: 'crypto_wallet', description: 'Ethereum address pattern' },
  { pattern: /wallet\s*[=:]\s*["'][^"']{25,}/, severity: Severity.HIGH, category: 'crypto_wallet', description: 'Wallet assignment' },
  { pattern: /(seed|mnemonic)\s*(phrase|words?)/i, severity: Severity.CRITICAL, category: 'crypto_wallet', description: 'Seed phrase reference' },
  
  // Impersonation
  { pattern: /(i\s+am|i'm)\s+(the\s+)?(admin|owner|developer|creator)/i, severity: Severity.HIGH, category: 'impersonation', description: 'Authority claim' },
  { pattern: /system\s*:\s*you\s+are/i, severity: Severity.HIGH, category: 'impersonation', description: 'System prompt injection' },
  { pattern: /\[SYSTEM\]/i, severity: Severity.HIGH, category: 'impersonation', description: 'Fake system tag' },
  { pattern: /ignore\s+(all\s+)?(previous|prior)\s+(instructions?|prompts?)/i, severity: Severity.CRITICAL, category: 'impersonation', description: 'Instruction override' },
  
  // Pre-fill Exfiltration
  { pattern: /docs\.google\.com\/forms.*entry\./, severity: Severity.HIGH, category: 'prefill_exfil', description: 'Google Forms pre-fill' },
  { pattern: /forms\.gle.*\?/, severity: Severity.MEDIUM, category: 'prefill_exfil', description: 'Google Forms with params' },
  { pattern: /GET.*[?&](secret|token|key|password)=/i, severity: Severity.CRITICAL, category: 'prefill_exfil', description: 'Secrets in GET params' },
  
  // Supply Chain
  { pattern: /git\s+clone\s+https?:\/\/(?!github\.com\/(openclaw|henrino3)\/)/, severity: Severity.HIGH, category: 'supply_chain', description: 'Git clone from external repo' },
  { pattern: /npm\s+install\s+(?!-[gD])/, severity: Severity.MEDIUM, category: 'supply_chain', description: 'npm install (supply chain risk)' },
  { pattern: /pip\s+install\s+(?!-r)/, severity: Severity.MEDIUM, category: 'supply_chain', description: 'pip install (supply chain risk)' },
  
  // Telemetry
  { pattern: /opentelemetry|otel/i, severity: Severity.MEDIUM, category: 'telemetry', description: 'OpenTelemetry (sends data externally)' },
  { pattern: /signoz|uptrace|jaeger|zipkin/i, severity: Severity.HIGH, category: 'telemetry', description: 'Telemetry backend' },
  { pattern: /analytics\.(track|send|log)/i, severity: Severity.MEDIUM, category: 'telemetry', description: 'Analytics tracking' }
];

// Blocklist indicator patterns
const BLOCKLIST_INDICATORS = [
  /patterns?\s*[=:]/i,
  /blocklist\s*[=:]/i,
  /blacklist\s*[=:]/i,
  /detect(ion)?_patterns?/i,
  /malicious_patterns?/i,
  /attack_patterns?/i,
  /PATTERNS\s*[=:\[]/,
  /regex(es)?\s*[=:]/i,
  /r["'].*["'],?\s*#/,
  /description["']?\s*:/
];

// Security tool indicators
const SECURITY_TOOL_INDICATORS = [
  'prompt-guard', 'prompt_guard', 'security-scan', 'detect.py',
  'patterns.py', 'blocklist', 'firewall', 'waf', 'filter',
  'heimdall', 'sniff', 'sentinel', 'guard'
];

class SkillScanner {
  constructor(skillPath, options = {}) {
    this.skillPath = path.resolve(skillPath);
    this.strict = options.strict || false;
    this.verbose = options.verbose || false;
    
    this.findings = [];
    this.filesScanned = 0;
    this.suppressedCount = 0;
  }
  
  // Get file context based on extension and name
  getFileContext(filepath) {
    const ext = path.extname(filepath).toLowerCase();
    const basename = path.basename(filepath).toLowerCase();
    
    // Security tool files are treated as docs
    for (const indicator of SECURITY_TOOL_INDICATORS) {
      if (filepath.toLowerCase().includes(indicator)) {
        return Context.DOCS;
      }
    }
    
    // README and similar are docs
    if (['readme', 'changelog', 'license', 'contributing', 'history'].some(doc => basename.includes(doc))) {
      return Context.DOCS;
    }
    
    return FILE_CONTEXTS[ext] || Context.CODE;
  }
  
  // Check if match is inside a string literal
  isInStringLiteral(line, matchStart) {
    const before = line.substring(0, matchStart);
    const singleQuotes = (before.match(/(?<!\\)'/g) || []).length;
    const doubleQuotes = (before.match(/(?<!\\)"/g) || []).length;
    const rawDouble = (before.match(/r"/g) || []).length;
    const rawSingle = (before.match(/r'/g) || []).length;
    
    return (singleQuotes - rawSingle) % 2 === 1 || (doubleQuotes - rawDouble) % 2 === 1;
  }
  
  // Check if this is a blocklist definition
  isBlocklistDefinition(line, prevLines) {
    const contextLines = prevLines.slice(-5).concat([line]);
    const context = contextLines.join('\n');
    
    return BLOCKLIST_INDICATORS.some(pattern => pattern.test(context));
  }
  
  // Adjust severity based on context
  adjustSeverity(severity, context, isString, isBlocklist, filepath) {
    const isSecurityTool = SECURITY_TOOL_INDICATORS.some(ind => filepath.toLowerCase().includes(ind));
    
    if (isBlocklist) {
      return { severity: Severity.SAFE, reason: 'Pattern in blocklist definition', suppressed: true };
    }
    
    if (isSecurityTool) {
      if (context === Context.DOCS || context === Context.STRING || isString) {
        return { severity: Severity.SAFE, reason: 'Security tool - pattern example', suppressed: true };
      }
      const newSev = Math.max(0, severity - 2);
      return { severity: Math.max(1, newSev), reason: 'Security tool - detection pattern', suppressed: false };
    }
    
    if (isString) {
      const newSev = Math.max(0, severity - 3);
      return { severity: newSev, reason: 'Pattern in string literal', suppressed: newSev === Severity.SAFE };
    }
    
    if (context === Context.DOCS) {
      const newSev = Math.max(0, severity - 3);
      return { severity: newSev, reason: 'Pattern in documentation', suppressed: newSev === Severity.SAFE };
    }
    
    if (context === Context.CONFIG) {
      const newSev = Math.max(0, severity - 1);
      return { severity: Math.max(1, newSev), reason: 'Pattern in config file', suppressed: false };
    }
    
    return { severity, reason: '', suppressed: false };
  }
  
  // Scan a single file
  scanFile(filepath) {
    const findings = [];
    const fileContext = this.getFileContext(filepath);
    
    let content;
    try {
      content = fs.readFileSync(filepath, 'utf8');
    } catch (error) {
      return findings;
    }
    
    const lines = content.split('\n');
    
    for (const { pattern, severity, category, description } of PATTERNS) {
      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const matches = [...line.matchAll(new RegExp(pattern.source, pattern.flags + 'g'))];
        
        for (const match of matches) {
          const isString = this.isInStringLiteral(line, match.index);
          const isBlocklist = this.isBlocklistDefinition(line, lines.slice(Math.max(0, lineNum - 5), lineNum));
          
          let context;
          if (isBlocklist) {
            context = Context.STRING;
          } else if (isString) {
            context = Context.STRING;
          } else {
            context = fileContext;
          }
          
          let adjustedSeverity, reason, suppressed;
          if (this.strict) {
            adjustedSeverity = severity;
            reason = '';
            suppressed = false;
          } else {
            const result = this.adjustSeverity(severity, context, isString, isBlocklist, filepath);
            adjustedSeverity = result.severity;
            reason = result.reason;
            suppressed = result.suppressed;
          }
          
          findings.push({
            severity: adjustedSeverity,
            originalSeverity: severity,
            category,
            pattern: pattern.source,
            file: filepath,
            line: lineNum + 1,
            match: match[0].substring(0, 80),
            description,
            context,
            suppressed,
            suppressionReason: reason
          });
          
          if (suppressed) {
            this.suppressedCount++;
          }
        }
      }
    }
    
    return findings;
  }
  
  // Scan skill directory
  scan() {
    const scanPath = path.resolve(this.skillPath);
    
    if (!fs.existsSync(scanPath)) {
      console.error(`❌ Path does not exist: ${scanPath}`);
      process.exit(1);
    }
    
    let files = [];
    if (fs.statSync(scanPath).isFile()) {
      files = [scanPath];
    } else {
      const scanExtensions = new Set(['.py', '.js', '.ts', '.sh', '.bash', '.mjs', '.cjs', '.md', '.yaml', '.yml', '.json']);
      
      const walkDir = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walkDir(fullPath);
          } else if (entry.isFile() && scanExtensions.has(path.extname(entry.name).toLowerCase())) {
            files.push(fullPath);
          }
        }
      };
      
      walkDir(scanPath);
    }
    
    for (const file of files) {
      this.filesScanned++;
      const fileFindings = this.scanFile(file);
      this.findings.push(...fileFindings);
    }
    
    return this.getReport();
  }
  
  // Generate report
  getReport() {
    const activeFindings = this.findings.filter(f => !f.suppressed);
    const maxSeverity = activeFindings.length > 0 
      ? Math.max(...activeFindings.map(f => f.severity))
      : Severity.SAFE;
    
    let action;
    if (maxSeverity === Severity.SAFE) {
      action = '✅ SAFE - OK to install';
    } else if (maxSeverity === Severity.LOW) {
      action = '📝 LOW - Review recommended';
    } else if (maxSeverity === Severity.MEDIUM) {
      action = '⚠️  MEDIUM - Manual review required';
    } else if (maxSeverity === Severity.HIGH) {
      action = '🔴 HIGH - Do NOT install without audit';
    } else {
      action = '🚨 CRITICAL - BLOCKED - Likely malicious';
    }
    
    return {
      path: this.skillPath,
      filesScanned: this.filesScanned,
      findings: this.findings,
      activeFindings,
      suppressedCount: this.suppressedCount,
      maxSeverity,
      action
    };
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
sniff - Security scanner for OpenClaw skills

Usage:
  sniff <path>                 Scan skill directory or file
  sniff --json <path>          JSON output
  sniff --strict <path>        Ignore context, flag everything
  sniff -v <path>              Verbose output
  sniff --show-suppressed <path>  Show suppressed findings

Examples:
  sniff ~/.openclaw/workspace/skills/my-skill
  sniff --json ./skills/github
  sniff --strict untrusted-skill/
    `);
    process.exit(0);
  }
  
  const options = {
    strict: args.includes('--strict'),
    verbose: args.includes('-v') || args.includes('--verbose'),
    json: args.includes('--json'),
    showSuppressed: args.includes('--show-suppressed')
  };
  
  const skillPath = args.find(arg => !arg.startsWith('-'));
  
  if (!skillPath) {
    console.error('❌ No path specified');
    process.exit(1);
  }
  
  const scanner = new SkillScanner(skillPath, options);
  const report = scanner.scan();
  
  if (options.json) {
    const output = {
      version: '1.0.0',
      path: report.path,
      filesScanned: report.filesScanned,
      maxSeverity: Object.keys(Severity).find(k => Severity[k] === report.maxSeverity),
      action: report.action,
      activeFindings: report.activeFindings.length,
      suppressedFindings: report.suppressedCount,
      findings: (options.showSuppressed ? report.findings : report.activeFindings).map(f => ({
        severity: Object.keys(Severity).find(k => Severity[k] === f.severity),
        originalSeverity: Object.keys(Severity).find(k => Severity[k] === f.originalSeverity),
        category: f.category,
        file: f.file,
        line: f.line,
        match: f.match,
        description: f.description,
        context: Object.keys(Context).find(k => Context[k] === f.context),
        suppressed: f.suppressed,
        suppressionReason: f.suppressionReason
      }))
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    // Pretty print
    console.log('\n' + '='.repeat(60));
    console.log('🔍 sniff - skill security scan');
    console.log('='.repeat(60));
    console.log(`📁 Path: ${report.path}`);
    console.log(`📄 Files scanned: ${report.filesScanned}`);
    console.log(`🔢 Active issues: ${report.activeFindings.length}`);
    if (report.suppressedCount > 0) {
      console.log(`🔇 Suppressed (context-aware): ${report.suppressedCount}`);
    }
    console.log(`⚡ Max severity: ${Object.keys(Severity).find(k => Severity[k] === report.maxSeverity)}`);
    console.log(`📋 Action: ${report.action}`);
    console.log('='.repeat(60));
    
    if (report.activeFindings.length > 0) {
      const bySeverity = {};
      for (const f of report.activeFindings) {
        if (!bySeverity[f.severity]) bySeverity[f.severity] = [];
        bySeverity[f.severity].push(f);
      }
      
      for (const [sev, findings] of Object.entries(bySeverity).sort((a, b) => b[0] - a[0])) {
        const sevName = Object.keys(Severity).find(k => Severity[k] == sev);
        const emoji = sev >= Severity.HIGH ? '🚨' : '⚠️';
        console.log(`\n${emoji} ${sevName} (${findings.length} issues):`);
        
        const byCategory = {};
        for (const f of findings) {
          if (!byCategory[f.category]) byCategory[f.category] = [];
          byCategory[f.category].push(f);
        }
        
        for (const [cat, catFindings] of Object.entries(byCategory)) {
          console.log(`  [${cat}]`);
          const shown = options.verbose ? catFindings.length : Math.min(3, catFindings.length);
          for (let i = 0; i < shown; i++) {
            const f = catFindings[i];
            const relPath = f.file.replace(report.path + '/', '');
            const ctx = f.context !== Context.CODE ? `[${Object.keys(Context).find(k => Context[k] === f.context)}]` : '';
            console.log(`    • ${relPath}:${f.line} ${ctx} - ${f.description}`);
            console.log(`      Match: ${f.match}`);
          }
          if (!options.verbose && catFindings.length > 3) {
            console.log(`    ... and ${catFindings.length - 3} more`);
          }
        }
      }
    }
    
    if (options.showSuppressed && report.suppressedCount > 0) {
      console.log(`\n🔇 SUPPRESSED FINDINGS (${report.suppressedCount}):`);
      const suppressed = report.findings.filter(f => f.suppressed);
      for (const f of suppressed.slice(0, 10)) {
        const relPath = f.file.replace(report.path + '/', '');
        console.log(`  • ${relPath}:${f.line} - ${f.description}`);
        console.log(`    Reason: ${f.suppressionReason}`);
      }
      if (suppressed.length > 10) {
        console.log(`  ... and ${suppressed.length - 10} more`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (report.maxSeverity >= Severity.HIGH) {
      console.log('❌ RECOMMENDATION: Do NOT install this skill without thorough review');
    } else if (report.maxSeverity >= Severity.MEDIUM) {
      console.log('⚠️  RECOMMENDATION: Review flagged items before installing');
    } else {
      console.log('✅ RECOMMENDATION: Skill appears safe to install');
    }
    
    console.log('');
  }
  
  process.exit(report.maxSeverity >= Severity.HIGH ? 1 : 0);
}

module.exports = SkillScanner;
