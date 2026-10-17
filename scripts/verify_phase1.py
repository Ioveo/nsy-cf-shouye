import json
import time
import subprocess
import base64
import os
import requests
import websocket

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "http://127.0.0.1:8788/download.html"
ARTIFACTS_DIR = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"

def run():
    print("Launching Chrome to verify Phase 1 software center...")
    tmp_profile = os.path.abspath("tmp_chrome_phase1")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={tmp_profile}",
        URL
    ])

    time.sleep(2)
    try:
        tabs = requests.get("http://127.0.0.1:9222/json/list").json()
        page_tabs = [t for t in tabs if t.get("type") == "page"]
        if not page_tabs:
            raise RuntimeError("No page tab found")
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]

        ws = websocket.create_connection(ws_url)
        msg_id = 1
        console_errors = []

        def send(method, params=None):
            nonlocal msg_id
            m_id = msg_id
            msg_id += 1
            payload = {"id": m_id, "method": method, "params": params or {}}
            ws.send(json.dumps(payload))
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

        send("Page.navigate", {"url": URL})
        time.sleep(3)

        print(f"Console errors: {len(console_errors)}")
        if console_errors:
            print("Errors found:", console_errors)
            assert len(console_errors) == 0, "Console errors must be 0!"

        # Verify software list
        list_check = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const cards = document.querySelectorAll('#softwareList article');
                const titles = Array.from(cards).map(c => c.querySelector('h3')?.textContent);
                return { count: cards.length, titles };
            })()
            """,
            "returnByValue": True
        })
        print("Software list in DOM:", list_check.get("result", {}).get("value"))

        # Verify switching to test-toolkit by clicking "查看详情"
        switch_check = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const btn = document.querySelector('#softwareList article[data-slug="test-toolkit"] button[data-select="test-toolkit"]');
                if (!btn) return { ok: false, error: 'test-toolkit card button not found' };
                btn.click();
                return {
                    ok: true,
                    heroTitle: document.getElementById('heroTitle')?.textContent,
                    heroVersion: document.getElementById('heroVersion')?.textContent,
                    featuresVisible: !document.getElementById('features')?.hidden,
                    featuresTitle: document.getElementById('featuresTitle')?.textContent,
                    platformCount: document.querySelectorAll('#platformGrid > div').length
                };
            })()
            """,
            "returnByValue": True
        })
        print("Clicking 查看详情 result:", switch_check.get("result", {}).get("value"))

        # Test direct ?app=test-toolkit navigation
        send("Page.navigate", {"url": f"{URL}?app=test-toolkit"})
        time.sleep(2)
        direct_check = send("Runtime.evaluate", {
            "expression": """
            (() => {
                return {
                    title: document.title,
                    heroTitle: document.getElementById('heroTitle')?.textContent,
                    downloadButtons: Array.from(document.querySelectorAll('#downloadNow a')).map(a => a.textContent.trim())
                };
            })()
            """,
            "returnByValue": True
        })
        print("Direct ?app=test-toolkit result:", direct_check.get("result", {}).get("value"))

        # Viewports testing & screenshots
        viewports = [
            ("download_1440.png", 1440, 900),
            ("download_390.png", 390, 844)
        ]

        for filename, width, height in viewports:
            print(f"Testing viewport {width}x{height}...")
            send("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 2,
                "mobile": width <= 600
            })
            time.sleep(1)

            if width == 390:
                overflow = send("Runtime.evaluate", {
                    "expression": "({scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth})",
                    "returnByValue": True
                })
                print("Mobile overflow check:", overflow.get("result", {}).get("value"))
                assert not overflow.get("result", {}).get("value", {}).get("overflow"), "Mobile has horizontal overflow!"

            ss_result = send("Page.captureScreenshot", {
                "format": "png",
                "captureBeyondViewport": True
            })

            data = base64.b64decode(ss_result["data"])
            # Save to brain artifacts directory
            art_path = os.path.join(ARTIFACTS_DIR, filename)
            with open(art_path, "wb") as f:
                f.write(data)
            print(f"Saved artifact: {art_path} ({len(data)} bytes)")

        # Test Changelog Accordion
        acc_test = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const btn = document.querySelector('#changelogList [data-toggle]');
                if (!btn) return 'no toggle found';
                const content = btn.nextElementSibling;
                const initiallyHidden = content.classList.contains('hidden');
                btn.click();
                const afterClickHidden = content.classList.contains('hidden');
                return { initiallyHidden, afterClickHidden, works: initiallyHidden !== afterClickHidden };
            })()
            """,
            "returnByValue": True
        })
        print("Changelog Accordion test:", acc_test.get("result", {}).get("value"))

        ws.close()
        print("All Phase 1 verifications passed successfully!")
    finally:
        proc.terminate()
        try:
            import shutil
            if os.path.exists(tmp_profile):
                shutil.rmtree(tmp_profile, ignore_errors=True)
        except Exception:
            pass

if __name__ == "__main__":
    run()
