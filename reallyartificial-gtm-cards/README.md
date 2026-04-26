# ReallyArtificial GTM Cards

Generate consistent “what this repo does” cards for the ReallyArtificial GitHub org.

## What it outputs
Given a repo, it prints 3 copy-paste blocks:
- Card 1: one-line purpose (from README)
- Card 2: first 3 bullet features (from README)
- Card 3: first code block you can “try now”

## Usage
```bash
cd /home/josharsh/.openclaw/workspace/Projects/reallyartificial-gtm-cards
node ra-gtm-cards.js ReallyArtificial/engram
# or
node ra-gtm-cards.js engram

# optional output formats
node ra-gtm-cards.js ReallyArtificial/engram --format github-comment
```

## Example output (shape)
```md
## Card 1 (one-liner)
ReallyArtificial engram: <purpose sentence>

## Card 2 (features)
- <bullet 1>
- <bullet 2>
- <bullet 3>

## Card 3 (try it)
```

## Notes
- Extraction is heuristic (keeps the tool lightweight). If a README has no bullets or code blocks, cards fall back to safe defaults.
- Default output is markdown. Use `--format github-comment` for an idempotent GitHub comment block (wrapped with `<!-- ra-gtm-cards:github-comment --> ... <!-- /ra-gtm-cards:github-comment -->`).
