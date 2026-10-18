# -*- coding: utf-8 -*-
import sys
import json
import time
import subprocess
import os
import requests
import websocket
import base64

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:8788"

def run_browser_phase5_tests():
    print("=== Phase 5 Browser Acceptance Verification ===")
    profile_dir = os.path.abspath("tmp_chrome_verify_p5")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={profile_dir}",
        f"{BASE_URL}/"
    ])

    time.sleep(3)
    ws = None
    try:
        tabs = requests.get("http://127.0.0.1:9222/json/list").json()
        page_tabs = [t for t in tabs if t.get("type") == "page"]
        assert page_tabs, "No page tab found"
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]
        ws = websocket.create_connection(ws_url)

        msg_id = 1
        console_errors = []

        def send(method, params=None):
            nonlocal msg_id
            m_id = msg_id
            msg_id += 1
            ws.send(json.dumps({"id": m_id, "method": method, "params": params or {}}))
            while True:
                resp = json.loads(ws.recv())
                if resp.get("method") == "Runtime.exceptionThrown":
                    console_errors.append(resp.get("params", {}))
                elif resp.get("method") == "Log.entryAdded":
                    entry = resp.get("params", {}).get("entry", {})
                    if entry.get("level") == "error":
                        console_errors.append(entry)
                elif resp.get("id") == m_id:
                    return resp.get("result", {})

        send("Console.enable")
        send("Runtime.enable")
        send("Page.enable")
        send("Log.enable")

        def evaluate(expression):
            res = send("Runtime.evaluate", {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": True
            })
            if "exceptionDetails" in res:
                print(f"Eval Exception: {res['exceptionDetails']}")
            return res.get("result", {}).get("value")

        def set_viewport(width, height):
            send("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": width < 600
            })
            time.sleep(0.5)

        def take_screenshot(name):
            data = send("Page.captureScreenshot", {"format": "png"})
            b64 = data.get("data")
            if b64:
                brain_dir = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"
                os.makedirs(brain_dir, exist_ok=True)
                out_path = os.path.join(brain_dir, name)
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(b64))
                print(f"Captured: {name}")

        def navigate(url):
            res = send("Page.navigate", {"url": url})
            print(f"navigate to {url}: {res}")
            time.sleep(2)

        # -------------------------------------------------------------
        # Test 1: Load / and verify portal carousel
        # -------------------------------------------------------------
        print("\nTesting / portal carousel with placement=portal promotions...")
        navigate(f"{BASE_URL}/")
        set_viewport(1440, 900)
        time.sleep(1)
        page_info = evaluate("({ url: window.location.href, title: document.title, bodyLanding: document.body.getAttribute('data-landing-page'), hasFrame: Boolean(document.getElementById('heroPreviewFrame')) })")
        print("Test 1 Page Info:", page_info)

        r1 = evaluate("""(() => {
            const carousel = document.getElementById('portalCarousel');
            const defaultImg = document.getElementById('defaultHeroImg');
            const slides = document.querySelectorAll('.portal-carousel__slide');
            const activeSlide = document.querySelector('.portal-carousel__slide.is-active');
            const title = activeSlide?.querySelector('.portal-carousel__title')?.textContent;
            const btn = activeSlide?.querySelector('.portal-carousel__btn span')?.textContent;
            const dots = document.querySelectorAll('.portal-carousel__dot');
            return {
                carouselVisible: carousel && !carousel.hidden,
                defaultImgHidden: defaultImg ? defaultImg.hidden : false,
                slidesCount: slides.length,
                activeTitle: title,
                activeBtnText: btn,
                dotsCount: dots.length
            };
        })()""")
        print(f"Portal Carousel result: {r1}")
        assert r1.get("carouselVisible"), "Portal carousel must be visible"
        assert r1.get("defaultImgHidden"), "Default static hero image must be hidden when carousel has slides"
        assert r1.get("slidesCount") >= 2, f"Expected >= 2 slides, got {r1.get('slidesCount')}"
        assert "全新升级" in (r1.get("activeTitle") or ""), "First slide must match portal promotion"
        assert "立即体验" in (r1.get("activeBtnText") or ""), "CTA button text must match"
        print("PASS 1: Portal homepage successfully loaded placement=portal promotion carousel")

        take_screenshot("phase5_portal_carousel_1440.png")
        set_viewport(390, 844)
        take_screenshot("phase5_portal_carousel_390.png")

        # -------------------------------------------------------------
        # Test 2: Carousel arrow and dot navigation
        # -------------------------------------------------------------
        print("\nTesting Carousel Slide Transitions...")
        set_viewport(1440, 900)
        time.sleep(0.5)

        # Reset to slide 0 via dot 0
        evaluate("""(() => {
            document.querySelector('[data-dot-idx="0"]')?.click();
        })()""")
        time.sleep(0.4)

        # Now click next arrow
        evaluate("""(() => {
            document.getElementById('portalCarouselNext')?.click();
        })()""")
        time.sleep(0.6)

        r2 = evaluate("""(() => {
            const activeSlide = document.querySelector('.portal-carousel__slide.is-active');
            const activeDot = document.querySelector('.portal-carousel__dot.is-active');
            return {
                activeSlideIdx: activeSlide?.getAttribute('data-slide-idx'),
                activeDotIdx: activeDot?.getAttribute('data-dot-idx'),
                title: activeSlide?.querySelector('.portal-carousel__title')?.textContent
            };
        })()""")
        print(f"Next slide result: {r2}")
        assert r2.get("activeSlideIdx") == "1", "Slide 1 must become active after clicking next"
        assert r2.get("activeDotIdx") == "1", "Dot 1 must become active"
        print("PASS 2: Next arrow and dot navigation transitioned smoothly")

        # -------------------------------------------------------------
        # Test 3: Load Studio Carousel Page and Verify Migration Banner
        # -------------------------------------------------------------
        print("\nTesting Studio /site/carousel Migration Banner...")
        # Get admin token and set into sessionStorage
        login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "admin123"}).json()
        token = login_resp.get("token")
        assert token, "Admin login for studio test must succeed"

        navigate(f"{BASE_URL}/studio/")
        evaluate(f"sessionStorage.setItem('downloadAdminToken', '{token}')")
        time.sleep(0.5)

        navigate(f"{BASE_URL}/studio/site/carousel")
        for _ in range(20):
            time.sleep(0.5)
            has_content = evaluate("Boolean(document.getElementById('root')?.children?.length && document.body.innerText.trim())")
            if has_content:
                break

        r3 = evaluate("""(() => {
            const text = document.body.innerText;
            const hasBanner = text.includes('首页轮播升级为「统一推广位」') || text.includes('统一推广位');
            const hasMigrateBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('一键迁移到推广位'));
            const hasPromoBtn = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('推广位管理'));
            return {
                url: window.location.href,
                hasBanner: hasBanner,
                hasMigrateBtn: hasMigrateBtn,
                hasPromoBtn: hasPromoBtn
            };
        })()""")
        print(f"Studio carousel migration banner result: {r3}")
        assert r3.get("hasBanner"), "Migration banner must be present"
        assert r3.get("hasMigrateBtn"), "一键迁移到推广位 button must be present"
        print("PASS 3: Studio legacy carousel migration banner and action button verified")

        take_screenshot("phase5_studio_carousel_migration_1440.png")

        # -------------------------------------------------------------
        # Check Console Errors
        # -------------------------------------------------------------
        print(f"\nChecking console errors (found {len(console_errors)})...")
        if console_errors:
            for err in console_errors:
                print("Console Error:", err)
        assert len(console_errors) == 0, f"Found {len(console_errors)} console errors!"
        print("\nALL PHASE 5 BROWSER ACCEPTANCE TESTS PASSED WITH 0 CONSOLE ERRORS!\n")

    finally:
        if ws:
            try: ws.close()
            except: pass
        proc.terminate()
        try: proc.wait(timeout=2)
        except: proc.kill()

if __name__ == "__main__":
    run_browser_phase5_tests()
