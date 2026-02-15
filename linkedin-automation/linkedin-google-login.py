#!/usr/bin/env python3
"""Login to LinkedIn with Google account"""

from playwright.sync_api import sync_playwright
import time

EMAIL = "fridayforharsh@gmail.com"
PASSWORD = "xP7J61@0"

def login_linkedin_google():
    with sync_playwright() as p:
        print("Launching Firefox...")
        browser = p.firefox.launch(headless=True)
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        
        page = context.new_page()
        
        try:
            print("Step 1: Going to LinkedIn...")
            page.goto("https://www.linkedin.com/login", timeout=60000)
            page.wait_for_load_state('domcontentloaded')
            time.sleep(3)
            
            page.screenshot(path="/home/josharsh/.openclaw/workspace/step1-linkedin.png")
            print("Screenshot: step1-linkedin.png")
            
            # Look for Google sign-in button
            print("Step 2: Looking for Google sign-in button...")
            
            # Try different selectors for Google sign-in
            google_selectors = [
                'button:has-text("Sign in with Google")',
                'a:has-text("Sign in with Google")',
                '[data-tracking-control-name*="google"]',
                'button[aria-label*="Google"]'
            ]
            
            google_button = None
            for selector in google_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        google_button = selector
                        print(f"Found Google button: {selector}")
                        break
                except:
                    continue
            
            if google_button:
                print("Clicking Google sign-in...")
                page.click(google_button)
                page.wait_for_load_state('domcontentloaded')
                time.sleep(3)
                
                page.screenshot(path="/home/josharsh/.openclaw/workspace/step2-google-oauth.png")
                print("Screenshot: step2-google-oauth.png")
                
                # Google login flow
                print("Step 3: Entering Google email...")
                page.wait_for_selector('input[type="email"]', timeout=10000)
                page.fill('input[type="email"]', EMAIL)
                page.screenshot(path="/home/josharsh/.openclaw/workspace/step3-email-filled.png")
                
                page.click('button:has-text("Next"), #identifierNext')
                time.sleep(3)
                
                print("Step 4: Entering password...")
                page.wait_for_selector('input[type="password"]', timeout=10000)
                page.fill('input[type="password"]', PASSWORD)
                page.screenshot(path="/home/josharsh/.openclaw/workspace/step4-password-filled.png")
                
                page.click('button:has-text("Next"), #passwordNext')
                time.sleep(5)
                
                page.screenshot(path="/home/josharsh/.openclaw/workspace/step5-after-login.png")
                print("Screenshot: step5-after-login.png")
                
                final_url = page.url
                print(f"Final URL: {final_url}")
                
                if "linkedin.com/feed" in final_url or "linkedin.com/checkpoint" in final_url:
                    print("✅ Successfully logged in!")
                else:
                    print(f"⚠️ Ended at: {final_url}")
            else:
                print("⚠️ No Google sign-in button found. Using regular login...")
                # Fallback to regular login
                page.fill('input[name="session_key"]', EMAIL)
                page.fill('input[name="session_password"]', PASSWORD)
                page.screenshot(path="/home/josharsh/.openclaw/workspace/step2-regular-login.png")
                page.click('button[type="submit"]')
                time.sleep(5)
                page.screenshot(path="/home/josharsh/.openclaw/workspace/step3-after-submit.png")
            
            return True
            
        except Exception as e:
            print(f"ERROR: {e}")
            page.screenshot(path="/home/josharsh/.openclaw/workspace/error.png")
            print("Error screenshot saved")
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    success = login_linkedin_google()
    exit(0 if success else 1)
