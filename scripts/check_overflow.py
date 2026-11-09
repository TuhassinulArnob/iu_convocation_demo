import sys
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VIEWPORTS = [1920, 1440, 1366, 1280, 1024, 768, 430, 390, 360]
ROUTES = ["/", "/notices", "/guidelines", "/fees", "/schedule", "/contact", "/login", "/register", "/track-application"]

def check_overflow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for w in VIEWPORTS:
            page.set_viewport_size({"width": w, "height": 900})
            print(f"\n--- Checking Viewport {w}px ---")
            for route in ROUTES:
                page.goto(f"http://127.0.0.1:5173{route}", wait_until="networkidle")
                page.wait_for_timeout(300)
                scroll_w = page.evaluate("() => document.documentElement.scrollWidth")
                inner_w = page.evaluate("() => window.innerWidth")
                overflow = scroll_w > inner_w
                if overflow:
                    # Find elements exceeding window.innerWidth
                    overflowing_elems = page.evaluate("""() => {
                        const winWidth = window.innerWidth;
                        const elems = Array.from(document.querySelectorAll('*'));
                        const results = [];
                        for (const el of elems) {
                            const rect = el.getBoundingClientRect();
                            if (rect.right > winWidth + 1) {
                                results.push({
                                    tag: el.tagName,
                                    id: el.id,
                                    cls: (el.className || '').toString().slice(0, 80),
                                    right: Math.round(rect.right),
                                    width: Math.round(rect.width)
                                });
                            }
                        }
                        return results.slice(0, 5);
                    }""")
                    print(f"  [OVERFLOW] {route}: scrollWidth={scroll_w} > innerWidth={inner_w}")
                    for el in overflowing_elems:
                        print(f"      -> <{el['tag']} class='{el['cls']}'> right={el['right']} width={el['width']}")
                else:
                    print(f"  [OK] {route}: {scroll_w} == {inner_w}")

        browser.close()

if __name__ == "__main__":
    check_overflow()
