#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

class SkillAuditor {
  constructor(skillPath) {
    this.skillPath = path.resolve(skillPath);
    this.issues = {
      critical: [],
      warning: [],
      info: []
    };
    this.stats = {
      files: 0,
      scripts: 0,
      lines: 0
    };
  }

  // Parse SKILL.md frontmatter
  parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: null, body: content };
    }
    
    try {
      const frontmatter = yaml.load(match[1]);
      return { frontmatter, body: match[2] };
    } catch (error) {
      this.issues.critical.push(`Invalid YAML frontmatter: ${error.message}`);
      return { frontmatter: null, body: match[2] };
    }
  }

  // Check if a command exists on PATH
  commandExists(cmd) {
    try {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  // Detect potential security issues
  checkSecurity(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for hardcoded credentials
    const credPatterns = [
      /api[_-]?key\s*=\s*["'][a-zA-Z0-9]{20,}["']/i,
      /password\s*=\s*["'][^"']+["']/i,
      /token\s*=\s*["'][a-zA-Z0-9]{20,}["']/i,
      /secret\s*=\s*["'][^"']+["']/i
    ];
    
    credPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push(`Possible hardcoded credential in ${path.basename(filePath)}`);
      }
    });
    
    // Check for dangerous commands
    const dangerousPatterns = [
      { pattern: /rm\s+-rf\s+[^\s]*\//g, msg: 'Dangerous rm -rf command' },
      { pattern: /curl[^|]*\|\s*bash/g, msg: 'Piping curl to bash' },
      { pattern: /wget[^|]*\|\s*sh/g, msg: 'Piping wget to shell' },
      { pattern: /eval\s*\(/g, msg: 'Using eval()' },
      { pattern: /exec\s*\(/g, msg: 'Using exec()' }
    ];
    
    dangerousPatterns.forEach(({ pattern, msg }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`${msg} in ${path.basename(filePath)}`);
      }
    });
    
    return issues;
  }

  // Check Python script imports
  checkPythonScript(scriptPath) {
    const content = fs.readFileSync(scriptPath, 'utf8');
    const issues = [];
    
    // Check for shebang
    if (!content.startsWith('#!')) {
      issues.push(`Missing shebang in ${path.basename(scriptPath)}`);
    }
    
    // Extract imports
    const importMatches = content.match(/^(?:import|from)\s+(\w+)/gm);
    if (importMatches) {
      const imports = importMatches.map(m => m.split(/\s+/)[1]);
      const stdLibs = ['os', 'sys', 'json', 're', 'time', 'datetime', 'pathlib', 'argparse'];
      const thirdParty = imports.filter(imp => !stdLibs.includes(imp));
      
      if (thirdParty.length > 0) {
        issues.push(`Third-party imports detected: ${thirdParty.join(', ')} (document installation)`);
      }
    }
    
    return issues;
  }

  // Audit SKILL.md
  auditSkillMd() {
    const skillMdPath = path.join(this.skillPath, 'SKILL.md');
    
    if (!fs.existsSync(skillMdPath)) {
      this.issues.critical.push('SKILL.md not found');
      return;
    }
    
    const content = fs.readFileSync(skillMdPath, 'utf8');
    this.stats.files++;
    this.stats.lines += content.split('\n').length;
    
    const { frontmatter, body } = this.parseFrontmatter(content);
    
    // Check required frontmatter fields
    if (!frontmatter) {
      this.issues.critical.push('No frontmatter found');
      return;
    }
    
    if (!frontmatter.name) {
      this.issues.critical.push('Missing required field: name');
    } else if (!/^[a-z0-9-]+$/.test(frontmatter.name)) {
      this.issues.warning.push('Skill name should be lowercase with hyphens only');
    }
    
    if (!frontmatter.description) {
      this.issues.critical.push('Missing required field: description');
    } else if (frontmatter.description.length < 10) {
      this.issues.warning.push('Description is too short (< 10 chars)');
    } else if (frontmatter.description.length > 200) {
      this.issues.warning.push('Description is too long (> 200 chars)');
    }
    
    // Check metadata if present
    if (frontmatter.metadata) {
      let metadata;
      if (typeof frontmatter.metadata === 'string') {
        try {
          metadata = JSON.parse(frontmatter.metadata);
        } catch {
          this.issues.critical.push('metadata must be valid single-line JSON');
        }
      } else {
        metadata = frontmatter.metadata;
      }
      
      if (metadata && metadata.openclaw) {
        const oc = metadata.openclaw;
        
        // Check required bins
        if (oc.requires && oc.requires.bins) {
          oc.requires.bins.forEach(bin => {
            if (!this.commandExists(bin)) {
              this.issues.warning.push(`Required binary '${bin}' not found on PATH`);
            }
          });
        }
        
        // Check required env vars
        if (oc.requires && oc.requires.env) {
          oc.requires.env.forEach(envVar => {
            if (!process.env[envVar]) {
              this.issues.info.push(`Required env var '${envVar}' not set`);
            }
          });
        }
      }
    }
    
    // Check documentation quality
    if (body.length < 50) {
      this.issues.warning.push('Documentation body is too short (< 50 chars)');
    }
    
    // Check for examples
    if (!body.includes('```') && !body.includes('Example')) {
      this.issues.warning.push('No code examples found in documentation');
    }
    
    // Check for broken file references
    const fileRefPattern = /((?:scripts?\/|\.\/|{baseDir}\/)([^\s`"'\)]+))/g;
    let match;
    const checkedPaths = new Set();
    while ((match = fileRefPattern.exec(body)) !== null) {
      const fullRef = match[1];
      const refPath = fullRef.replace('{baseDir}', '.');
      
      // Skip duplicates
      if (checkedPaths.has(refPath)) continue;
      checkedPaths.add(refPath);
      
      const fullPath = path.join(this.skillPath, refPath);
      if (!fs.existsSync(fullPath)) {
        this.issues.warning.push(`Referenced file not found: ${refPath}`);
      }
    }
  }

  // Audit scripts directory
  auditScripts() {
    const scriptsDir = path.join(this.skillPath, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      return;
    }
    
    const files = fs.readdirSync(scriptsDir);
    files.forEach(file => {
      const filePath = path.join(scriptsDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        this.stats.files++;
        this.stats.scripts++;
        
        // Check executability
        const isExecutable = (stat.mode & 0o111) !== 0;
        if (!isExecutable) {
          this.issues.warning.push(`Script not executable: scripts/${file}`);
        }
        
        // Security checks
        const securityIssues = this.checkSecurity(filePath);
        securityIssues.forEach(issue => {
          this.issues.critical.push(issue);
        });
        
        // Python-specific checks
        if (file.endsWith('.py')) {
          const pythonIssues = this.checkPythonScript(filePath);
          pythonIssues.forEach(issue => {
            this.issues.info.push(issue);
          });
        }
      }
    });
  }

  // Run full audit
  audit() {
    console.log(`\nAuditing skill: ${path.basename(this.skillPath)}\n`);
    
    this.auditSkillMd();
    this.auditScripts();
    
    return this.getReport();
  }

  // Generate report
  getReport() {
    const totalIssues = this.issues.critical.length + this.issues.warning.length + this.issues.info.length;
    
    const report = {
      skill: path.basename(this.skillPath),
      path: this.skillPath,
      issues: this.issues,
      stats: this.stats,
      summary: {
        total: totalIssues,
        critical: this.issues.critical.length,
        warning: this.issues.warning.length,
        info: this.issues.info.length
      },
      passed: this.issues.critical.length === 0
    };
    
    return report;
  }

  // Print report to console
  printReport(report) {
    const { chalk } = require('chalk');
    
    console.log(`📊 Stats:`);
    console.log(`  Files: ${report.stats.files}`);
    console.log(`  Scripts: ${report.stats.scripts}`);
    console.log(`  Lines: ${report.stats.lines}\n`);
    
    if (report.issues.critical.length > 0) {
      console.log(`🔴 Critical Issues (${report.issues.critical.length}):`);
      report.issues.critical.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
    }
    
    if (report.issues.warning.length > 0) {
      console.log(`⚠️  Warnings (${report.issues.warning.length}):`);
      report.issues.warning.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
    }
    
    if (report.issues.info.length > 0) {
      console.log(`ℹ️  Info (${report.issues.info.length}):`);
      report.issues.info.forEach(issue => console.log(`  - ${issue}`));
      console.log('');
    }
    
    if (report.summary.total === 0) {
      console.log('✅ No issues found!\n');
    } else {
      console.log(`${report.passed ? '✅' : '❌'} ${report.summary.total} total issues\n`);
    }
    
    return report.passed;
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
skill-auditor - Audit OpenClaw skills for quality and security

Usage:
  skill-auditor <skill-path>
  skill-auditor --all

Examples:
  skill-auditor ~/.openclaw/workspace/skills/my-skill
  skill-auditor ./skills/github
  skill-auditor --all  # audit all skills in workspace
    `);
    process.exit(0);
  }
  
  if (args[0] === '--all') {
    const skillsDir = path.join(process.env.HOME, '.openclaw/workspace/skills');
    const skills = fs.readdirSync(skillsDir).filter(name => {
      return fs.statSync(path.join(skillsDir, name)).isDirectory();
    });
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    skills.forEach(skillName => {
      const skillPath = path.join(skillsDir, skillName);
      const auditor = new SkillAuditor(skillPath);
      const report = auditor.audit();
      const passed = auditor.printReport(report);
      
      if (passed) totalPassed++;
      else totalFailed++;
    });
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Summary: ${totalPassed} passed, ${totalFailed} failed`);
    process.exit(totalFailed > 0 ? 1 : 0);
  } else {
    const skillPath = args[0];
    const auditor = new SkillAuditor(skillPath);
    const report = auditor.audit();
    const passed = auditor.printReport(report);
    
    process.exit(passed ? 0 : 1);
  }
}

module.exports = SkillAuditor;
