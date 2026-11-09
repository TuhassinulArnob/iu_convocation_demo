import sys
import os
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "screenshots", "redesign_verification")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        print("[*] 1. Verifying Notices Page (Direct Reference Match)...")
        page.goto("http://127.0.0.1:5173/notices", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Capture top header + hero comparison crop
        notices_hero_path = os.path.join(OUTPUT_DIR, "01_notices_header_hero_1920.png")
        page.screenshot(path=notices_hero_path, clip={"x": 0, "y": 0, "width": 1920, "height": 450})
        print(f"    Saved: {notices_hero_path}")

        notices_full_path = os.path.join(OUTPUT_DIR, "01_notices_full_1920.png")
        page.screenshot(path=notices_full_path, full_page=True)
        print(f"    Saved: {notices_full_path}")

        print("[*] 2. Verifying Sticky Navbar Behavior on Scroll...")
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(500)
        sticky_path = os.path.join(OUTPUT_DIR, "02_sticky_navbar_scrolled.png")
        page.screenshot(path=sticky_path, clip={"x": 0, "y": 0, "width": 1920, "height": 200})
        print(f"    Saved: {sticky_path}")

        print("[*] 3. Verifying Homepage Hero & Proportions...")
        page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        page.wait_for_timeout(800)
        home_hero_path = os.path.join(OUTPUT_DIR, "03_home_hero_1920.png")
        page.screenshot(path=home_hero_path, clip={"x": 0, "y": 0, "width": 1920, "height": 750})
        print(f"    Saved: {home_hero_path}")

        print("[*] 4. Verifying Guidelines, Fees, Schedule, Contact...")
        for route, name in [
            ("/guidelines", "04_guidelines"),
            ("/fees", "05_fees"),
            ("/schedule", "06_schedule"),
            ("/contact", "07_contact")
        ]:
            page.goto(f"http://127.0.0.1:5173{route}", wait_until="networkidle")
            page.wait_for_timeout(600)
            shot_path = os.path.join(OUTPUT_DIR, f"{name}_hero_1920.png")
            page.screenshot(path=shot_path, clip={"x": 0, "y": 0, "width": 1920, "height": 450})
            print(f"    Saved: {shot_path}")

        print("[*] 5. Verifying Responsive Viewports...")
        viewports = [
            ("1440_desktop", 1440, 900),
            ("1024_tablet_ls", 1024, 768),
            ("768_tablet_pt", 768, 1024),
            ("430_mobile_lg", 430, 932),
            ("390_mobile_md", 390, 844),
            ("360_mobile_sm", 360, 800)
        ]

        for label, w, h in viewports:
            vp_page = context.new_page()
            vp_page.set_viewport_size({"width": w, "height": h})
            vp_page.goto("http://127.0.0.1:5173/notices", wait_until="networkidle")
            vp_page.wait_for_timeout(500)
            vp_shot = os.path.join(OUTPUT_DIR, f"08_notices_{label}.png")
            vp_page.screenshot(path=vp_shot, clip={"x": 0, "y": 0, "width": w, "height": min(650, h)})
            print(f"    Saved: {vp_shot} ({w}x{h})")

            # On mobile, test hamburger toggle
            if w <= 768:
                menu_btn = vp_page.locator("button[aria-label='Toggle navigation menu']")
                if menu_btn.is_visible():
                    menu_btn.click()
                    vp_page.wait_for_timeout(300)
                    drawer_shot = os.path.join(OUTPUT_DIR, f"09_drawer_{label}.png")
                    vp_page.screenshot(path=drawer_shot, clip={"x": 0, "y": 0, "width": w, "height": min(750, h)})
                    print(f"    Saved: {drawer_shot} (Mobile Drawer Open)")

            vp_page.close()

        browser.close()
        print("\n[OK] All redesign verification screenshots captured successfully!")

if __name__ == "__main__":
    run()
