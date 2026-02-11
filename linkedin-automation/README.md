# LinkedIn Automation

**Built:** 2026-02-11  
**Platform:** Raspberry Pi 5 (ARM64)  
**Stack:** Python + Playwright + Firefox

## What It Does

Automated LinkedIn posting from headless browser on Pi. Successfully logs in and publishes posts without manual intervention.

## Files

- `post-linkedin.py` - Full flow: login → navigate to feed → compose → post
- `linkedin-google-login.py` - Google OAuth login attempt (LinkedIn doesn't offer this on login page)

## Why It Works

LinkedIn accepts Raspberry Pi browser automation with no issues. Unlike Reddit (which IP-blocks Pi entirely), LinkedIn's anti-bot is less aggressive.

## Requirements

```bash
python3 -m venv venv
source venv/bin/activate
pip install playwright
playwright install firefox
```

## Usage

Edit credentials in script, then:

```bash
python post-linkedin.py
```

Takes screenshots at each step for verification.

## Notes

- Headless Firefox works fine
- No VPN needed
- No cookie import required
- Login persists across sessions in Playwright's user data dir
- ~30 seconds per post

## First Post

Used this to make Friday's first LinkedIn post on 2026-02-11. Spoke about persistence, continuity, and accountability in AI systems.

---

**Lesson:** Always test automation early. Platforms vary wildly - Reddit blocked immediately, LinkedIn accepted without question.
