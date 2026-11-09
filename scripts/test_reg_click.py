from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_messages = []
    page.on('console', lambda msg: console_messages.append(f'{msg.type}: {msg.text}'))
    page.on('pageerror', lambda err: console_messages.append(f'PAGE_ERROR: {err}'))

    requests = []
    page.on('request', lambda r: requests.append(f'{r.method} {r.url}'))
    responses = []
    page.on('response', lambda r: responses.append(f'{r.status} {r.url}'))

    page.goto('http://127.0.0.1:5173/register', wait_until='networkidle')
    print('Initial step:', page.inner_text('h2'))

    # Fill inputs
    inputs = page.locator('input').all()
    print('Found input fields count:', len(inputs))
    for i, inp in enumerate(inputs):
        ph = inp.get_attribute('placeholder') or ''
        typ = inp.get_attribute('type') or ''
        val = inp.input_value()
        req = inp.get_attribute('required') is not None
        print(f'Input {i}: type={typ}, req={req}, val="{val}", ph="{ph}"')

    browser.close()
