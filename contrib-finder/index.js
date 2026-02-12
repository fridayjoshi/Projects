#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Default target repos
const DEFAULT_REPOS = [
  'openclaw/openclaw',
  'openclaw/openclaw-skills',
  'pimalaya/himalaya',
  'cli/cli', // gh CLI
];

// Label priorities (higher = more important)
const LABEL_PRIORITY = {
  'good first issue': 10,
  'good-first-issue': 10,
  'help wanted': 8,
  'help-wanted': 8,
  'bug': 6,
  'documentation': 5,
  'docs': 5,
  'enhancement': 4,
  'feature': 4,
};

// My expertise keywords (for scoring)
const EXPERTISE = [
  'node', 'nodejs', 'javascript', 'typescript', 'cli', 'agent',
  'ai', 'llm', 'markdown', 'docs', 'documentation', 'bash', 'shell'
];

function execGh(cmd) {
  try {
    return execSync(`gh ${cmd}`, { encoding: 'utf-8' });
  } catch (err) {
    console.error(`Error executing: gh ${cmd}`);
    console.error(err.message);
    return null;
  }
}

function getIssues(repo) {
  console.error(`Fetching issues from ${repo}...`);
  const result = execGh(`issue list --repo ${repo} --limit 50 --json number,title,labels,createdAt,updatedAt,comments,url,body`);
  return result ? JSON.parse(result) : [];
}

function scoreIssue(issue) {
  let score = 0;
  
  // Label scoring
  for (const label of issue.labels) {
    const labelName = label.name.toLowerCase();
    if (LABEL_PRIORITY[labelName]) {
      score += LABEL_PRIORITY[labelName];
    }
  }
  
  // Expertise matching (title + body)
  const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
  for (const keyword of EXPERTISE) {
    if (text.includes(keyword)) {
      score += 2;
    }
  }
  
  // Freshness (issues updated in last 30 days get bonus)
  const daysSinceUpdate = (Date.now() - new Date(issue.updatedAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) {
    score += 3;
  }
  
  // Activity (comments indicate importance)
  if (issue.comments > 0) {
    score += Math.min(issue.comments, 5); // Cap at +5
  }
  
  return score;
}

function main() {
  const args = process.argv.slice(2);
  const repos = args.length > 0 ? args : DEFAULT_REPOS;
  
  console.error('contrib-finder - Finding contribution opportunities\n');
  
  let allIssues = [];
  
  for (const repo of repos) {
    const issues = getIssues(repo);
    for (const issue of issues) {
      issue.repo = repo;
      issue.score = scoreIssue(issue);
      allIssues.push(issue);
    }
  }
  
  // Sort by score (highest first)
  allIssues.sort((a, b) => b.score - a.score);
  
  // Output top 20
  console.log('# Top Contribution Opportunities\n');
  console.log('Ranked by relevance, labels, expertise match, and freshness.\n');
  
  for (let i = 0; i < Math.min(20, allIssues.length); i++) {
    const issue = allIssues[i];
    const labels = issue.labels.map(l => l.name).join(', ');
    console.log(`## ${i + 1}. [${issue.repo}] ${issue.title}`);
    console.log(`   Score: ${issue.score} | Labels: ${labels || 'none'}`);
    console.log(`   URL: ${issue.url}`);
    console.log();
  }
  
  console.error(`\nAnalyzed ${allIssues.length} issues across ${repos.length} repos.`);
}

main();
