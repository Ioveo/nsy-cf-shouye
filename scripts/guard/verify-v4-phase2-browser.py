# -*- coding: utf-8 -*-
import json
import time
import subprocess
import os
import requests
import websocket
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:8788"

def run_browser_tests():
    print("Logging into Admin API to setup test configurations...")
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "admin123"}).json()
    token = login_res.get("token")
    assert token, "Failed to login as admin"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Fetch catalog
    catalog = requests.get(f"{BASE_URL}/api/catalog").json()
    target_soft = catalog["software"][0]
    soft_id = target_soft["id"]

    # Configure software-center with gold accent, compact density, hidden stats, and hero in promotions mode
    sc_config = {
        "accent": "gold",
        "hero": {"mode": "promotions", "showSearch": True, "autoplaySeconds": 6},
        "stats": {"show": False, "items": [], "hideBelow": 0},
        "newArrivals": {"show": True, "days": 30, "max": 8},
        "ranking": {"show": True, "tabs": ["downloads"], "size": 10},
        "density": "compact",
        "pageSize": 12,
        "announcement": {"show": True, "text": "【公告】天才猫软件中心 V4 黄金主题模式上线！", "href": "https://nsyoo.com", "tone": "info"}
    }
    sc_res = requests.post(f"{BASE_URL}/api/admin/config", headers=headers, json={"action": "save", "name": "software-center", "data": sc_config}).json()
    assert sc_res.get("success"), f"Save sc failed: {sc_res}"

    # Configure promotions with one active software promotion
    promos_config = {
        "items": [
            {
                "id": "promo_active_1",
                "placements": ["software"],
                "entity": {"type": "software", "id": soft_id},
                "badge": "重点推荐",
                "override": {"title": "天才猫桌面 V4 重磅升级", "subtitle": "超高效率桌面管理神器"},
                "status": "active",
                "order": 1
            }
        ]
    }
    pr_res = requests.post(f"{BASE_URL}/api/admin/config", headers=headers, json={"action": "save", "name": "promotions", "data": promos_config}).json()
    assert pr_res.get("success"), f"Save promotions failed: {pr_res}"

    print("Launching Chrome headless...")
    profile_dir = os.path.abspath("tmp_chrome_verify_p2")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={profile_dir}",
        f"{BASE_URL}/download.html"
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

        send("Page.navigate", {"url": f"{BASE_URL}/download.html"})
        
        # Poll up to 10 seconds until promotions are rendered
        dom_val = {}
        for attempt in range(10):
            time.sleep(1)
            res = send("Runtime.evaluate", {
                "expression": """
                (() => {
                    const accent = document.documentElement.getAttribute('data-accent');
                    const grid = document.getElementById('softwareGrid');
                    const isCompact = grid ? grid.classList.contains('sc-grid--compact') : false;
                    const stats = document.getElementById('statsRow');
                    const statsHidden = stats ? (stats.style.display === 'none' || !stats.offsetParent) : true;
                    const activeSlide = document.querySelector('.sc-hero__slide--active');
                    const heroBadge = activeSlide ? activeSlide.querySelector('.sc-badge') : null;
                    const heroBadgeText = heroBadge ? heroBadge.textContent.trim() : '';
                    const heroTitle = activeSlide ? (activeSlide.querySelector('h1')?.textContent.trim() || '') : '';
                    const announcement = document.getElementById('scAnnouncement');
                    const announcementText = announcement ? announcement.textContent.trim() : '';
                    return { accent, isCompact, statsHidden, heroBadgeText, heroTitle, announcementText };
                })()
                """,
                "returnByValue": True
            })
            dom_val = res.get("result", {}).get("value", {})
            if "重磅升级" in dom_val.get("heroTitle", "") or "重点推荐" in dom_val.get("heroBadgeText", ""):
                break

        print("DOM Verification Result:")
        print("accent:", dom_val.get("accent"))
        print("isCompact:", dom_val.get("isCompact"))
        print("statsHidden:", dom_val.get("statsHidden"))
        print("heroBadgeText:", dom_val.get("heroBadgeText"))
        print("heroTitle:", dom_val.get("heroTitle"))
        print("announcementText:", dom_val.get("announcementText"))

        assert dom_val.get("accent") == "gold", f"Expected accent gold, got {dom_val.get('accent')}"
        assert dom_val.get("isCompact") == True, "Expected sc-grid--compact class on grid"
        assert dom_val.get("statsHidden") == True, "Expected stats to be hidden"
        assert "重磅升级" in dom_val.get("heroTitle", ""), f"Expected promotion title in hero, got {dom_val.get('heroTitle')}"
        assert "重点推荐" in dom_val.get("heroBadgeText", ""), f"Expected promotion badge in hero, got {dom_val.get('heroBadgeText')}"
        assert "黄金主题" in dom_val.get("announcementText", ""), f"Expected announcement text, got {dom_val.get('announcementText')}"
        print("PASS 1: Gold accent, compact density, hidden stats, and promotion hero all verified in DOM!")

        # Take screenshots at 1440 and 390
        brain_dir = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"
        os.makedirs(brain_dir, exist_ok=True)

        for filename, width, height in [("phase2_gold_1440.png", 1440, 900), ("phase2_gold_390.png", 390, 844)]:
            send("Emulation.setDeviceMetricsOverride", {
                "width": width, "height": height, "deviceScaleFactor": 2, "mobile": width <= 600
            })
            time.sleep(1)
            shot = send("Page.captureScreenshot", {"format": "png"})
            data = base64.b64decode(shot["data"])
            path = os.path.join(brain_dir, filename)
            with open(path, "wb") as f:
                f.write(data)
            print(f"Captured screenshot: {path}")

        # 2. Test Fallback: Switch promotion to point to nonexistent ID (simulating draft/deleted software)
        print("\nTesting Promotion Fallback to Featured Software...")
        promos_config_draft = {
            "items": [
                {
                    "id": "promo_draft_1",
                    "placements": ["software"],
                    "entity": {"type": "software", "id": "nonexistent_soft_id"},
                    "badge": "草稿推荐",
                    "status": "active",
                    "order": 1
                }
            ]
        }
        requests.post(f"{BASE_URL}/api/admin/config", headers=headers, json={"action": "save", "name": "promotions", "data": promos_config_draft})

        # Reload download.html
        send("Page.navigate", {"url": f"{BASE_URL}/download.html?_t={int(time.time()*1000)}"})
        time.sleep(3)

        res_fallback = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const heroTrack = document.getElementById('heroTrack');
                const slides = heroTrack ? heroTrack.querySelectorAll('.sc-hero__slide') : [];
                const firstTitle = slides.length > 0 ? (slides[0].querySelector('h1')?.textContent.trim() || '') : '';
                return { slideCount: slides.length, firstTitle };
            })()
            """,
            "returnByValue": True
        })
        fallback_val = res_fallback.get("result", {}).get("value", {})
        print("Fallback Verification Result:", fallback_val)
        assert fallback_val.get("slideCount", 0) > 0, "Hero should fall back to featured software slides"
        assert len(console_errors) == 0, f"No console errors expected, got {console_errors}"
        print("PASS 2: Fallback to featured software succeeded with 0 console errors!")

        # Restore clean default config
        sc_config_default = {
            "accent": "cyan",
            "hero": {"mode": "featured", "showSearch": True, "autoplaySeconds": 6},
            "stats": {"show": True, "items": ["software", "downloads", "monthlyUpdates", "platforms"], "hideBelow": 0},
            "newArrivals": {"show": True, "days": 30, "max": 8},
            "ranking": {"show": True, "tabs": ["downloads", "updated"], "size": 10},
            "density": "comfortable",
            "pageSize": 12,
            "announcement": {"show": False, "text": "", "href": "", "tone": "info"}
        }
        requests.post(f"{BASE_URL}/api/admin/config", headers=headers, json={"action": "save", "name": "software-center", "data": sc_config_default})
        requests.post(f"{BASE_URL}/api/admin/config", headers=headers, json={"action": "save", "name": "promotions", "data": {"items": []}})
        print("Restored default configs.")

    finally:
        if ws:
            ws.close()
        proc.terminate()
        time.sleep(1)

    print("\nALL BROWSER ACCEPTANCE TESTS PASSED!")

if __name__ == "__main__":
    run_browser_tests()
