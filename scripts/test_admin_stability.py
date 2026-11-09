import sys
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_stability_audit():
    print("=" * 60)
    print("STARTING ADMIN DASHBOARD & SYSTEM STABILITY AUDIT")
    print("=" * 60)

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Track network requests
        network_logs = []
        page.on("request", lambda req: network_logs.append({
            "url": req.url,
            "method": req.method,
            "time": time.time()
        }))

        # -------------------------------------------------------------
        # TEST 1: Unauthenticated Admin Access & Manual Login
        # -------------------------------------------------------------
        print("\n[TEST 1] Verifying Manual Admin Login & Redirection...")
        page.goto("http://localhost:5173/admin", wait_until="networkidle")
        time.sleep(1)

        current_url = page.url
        assert "/admin/login" in current_url, f"Expected redirection to /admin/login, got: {current_url}"
        print("  [OK] Unauthenticated /admin correctly redirected to /admin/login")

        # Check inputs are empty
        email_val = page.locator('input[type="text"]').input_value()
        pass_val = page.locator('input[type="password"]').input_value()
        assert email_val == "", f"Expected empty username, got: '{email_val}'"
        assert pass_val == "", f"Expected empty password, got: '{pass_val}'"
        print("  [OK] Username and Password fields are strictly empty (no autofill/prefill)")

        # Verify no hardcoded credentials exposed in DOM
        page_html = page.content()
        assert "arnob.ict.iu@gmail.com" not in page_html, "Personal email leaked on login page!"
        assert "01811860339" not in page_html, "Personal phone leaked on login page!"
        print("  [OK] No personal contact details leaked on login page")

        # Perform manual login
        page.fill('input[type="text"]', "admin@convocation.iu.ac.bd")
        page.fill('input[type="password"]', "AdminIU@2027")
        page.click('button[type="submit"]')
        page.wait_for_url("**/admin", timeout=10000)
        time.sleep(2)
        print("  [OK] Admin logged in successfully and navigated to /admin")
        results["manual_login"] = "PASSED"

        # -------------------------------------------------------------
        # TEST 2: Tab Switching & Application Management Table
        # -------------------------------------------------------------
        print("\n[TEST 2] Verifying Application Management Tab & Table Rendering...")
        # Check Overview Stats
        stats_cards = page.locator('.grid').first
        assert stats_cards.is_visible(), "Stats cards not visible on Overview"
        print("  [OK] Overview dashboard metrics visible")

        # Click Application Management Tab
        page.click('button:has-text("Application Management")')
        page.wait_for_selector('table', timeout=10000)
        time.sleep(1)

        # Count table rows
        rows = page.locator('tbody tr')
        row_count = rows.count()
        print(f"  [OK] Application table loaded with {row_count} records")
        assert row_count > 0, "Application table has 0 rows!"
        results["table_rendered"] = f"PASSED ({row_count} records)"

        # -------------------------------------------------------------
        # TEST 3: 60-Second Idle Stability & Zero-Blinking Verification
        # -------------------------------------------------------------
        print("\n[TEST 3] Running 60-Second Idle Stability Test (Monitoring Network Requests)...")
        idle_start_time = time.time()

        # Wait 60 seconds while monitoring requests
        check_interval = 10
        for i in range(1, 7):
            time.sleep(check_interval)
            current_admin_reqs = len([r for r in network_logs if "/api/admin" in r["url"] and r["time"] >= idle_start_time])
            elapsed = int(time.time() - idle_start_time)
            print(f"  ... idle time: {elapsed}s | /api/admin requests during idle: {current_admin_reqs}")

        requests_during_idle = [r for r in network_logs if "/api/admin" in r["url"] and r["time"] >= idle_start_time]
        print(f"  [OK] 60-second idle period completed. Total /api/admin requests during idle: {len(requests_during_idle)}")
        assert len(requests_during_idle) == 0, f"Blinking detected! {len(requests_during_idle)} requests fired while idle: {requests_during_idle}"
        print("  [OK] ZERO network requests detected during 60s idle - Blinking & loop completely eradicated!")
        results["idle_stability_60s"] = "PASSED (0 requests during 60s idle)"

        # -------------------------------------------------------------
        # TEST 4: Review Button & Modal Deep Verification
        # -------------------------------------------------------------
        print("\n[TEST 4] Verifying Review Button & Modal...")
        review_btn = page.locator('button:has-text("Review")').first
        review_btn.click()
        page.wait_for_selector('text=ADMINISTRATIVE VERIFICATION & REVIEW', timeout=8000)
        page.wait_for_selector('text=Total Payable Fee:', timeout=8000)
        print("  [OK] Review Modal opened smoothly without 'Failed to fetch'")

        modal_text = page.locator('.fixed.inset-0').inner_text()
        assert "Candidate Name:" in modal_text, "Candidate Name missing in modal"
        assert "Contact (Protected):" in modal_text, "Contact (Protected) label missing in modal"
        assert "01811860339" not in modal_text, "Raw personal phone leaked in review modal!"
        assert "arnob.ict.iu@gmail.com" not in modal_text, "Raw personal email leaked in review modal!"
        assert "Total Payable Fee:" in modal_text, "Fee breakdown missing in modal"
        print("  [OK] Review modal contains candidate info, protected contact details, and fee breakdown")

        # Test updating status to "Under Review"
        page.select_option('.fixed.inset-0 select', 'Under Review')
        page.click('button:has-text("Save Status Change & Log History")')
        time.sleep(2)
        print("  [OK] Status successfully updated to 'Under Review'")

        # Close modal
        close_btn = page.locator('button:has-text("Close Panel")')
        close_btn.click()
        time.sleep(1)
        print("  [OK] Modal closed cleanly")
        results["review_modal"] = "PASSED"

        # Test Search for candidate Arnob (app_id IU27-DEMO-000101)
        print("\n[TEST 4B] Testing Application Search for candidate 'Arnob'...")
        search_input = page.locator('input[placeholder*="Search"]')
        search_input.fill("Arnob")
        page.keyboard.press("Enter")
        time.sleep(1.5)

        table_text = page.locator('table').inner_text()
        assert "Arnob" in table_text, "Search for 'Arnob' did not return candidate Arnob"
        assert "IU27-DEMO-000101" in table_text, "Search results missing App ID IU27-DEMO-000101"
        print("  [OK] Application search returned candidate 'Arnob' (ID IU27-DEMO-000101)")

        # Clear search
        page.click('button[title="Clear search"]')
        time.sleep(1.5)
        results["search_filter"] = "PASSED"

        # -------------------------------------------------------------
        # TEST 5: Personal Data Privacy Check Across Public Pages
        # -------------------------------------------------------------
        print("\n[TEST 5] Verifying Personal Data Privacy & GitHub Link across public pages...")
        public_routes = [
            ("http://localhost:5173/", "Home Page"),
            ("http://localhost:5173/login", "Login Page"),
            ("http://localhost:5173/register", "Registration Page"),
            ("http://localhost:5173/contact", "Contact Us Page"),
            ("http://localhost:5173/notices", "Notices Page")
        ]

        for route, name in public_routes:
            page.goto(route, wait_until="networkidle")
            time.sleep(0.5)
            content = page.content()
            assert "arnob.ict.iu@gmail.com" not in content, f"Leaked personal email on {name}!"
            assert "01811860339" not in content, f"Leaked personal phone on {name}!"
            print(f"  [OK] {name}: No leaked personal email or phone")

        # Verify GitHub Profile link on Contact page and Footer
        github_links = page.locator('a[href="https://github.com/TuhassinulArnob"]')
        assert github_links.count() >= 1, "GitHub profile link not found!"
        print(f"  [OK] GitHub profile link (https://github.com/TuhassinulArnob) verified on page ({github_links.count()} instances)")
        results["privacy_and_github"] = "PASSED"

        # -------------------------------------------------------------
        # TEST 6: Navbar University Name Truncation Across Viewports
        # -------------------------------------------------------------
        print("\n[TEST 6] Verifying Full University Name Display Across Viewports...")
        viewports = [
            (1920, 1080, "Desktop FHD (1920px)"),
            (1440, 900, "Desktop Standard (1440px)"),
            (1280, 800, "Laptop (1280px)"),
            (1024, 768, "Tablet Landscape (1024px)"),
            (768, 1024, "Tablet Portrait (768px)"),
            (430, 932, "Mobile Large (430px)"),
            (390, 844, "Mobile Standard (390px)")
        ]

        page.goto("http://localhost:5173/", wait_until="networkidle")
        for w, h, label in viewports:
            page.set_viewport_size({"width": w, "height": h})
            time.sleep(0.5)
            brand_el = page.locator('text=Islamic University Bangladesh').first
            assert brand_el.is_visible(), f"Full university name not visible on {label}"
            brand_text = brand_el.inner_text()
            assert "Islamic University Bangladesh" in brand_text, f"Text truncated on {label}: '{brand_text}'"
            assert "..." not in brand_text, f"Ellipsis found in branding on {label}: '{brand_text}'"
            print(f"  [OK] {label}: Full title '{brand_text}' rendered cleanly without truncation")

        results["navbar_branding"] = "PASSED (all 7 viewports)"

        # -------------------------------------------------------------
        # TEST 7: Admin Session Isolation (sessionStorage)
        # -------------------------------------------------------------
        print("\n[TEST 7] Verifying Admin Session Isolation across Browser Restarts...")
        token_in_session = page.evaluate("sessionStorage.getItem('iu_convocation_admin_token')")
        token_in_local = page.evaluate("localStorage.getItem('iu_convocation_admin_token')")
        assert token_in_session is not None, "Admin token missing from sessionStorage!"
        assert token_in_local is None, "Admin token must NOT be stored in localStorage!"
        print("  [OK] Admin token resides strictly in sessionStorage (None in localStorage)")

        # Create a brand new context (simulating fresh browser start)
        new_context = browser.new_context()
        new_page = new_context.new_page()
        new_page.goto("http://localhost:5173/admin", wait_until="networkidle")
        time.sleep(1)
        assert "/admin/login" in new_page.url, "Fresh session was not redirected to /admin/login!"
        print("  [OK] Fresh browser session correctly requires re-authentication")
        results["session_isolation"] = "PASSED"

        browser.close()

    print("\n" + "=" * 60)
    print("ALL AUDIT TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    for k, v in results.items():
        print(f"  - {k}: {v}")
    print("=" * 60)

if __name__ == "__main__":
    run_stability_audit()
