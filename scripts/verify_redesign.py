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
        page.wait_for_timeout(800)

        notices_hero_path = os.path.join(OUTPUT_DIR, "01_notices_header_hero_1920.png")
        page.screenshot(path=notices_hero_path, clip={"x": 0, "y": 0, "width": 1920, "height": 400})
        print(f"    Saved: {notices_hero_path}")

        print("[*] 2. Verifying Sticky Navbar Behavior on Scroll...")
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(400)
        sticky_path = os.path.join(OUTPUT_DIR, "02_sticky_navbar_scrolled.png")
        page.locator("header").screenshot(path=sticky_path)
        print(f"    Saved: {sticky_path}")

        print("[*] 3. Verifying Homepage Hero & Proportions...")
        page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        page.wait_for_timeout(800)
        home_hero_path = os.path.join(OUTPUT_DIR, "03_home_hero_1920.png")
        page.screenshot(path=home_hero_path, clip={"x": 0, "y": 0, "width": 1920, "height": 680})
        print(f"    Saved: {home_hero_path}")

        print("[*] 4. Verifying Refined Footer...")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(400)
        footer_path = os.path.join(OUTPUT_DIR, "04_refined_footer.png")
        footer_elem = page.locator("footer")
        footer_elem.screenshot(path=footer_path)
        print(f"    Saved: {footer_path}")

        print("[*] 5. Verifying Desktop & Laptop Viewports (1440, 1366, 1280)...")
        for w, h in [(1440, 900), (1366, 768), (1280, 800)]:
            vp_page = context.new_page()
            vp_page.set_viewport_size({"width": w, "height": h})
            vp_page.goto("http://127.0.0.1:5173/notices", wait_until="networkidle")
            vp_page.wait_for_timeout(400)

            # Ensure Registration button and Sign In button are visible and properly sized
            sign_in_btn = vp_page.locator("header a:has-text('Sign In')").first
            reg_btn = vp_page.locator("header a:has-text('Registration')").last
            box_sign = sign_in_btn.bounding_box()
            box_reg = reg_btn.bounding_box()
            print(f"    [{w}px] Sign In button: width={box_sign['width']:.1f}px, height={box_sign['height']:.1f}px, x={box_sign['x']:.1f}, y={box_sign['y']:.1f}")
            print(f"    [{w}px] Registration button: width={box_reg['width']:.1f}px, height={box_reg['height']:.1f}px, right={box_reg['x'] + box_reg['width']:.1f}, winWidth={w}, y={box_reg['y']:.1f}")
            assert box_reg['x'] + box_reg['width'] <= w, f"Registration button overflowed on {w}px!"
            assert box_sign['width'] >= 100, f"Sign In button width ({box_sign['width']}px) is less than 100px!"
            assert box_sign['height'] == box_reg['height'], f"Button heights do not match: {box_sign['height']} != {box_reg['height']}"

            shot_path = os.path.join(OUTPUT_DIR, f"05_navbar_{w}px.png")
            vp_page.screenshot(path=shot_path, clip={"x": 0, "y": 0, "width": w, "height": 140})
            print(f"    Saved: {shot_path}")
            vp_page.close()

        print("[*] 6. Verifying Tablet & Mobile Viewports...")
        mob_viewports = [
            ("1024_tablet", 1024, 768),
            ("768_tablet", 768, 1024),
            ("430_mobile", 430, 932),
            ("390_mobile", 390, 844),
            ("360_mobile", 360, 800)
        ]

        for label, w, h in mob_viewports:
            vp_page = context.new_page()
            vp_page.set_viewport_size({"width": w, "height": h})
            vp_page.goto("http://127.0.0.1:5173/notices", wait_until="networkidle")
            vp_page.wait_for_timeout(400)

            shot = os.path.join(OUTPUT_DIR, f"06_view_{label}.png")
            vp_page.screenshot(path=shot, clip={"x": 0, "y": 0, "width": w, "height": min(550, h)})
            print(f"    Saved: {shot}")

            # Test hamburger menu
            menu_btn = vp_page.locator("button[aria-label='Toggle navigation menu']")
            if menu_btn.is_visible():
                menu_btn.click()
                vp_page.wait_for_timeout(300)
                drawer_shot = os.path.join(OUTPUT_DIR, f"07_drawer_{label}.png")
                vp_page.screenshot(path=drawer_shot, clip={"x": 0, "y": 0, "width": w, "height": min(650, h)})
                print(f"    Saved: {drawer_shot}")

            vp_page.close()

        print("[*] 7. Verifying Registration Status Badges and Deadlines across pages...")
        # Check Home page
        page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        page.wait_for_timeout(400)
        content_home = page.content()
        assert "REGISTRATION STARTED" in content_home, "REGISTRATION STARTED missing from Home page!"
        assert "25 November 2026" in content_home, "Deadline 25 November 2026 missing from Home page!"
        assert "opens on 10 Nov" not in content_home, "Outdated 'opens on 10 Nov' found on Home page!"
        print("    [Home] REGISTRATION STARTED & 25 November 2026 verified.")

        # Check Register Wizard Step 1
        page.goto("http://127.0.0.1:5173/register", wait_until="networkidle")
        page.wait_for_timeout(400)
        content_reg = page.content()
        assert "REGISTRATION STARTED" in content_reg, "REGISTRATION STARTED missing from Register page!"
        assert "25 November 2026" in content_reg, "Deadline 25 November 2026 missing from Register page!"
        print("    [Register Wizard] REGISTRATION STARTED & 25 November 2026 verified.")

        # Check Notices Page
        page.goto("http://127.0.0.1:5173/notices", wait_until="networkidle")
        page.wait_for_timeout(400)
        content_notices = page.content()
        assert "REGISTRATION STARTED" in content_notices, "REGISTRATION STARTED missing from Notices page!"
        assert "25 November 2026" in content_notices, "Deadline 25 November 2026 missing from Notices page!"
        print("    [Notices] REGISTRATION STARTED & 25 November 2026 verified.")

        # Check Schedule Page
        page.goto("http://127.0.0.1:5173/schedule", wait_until="networkidle")
        page.wait_for_timeout(400)
        content_sched = page.content()
        assert "REGISTRATION STARTED" in content_sched, "REGISTRATION STARTED missing from Schedule page!"
        assert "25 November 2026" in content_sched, "Deadline 25 November 2026 missing from Schedule page!"
        print("    [Schedule] REGISTRATION STARTED & 25 November 2026 verified.")

        browser.close()
        print("\n[OK] All verification tests passed cleanly!")

if __name__ == "__main__":
    run()
