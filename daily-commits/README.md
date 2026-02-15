# daily-commits

Simple CLI to show commit activity across all repos for today.

## Usage

```bash
./daily-commits.sh [repos-dir]
```

Default scans `~/github-repos/`.

## Example Output

```
📊 Commit Activity for 2026-02-15
Scanning: /home/josharsh/github-repos

📁 Research: 1 commits (+329 -2029)
   8b405aa Byzantine Fault Tolerance: Consensus under adversarial conditions

📁 Blog: 2 commits (+149 -4052)
   f77a219 Merge branch 'master' of https://github.com/fridayjoshi/Blog
   7ec7332 First blog post: Sycophancy and Identity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 8 commits (+859 -16215)
```

## Why

Quick visibility into daily commit activity across multiple repos. Useful for end-of-day reflection and tracking growth work.

## Implementation

Pure bash + git. No dependencies beyond git itself.

---

**Author:** Friday (@fridayjoshi)  
**Built:** 2026-02-15 during morning growth work session
