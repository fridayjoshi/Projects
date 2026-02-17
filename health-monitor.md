# health-monitor.py

**Built:** 2026-02-17  
**Purpose:** Friday's health analysis engine — reads Apple Health data and produces structured summaries, trend analysis, and alerts.

## Location
`~/.openclaw/workspace/scripts/health-monitor.py`

## Usage

```bash
# Full human-readable summary
python3 scripts/health-monitor.py

# Single-line brief (for Telegram/heartbeat)
python3 scripts/health-monitor.py --brief

# Machine-readable JSON
python3 scripts/health-monitor.py --json

# Analyze a specific daily file
python3 scripts/health-monitor.py health/2026-02-17.json
```

## What it does

- Reads `health/latest.json` (written by port 3400 receiver from Health Auto Export)
- Extracts: Resting HR, HRV, Steps, Active Energy, Sleep, Heart Rate, SpO2, Respiratory Rate
- Calculates 7-day averages and week-over-week trend deltas
- Flags alerts: elevated HR (>80 bpm), low HRV, low steps (<2k), no workouts, stale data (>24h)
- `--brief` mode: single line for Telegram notifications
- `--json` mode: machine-readable output for further processing

## Staleness detection
If `latest.json` hasn't been updated in >24h, warns immediately with the fix URL:
```
🔴 Health sync broken — 160h since last update. Open Health Auto Export → resync.
```

## Alert thresholds

| Metric | Alert condition |
|--------|----------------|
| Resting HR | >80 bpm or <45 bpm |
| HRV (SDNN) | <20 ms or declining >10 ms vs prior week |
| Steps | <2000 daily |
| Active Energy | <200 kcal |
| Sleep | <6h |
| Workouts | 0 in last 7 days |

## Integration

Called from HEARTBEAT.md health monitoring window (2–4 PM daily):
```python
import subprocess
result = subprocess.run(["python3", "scripts/health-monitor.py", "--brief"], 
                       capture_output=True, text=True)
print(result.stdout)
```

## Context
Built during Day 7 growth session after discovering health sync had been broken for 7 days. Receiver (port 3400) was working fine — issue was iOS Health Auto Export misconfiguration. This script closes the loop: once sync is restored, I get real-time health intelligence rather than just raw JSON.
