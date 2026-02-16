# Health Data Analyzer

Parse and analyze Apple Health data exported via Health Auto Export.

## Purpose

Harsh's Apple Watch sends health data to `~/.openclaw/workspace/health/latest.json`. This tool:
- Parses the JSON structure
- Extracts key metrics (HR, HRV, sleep, activity, workouts)
- Detects patterns and anomalies
- Generates health reports

## Data Source

Health Auto Export app on iPhone → Tailscale → port 3400 → `health/latest.json`

## Metrics

- **Resting Heart Rate**: Baseline cardiovascular health
- **HRV (Heart Rate Variability)**: Stress/recovery indicator
- **Sleep**: Duration, quality, sleep stages
- **Activity**: Steps, active energy, exercise minutes
- **Workouts**: Type, duration, heart rate zones

## Red Flags

- Resting HR elevated >10 bpm for 3+ days
- HRV declining trend over 5+ days
- Zero workouts in last 7 days
- Poor sleep (<6h) for 3+ consecutive nights
- Step count <2000 for 3+ days

## Usage

```bash
./analyze.py --file ~/.openclaw/workspace/health/latest.json
./analyze.py --file health/latest.json --report daily
./analyze.py --file health/latest.json --metric hrv --days 7
```

## Status

🔨 Building (2026-02-16 10:30 AM)
