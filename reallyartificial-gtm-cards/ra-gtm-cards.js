#!/usr/bin/env node
const { execSync } = require('child_process');

function usageAndExit() {
  console.error('Usage: ra-gtm-cards <ReallyArtificial/repo|repo>');
  process.exit(1);
}

const arg = process.argv[2];
if (!arg) usageAndExit();

let owner = 'ReallyArtificial';
let repo = arg;
if (arg.includes('/')) {
  const parts = arg.split('/').filter(Boolean);
  if (parts.length !== 2) usageAndExit();
  owner = parts[0];
  repo = parts[1];
}

function ghReadmeBase64(o, r) {
  // Returns base64-encoded README content (GitHub provides UTF-8 in most cases)
  const b64 = execSync(`gh api repos/${o}/${r}/readme --jq .content`, {
    stdio: ['ignore', 'pipe', 'inherit'],
    encoding: 'utf8',
  }).trim();
  return b64;
}

function mdToText(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ') // remove code blocks for paragraph heuristics
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_#>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(text) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/([^.!?]{10,160}[.!?])/);
  if (m) return m[1].trim();
  // fallback: first 120 chars
  return cleaned.slice(0, 120).replace(/[,;:]*$/, '').trim() + (cleaned.length > 120 ? '...' : '');
}

function extractPurposeMarkdown(readmeMd) {
  const lines = readmeMd.split(/\r?\n/);
  const maxScan = Math.min(lines.length, 600);

  // Prefer a line that looks like a purpose/description.
  const purposeLike = lines
    .slice(0, maxScan)
    .map(l => l.trim())
    .filter(Boolean)
    .find(l => /^purpose\b/i.test(l) || /^what it does\b/i.test(l) || /^description\b/i.test(l));

  if (purposeLike) return purposeLike.replace(/^\w+\s*:\s*/i, '').trim();

  // Otherwise: take the first non-empty paragraph in the raw readme.
  const paragraphs = readmeMd
    .split(/\n\s*\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return '';
  // Use sentence extraction on the first paragraph.
  const text = mdToText(paragraphs[0]);
  return firstSentence(text);
}

function extractBullets(readmeMd) {
  const lines = readmeMd.split(/\r?\n/);
  const bullets = [];
  for (const raw of lines) {
    const l = raw.trim();
    const m = l.match(/^([-*•])\s+(.+)$/);
    if (!m) continue;

    const content = m[2].trim();
    if (!content) continue;
    if (/^\[\s*[\sxX]\s*\]/.test(content)) continue; // skip checkboxes
    if (/^https?:\/\//i.test(content)) continue;

    bullets.push(content);
    if (bullets.length >= 3) break;
  }
  return bullets;
}

function extractFirstCodeBlock(readmeMd) {
  const m = readmeMd.match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/);
  if (!m) return null;
  const code = m[1].trim();
  if (!code) return null;
  return code;
}

const b64 = ghReadmeBase64(owner, repo);
const readme = Buffer.from(b64, 'base64').toString('utf8');

const purpose = extractPurposeMarkdown(readme);
const oneLiner = `${owner} ${repo}: ${purpose}`.replace(/\s+/g, ' ').trim();

const bullets = extractBullets(readme);
const code = extractFirstCodeBlock(readme);

const card2 = bullets.length
  ? bullets.map(b => `- ${b}`).join('\n')
  : '- (No obvious bullet list found in the first pass)';

const card3 = code
  ? code
  : '# Try it: (No code block found - check README Usage/Install section)';

const out = [
  `## Card 1 (one-liner)`,
  `${oneLiner}`,
  '',
  `## Card 2 (features)`,
  `${card2}`,
  '',
  `## Card 3 (try it)`,
  '```',
  `${card3}`,
  '```',
  '',
].join('\n');

process.stdout.write(out);
