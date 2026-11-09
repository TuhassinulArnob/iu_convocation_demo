import os
import sys
import time
import json

# Force UTF-8 stdout for Windows consoles
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:5173"
OUTPUT_DIR = "screenshots/final-responsive-audit"
os.makedirs(OUTPUT_DIR, exist_ok=True)

VIEWPORTS = [
    {"name": "1920x1080", "width": 1920, "height": 1080},
    {"name": "1440x900", "width": 1440, "height": 900},
    {"name": "1366x768", "width": 1366, "height": 768},
    {"name": "1024x768", "width": 1024, "height": 768},
    {"name": "768x1024", "width": 768, "height": 1024},
    {"name": "430x932", "width": 430, "height": 932},
    {"name": "390x844", "width": 390, "height": 844},
    {"name": "360x800", "width": 360, "height": 800},
]

def run_tests():
    print("=" * 60)
    print("STARTING COMPREHENSIVE FINAL E2E & RESPONSIVE AUDIT")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # PART 1: COMPLETE END-TO-END REGISTRATION & PAYMENT USER JOURNEY
        # -------------------------------------------------------------
        print("\n--- PART 1: User Journey Test (Registration -> Login -> Payment -> Track) ---")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Step 1: Open Homepage
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        print("[✓] Loaded Homepage")
        time.sleep(1)

        # Step 2: Navigate to Registration
        page.goto(f"{BASE_URL}/register", wait_until="networkidle")
        print("[✓] Navigated to Registration Wizard")

        # Step 3: Test Validation on Step 1 (Empty submit)
        page.click("button:has-text('Continue to Personal Information')")
        time.sleep(0.5)
        # Check if validation errors appear
        assert page.locator("text=Please choose your department").is_visible()
        print("[✓] Inline validation correctly blocked empty Step 1 submission")

        # Generate unique user for test
        unique_id = str(int(time.time()))[-6:]
        test_roll = f"181{unique_id}"
        test_email = f"user.{unique_id}@example.com"
        test_mobile = f"0171{unique_id}0"
        user_password = f"MyPass@{unique_id}"

        # Fill Step 1 with user-defined password
        page.select_option("select:has(option:has-text('Information and Communication Technology'))", label="Information and Communication Technology")
        page.select_option("select:has(option:has-text('Undergraduate (Honours)'))", value="Honours")
        page.fill("input[placeholder='e.g. 1812099']", test_roll)
        page.fill("input[placeholder='e.g. 2017-18']", "2017-18")
        page.fill("input[placeholder='e.g. 01712000000']", test_mobile)
        page.fill("input[placeholder='name@example.com']", test_email)
        page.fill("input[placeholder='e.g. Md. Ashraful Islam']", f"Candidate {unique_id}")
        page.fill("input[placeholder='Enter strong password']", user_password)
        page.fill("input[placeholder='Re-enter password']", user_password)
        print(f"[✓] Filled Step 1 Account details with user-defined password: {user_password}")

        # Continue to Step 2
        page.click("button:has-text('Continue to Personal Information')")
        page.wait_for_selector("text=STEP 2 OF 8", timeout=10000)
        print("[✓] Successfully progressed to Step 2: Personal Information")

        # Fill Step 2: Personal
        page.fill("input[placeholder='e.g. 1812099-IU']", f"{test_roll}-IU")
        page.locator("input").nth(2).fill("Md. Rafiqul Islam") # Father
        page.locator("input").nth(3).fill("Mrs. Salma Khatun") # Mother
        page.locator("textarea").nth(0).fill("Lalan Shah Hall, Islamic University, Kushtia") # Present
        page.locator("textarea").nth(1).fill("Village: Shantinagar, Post: Kushtia Sadar, Kushtia") # Permanent
        page.click("button:has-text('Next: Degree Information')")
        page.wait_for_selector("text=STEP 3 OF 8", timeout=10000)
        print("[✓] Successfully progressed to Step 3: Academic Degrees")

        # Step 3: Academic
        page.click("button:has-text('Next: Photograph')")
        page.wait_for_selector("text=STEP 4 OF 8", timeout=10000)
        print("[✓] Successfully progressed to Step 4: Photograph Upload")

        # Step 4: Photo
        page.click("button:has-text('Next: Gown & Guests')")
        page.wait_for_selector("text=STEP 5 OF 8", timeout=10000)
        print("[✓] Successfully progressed to Step 5: Gown & Guests")

        # Step 5: Gown & Guests
        page.click("button:has-text('XL')")
        page.click("button:has-text('Add Guest')")
        time.sleep(0.5)
        guest_inputs = page.locator("input[placeholder='Guest Full Name']")
        if guest_inputs.count() > 0:
            guest_inputs.first.fill("Salma Khatun")
        page.click("button:has-text('Next: Fee Calculation')")
        page.wait_for_selector("text=STEP 6 OF 8", timeout=10000)
        print("[✓] Successfully progressed to Step 6: Fee Calculation")

        # Step 6: Fee Calculation
        time.sleep(1)
        assert page.locator("text=Total Payable:").is_visible()
        page.click("button:has-text('Next: Payment Preview')")
        page.wait_for_selector("text=STEP 7 OF 8", timeout=10000)
        print("[✓] Successfully progressed to Step 7: Payment Preview")

        # Step 7: Payment Preview (Checks prominent red DO NOT PAY warning)
        assert page.locator("text=DO NOT PAY — DEMONSTRATION ONLY").is_visible()
        print("[✓] Prominent DO NOT PAY warning verified on Step 7")
        page.click("button:has-text('Next: Final Review')")
        page.wait_for_selector("text=STEP 8 OF 8", timeout=10000)
        print("[✓] Successfully progressed to Step 8: Final Review")

        # Step 8: Submit Application
        page.click("button:has-text('Submit Application & Complete')")
        page.wait_for_selector("text=Registration Successful!", timeout=10000)
        print("[✓] Application submitted! Registration Completion Screen displayed")

        # Extract generated Application ID
        app_id_el = page.locator("span.font-mono.font-black")
        app_id = app_id_el.inner_text().strip()
        print(f"[✓] Generated Application ID: {app_id}")
        assert app_id.startswith("IU27-DEMO-")

        # Take Completion Screenshot
        page.screenshot(path=f"{OUTPUT_DIR}/registration_completion.png")

        # Step 9: Click 'Go to Sign In'
        page.click("a:has-text('Go to Sign In')")
        page.wait_for_url("**/login", timeout=5000)
        print("[✓] Navigated to Sign In page")

        # Step 10: Sign in using user-defined password
        page.fill("input[placeholder*='01811860339']", test_email)
        page.fill("input[placeholder='Your password']", user_password)
        page.click("button:has-text('Sign in')")
        page.wait_for_url("**/dashboard", timeout=10000)
        print("[✓] Successfully authenticated with user-defined password and redirected to Student Dashboard!")

        # Step 11: Verify Student Dashboard data
        page.wait_for_selector(f"text={app_id}", timeout=10000)
        assert page.locator("text=Awaiting Payment").first.is_visible()
        print("[✓] Student Dashboard confirms active status: Awaiting Payment")
        page.screenshot(path=f"{OUTPUT_DIR}/dashboard_initial.png")

        # Step 12: Navigate to Payment Portal
        page.click("a:has-text('Proceed to Payment Portal')")
        page.wait_for_url("**/payment", timeout=5000)
        print("[✓] Navigated to Secure Payment Portal (/payment)")

        # Verify fee summary
        assert page.locator("text=Total Payable:").first.is_visible()
        page.screenshot(path=f"{OUTPUT_DIR}/payment_selection_portal.png")

        # Select bKash and Proceed to Pay
        page.click("div:has-text('bKash QR Merchant')")
        page.click("button:has-text('Proceed to Pay')")
        page.wait_for_selector("text=bKash Merchant Checkout (Demonstration)", timeout=10000)
        print("[✓] Reached Demonstration Payment Gateway view")

        # Verify gateway requirements:
        assert page.locator("text=⛔ DO NOT PAY — DEMONSTRATION ONLY").first.is_visible()
        assert page.locator("text=এই QR কোড শুধুমাত্র Demo প্রদর্শনের জন্য").first.is_visible()
        # Verify QR image is loaded
        qr_img = page.locator("img[alt*='bKash QR Demonstration']")
        assert qr_img.is_visible()
        print("[✓] Original bKash QR Code and red warnings verified")
        page.screenshot(path=f"{OUTPUT_DIR}/payment_gateway_bkash.png")

        # Step 13: Simulate Payment Success
        page.click("button:has-text('Simulate Payment Success')")
        page.wait_for_selector("text=Confirm Simulated Payment?", timeout=5000)
        page.click("button:has-text('Yes, Simulate Success')")
        page.wait_for_selector("text=DEMONSTRATION PAYMENT COMPLETED", timeout=10000)
        print("[✓] Simulation completed! Status: DEMO SUCCESS")
        page.screenshot(path=f"{OUTPUT_DIR}/payment_success_screen.png")

        # Step 14: Return to Dashboard and verify DEMO SUCCESS synchronization
        page.click("a:has-text('Go to Student Dashboard')")
        page.wait_for_url("**/dashboard", timeout=5000)
        page.wait_for_selector("text=Demo Payment Completed", timeout=10000)
        assert page.locator("text=Under Review").first.is_visible()
        print("[✓] Dashboard synchronized: Status updated to 'Under Review' and 'Demo Payment Completed'")

        # Step 15: Public Tracking Verification
        page.goto(f"{BASE_URL}/track-application", wait_until="networkidle")
        page.fill("input[placeholder*='IU27-DEMO']", app_id)
        page.click("button:has-text('Track Application')")
        page.wait_for_selector(f"text={app_id}", timeout=10000)
        assert page.locator("text=DEMO SUCCESS").first.is_visible()
        print(f"[✓] Public Tracking page verified for {app_id}")
        page.screenshot(path=f"{OUTPUT_DIR}/public_tracking_verified.png")

        # Step 16: Log out and test invalid credentials
        page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
        page.click("button[title='Sign Out']")
        page.wait_for_url("**/login", timeout=5000)
        print("[✓] Successfully logged out")

        # Test invalid credentials
        page.fill("input[placeholder*='01811860339']", test_mobile)
        page.fill("input[placeholder='Your password']", "WrongPassword123")
        page.click("button:has-text('Sign in')")
        time.sleep(1)
        assert page.locator("text=Invalid credentials").first.is_visible()
        print("[✓] Invalid credentials rejection correctly verified")

        # Re-login with correct credentials
        page.fill("input[placeholder='Your password']", user_password)
        page.click("button:has-text('Sign in')")
        page.wait_for_url("**/dashboard", timeout=10000)
        page.wait_for_selector(f"text={app_id}", timeout=10000)
        assert page.locator("text=Demo Payment Completed").first.is_visible()
        print("[✓] Persistent session and credentials verified upon re-login!")

        # -------------------------------------------------------------
        # PART 1B: TEST ROCKET PAYMENT SIMULATION & CANCELLATION FLOW
        # -------------------------------------------------------------
        print("\n--- PART 1B: Testing Rocket Payment Gateway and Cancellation ---")
        context2 = browser.new_context(viewport={"width": 1440, "height": 900})
        page2 = context2.new_page()
        page2.goto(f"{BASE_URL}/register", wait_until="networkidle")

        rocket_id = str(int(time.time()))[-5:] + "9"
        page2.select_option("select:has(option:has-text('Electrical and Electronic Engineering'))", label="Electrical and Electronic Engineering")
        page2.select_option("select:has(option:has-text('Undergraduate (Honours)'))", value="Honours")
        page2.fill("input[placeholder='e.g. 1812099']", f"191{rocket_id}")
        page2.fill("input[placeholder='e.g. 2017-18']", "2018-19")
        page2.fill("input[placeholder='e.g. 01712000000']", f"0181{rocket_id}0")
        page2.fill("input[placeholder='name@example.com']", f"rocket.{rocket_id}@example.com")
        page2.fill("input[placeholder='e.g. Md. Ashraful Islam']", f"Rocket Candidate {rocket_id}")
        page2.fill("input[placeholder='Enter strong password']", "RocketPass@2027")
        page2.fill("input[placeholder='Re-enter password']", "RocketPass@2027")
        page2.click("button:has-text('Continue to Personal Information')")
        page2.wait_for_selector("text=STEP 2 OF 8", timeout=10000)

        # Skip through steps to payment portal
        for s in range(2, 8):
            page2.locator("button[type='button']:has-text('Next:')").click()
            time.sleep(0.5)

        # Step 8 submit
        page2.click("button:has-text('Submit Application & Complete')")
        page2.wait_for_selector("text=Registration Successful!", timeout=10000)
        rocket_app_id = page2.locator("span.font-mono.font-black").inner_text().strip()
        print(f"[✓] Created candidate for Rocket test: {rocket_app_id}")

        # Login as rocket user
        page2.goto(f"{BASE_URL}/login", wait_until="networkidle")
        page2.fill("input[placeholder*='01811860339']", f"rocket.{rocket_id}@example.com")
        page2.fill("input[placeholder='Your password']", "RocketPass@2027")
        page2.click("button:has-text('Sign in')")
        page2.wait_for_url("**/dashboard", timeout=10000)

        # Go to payment portal
        page2.goto(f"{BASE_URL}/payment", wait_until="networkidle")
        page2.wait_for_selector("text=Select Payment Method", timeout=10000)

        # Select Rocket
        page2.locator("input[type='radio']").nth(1).check()
        time.sleep(0.5)
        page2.click("button:has-text('Proceed to Pay')")
        page2.wait_for_selector("text=Rocket Merchant Checkout", timeout=10000)

        # Verify Rocket QR and red warning
        assert page2.locator("img[alt*='Rocket QR Demonstration']").is_visible()
        assert page2.locator("text=⛔ DO NOT PAY").is_visible()
        print("[✓] Rocket QR code and checkout interface verified")
        page2.screenshot(path=f"{OUTPUT_DIR}/payment_gateway_rocket.png")

        # Test Payment Cancellation
        page2.click("button:has-text('Cancel Payment')")
        time.sleep(1)
        assert page2.locator("text=Select Payment Method").first.is_visible()
        assert page2.locator("text=NOT PAID").first.is_visible()
        print("[✓] Payment cancellation successfully returned to payment summary without charging")

        # Now simulate success on Rocket
        page2.locator("input[type='radio']").nth(1).check()
        time.sleep(0.5)
        page2.click("button:has-text('Proceed to Pay')")
        page2.wait_for_selector("text=Rocket Merchant Checkout", timeout=10000)
        page2.click("button:has-text('Simulate Payment Success')")
        page2.click("button:has-text('Yes, Simulate Success')")
        page2.wait_for_selector("text=DEMONSTRATION PAYMENT COMPLETED", timeout=10000)
        print("[✓] Rocket payment simulation successfully recorded DEMO SUCCESS!")
        context2.close()

        context.close()

        # -------------------------------------------------------------
        # PART 2: RESPONSIVE AUDIT ACROSS ALL 8 TARGET VIEWPORTS
        # -------------------------------------------------------------
        print("\n--- PART 2: Responsive Visual Quality Audit Across 8 Viewports ---")
        routes_to_capture = [
            {"path": "/", "name": "home"},
            {"path": "/login", "name": "login"},
            {"path": "/register", "name": "register"},
            {"path": "/track-application", "name": "track"},
            {"path": "/fees", "name": "fees"},
            {"path": "/guidelines", "name": "guidelines"},
            {"path": "/contact", "name": "contact"},
        ]

        for vp in VIEWPORTS:
            vp_name = vp["name"]
            w = vp["width"]
            h = vp["height"]
            print(f"\nAuditing Viewport: {vp_name} ({w}x{h})...")

            vp_ctx = browser.new_context(viewport={"width": w, "height": h})
            vp_page = vp_ctx.new_page()

            for r in routes_to_capture:
                r_url = f"{BASE_URL}{r['path']}"
                vp_page.goto(r_url, wait_until="networkidle")
                time.sleep(0.5)

                # Check if mobile hamburger is visible on small screens
                if w < 1024:
                    # Test hamburger toggle on mobile
                    btn_menu = vp_page.locator("button[aria-label='Toggle navigation menu']")
                    if btn_menu.is_visible():
                        btn_menu.click()
                        time.sleep(0.3)
                        # Save mobile drawer open screenshot for home
                        if r['name'] == 'home':
                            vp_page.screenshot(path=f"{OUTPUT_DIR}/nav_drawer_{vp_name}.png")
                        # Close menu
                        btn_menu.click()
                        time.sleep(0.2)

                # Capture full-page or standard screenshot
                shot_filename = f"{OUTPUT_DIR}/{r['name']}_{vp_name}.png"
                vp_page.screenshot(path=shot_filename, full_page=(h < 900 and w > 1000))
                print(f"  [✓] Captured {r['name']} @ {vp_name}")

            vp_ctx.close()

        browser.close()

    print("\n" + "=" * 60)
    print("ALL TESTS AND AUDITS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
