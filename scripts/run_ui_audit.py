import os
import time
from playwright.sync_api import sync_playwright

OUTPUT_DIR = r"C:\Users\USER\Desktop\Projects\Convocation\screenshots\ui-audit"
os.makedirs(OUTPUT_DIR, exist_ok=True)

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "mobile": {"width": 390, "height": 844, "is_mobile": True, "has_touch": True}
}

PAGES = [
    ("01_homepage", "/"),
    ("02_notices", "/notices"),
    ("03_guidelines", "/guidelines"),
    ("04_fees", "/fees"),
    ("05_schedule", "/schedule"),
    ("06_contact", "/contact"),
    ("07_signin", "/login"),
    ("08_registration", "/register"),
]

def run_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for vp_name, vp_cfg in VIEWPORTS.items():
            print(f"\n==========================================")
            print(f"Starting UI Audit for Viewport: {vp_name.upper()}")
            print(f"==========================================")
            
            context = browser.new_context(
                viewport={"width": vp_cfg["width"], "height": vp_cfg["height"]},
                is_mobile=vp_cfg.get("is_mobile", False),
                has_touch=vp_cfg.get("has_touch", False)
            )
            page = context.new_page()

            # 1 to 8: Public Pages
            for slug, path in PAGES:
                url = f"http://127.0.0.1:5173{path}"
                print(f"Capturing [{vp_name}] {slug} -> {url}")
                page.goto(url, wait_until="networkidle")
                time.sleep(1) # wait for fonts & countdown to settle
                out_path = os.path.join(OUTPUT_DIR, f"{slug}_{vp_name}.png")
                page.screenshot(path=out_path, full_page=False)
                print(f"Saved: {out_path}")

            # 9: Public Application Tracking
            track_url = "http://127.0.0.1:5173/track-application"
            print(f"Capturing [{vp_name}] 12_application_tracking -> {track_url}")
            page.goto(track_url, wait_until="networkidle")
            page.fill("input[placeholder*='IU27-DEMO']", "IU27-DEMO-000101")
            page.click("button:has-text('Track Application')")
            time.sleep(1.5)
            out_path = os.path.join(OUTPUT_DIR, f"12_application_tracking_{vp_name}.png")
            page.screenshot(path=out_path, full_page=False)
            print(f"Saved: {out_path}")

            # 10: Sign in as Demo Student to get Student Dashboard
            print(f"Logging in as Student [{vp_name}]...")
            page.goto("http://127.0.0.1:5173/login", wait_until="networkidle")
            page.click("button:has-text('Student Demo')")
            time.sleep(0.5)
            page.click("button[type='submit']")
            page.wait_for_url("**/dashboard", timeout=10000)
            time.sleep(1.5)
            out_path = os.path.join(OUTPUT_DIR, f"09_student_dashboard_{vp_name}.png")
            page.screenshot(path=out_path, full_page=False)
            print(f"Saved: {out_path}")

            # 11: Payment Simulation Modal / View
            print(f"Capturing Payment Modal [{vp_name}]...")
            page.click("button:has-text('New Simulation')")
            time.sleep(1.5)
            out_path = os.path.join(OUTPUT_DIR, f"10_payment_modal_{vp_name}.png")
            page.screenshot(path=out_path, full_page=False)
            print(f"Saved: {out_path}")
            # Close modal
            page.keyboard.press("Escape")
            time.sleep(0.5)

            # 12: Admin Dashboard
            print(f"Logging in as Admin [{vp_name}]...")
            page.goto("http://127.0.0.1:5173/admin/login", wait_until="networkidle")
            time.sleep(0.5)
            page.click("button[type='submit']")
            page.wait_for_url("**/admin", timeout=10000)
            time.sleep(1.5)
            out_path = os.path.join(OUTPUT_DIR, f"11_admin_dashboard_{vp_name}.png")
            page.screenshot(path=out_path, full_page=False)
            print(f"Saved: {out_path}")

            context.close()

        browser.close()
        print("\nAll UI Audit screenshots captured successfully!")

if __name__ == "__main__":
    run_audit()
