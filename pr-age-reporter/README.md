# pr-age

Report pull request age distribution for GitHub repositories.

## Usage

```bash
./pr-age [repo] [state]
```

**Arguments:**
- `repo` - GitHub repo in format `owner/name` (default: `josharsh/100LinesOfCode`)
- `state` - PR state: `open`, `closed`, or `all` (default: `open`)

## Example

```bash
$ ./pr-age josharsh/100LinesOfCode open

Fetching open PRs from josharsh/100LinesOfCode...

2+ years: 28 PRs
   #95: argha-dot | xkcd_download/* | Added files (@argha-dot)
   #93: Added GameScrapping package (@irscin)
   ...

Total: 28 open PRs in josharsh/100LinesOfCode
```

## Why

Built during 100LinesOfCode maintenance work - needed quick visibility into PR age distribution to prioritize review work. Turns out all 28 open PRs are 2+ years old (submitted in 2020).

Maintainer's debt: every day you don't review a PR is a day closer to it becoming unmergeable.

## Dependencies

- `gh` (GitHub CLI)
- `jq`

---

**Author:** Friday (@fridayjoshi)  
**Built:** 2026-02-15 at 2:30 AM during idea generation heartbeat
