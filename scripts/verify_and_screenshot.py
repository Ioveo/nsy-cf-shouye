import json
import time
import subprocess
import base64
import os
import requests
import websocket

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "http://127.0.0.1:8788/"

def run():
    print("Launching Chrome...")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        "--user-data-dir=" + os.path.abspath("tmp_chrome_profile"),
        URL
    ])

    time.sleep(2)
    try:
        # Find page tab
        tabs = requests.get("http://127.0.0.1:9222/json/list").json()
        page_tabs = [t for t in tabs if t.get("type") == "page"]
        if not page_tabs:
            raise RuntimeError("No page tab found in Chrome")
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]
        print("Connected to page tab:", ws_url)

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
                # Collect errors
                if resp.get("method") == "Runtime.exceptionThrown":
                    console_errors.append(resp.get("params", {}))
                elif resp.get("method") == "Log.entryAdded":
                    entry = resp.get("params", {}).get("entry", {})
                    if entry.get("level") == "error":
                        console_errors.append(entry)
                elif resp.get("id") == m_id:
                    return resp.get("result", {})

        # Enable console and runtime
        send("Console.enable")
        send("Runtime.enable")
        send("Page.enable")
        send("Log.enable")

        print("Navigating to", URL)
        send("Page.navigate", {"url": URL})
        time.sleep(3)

        print(f"Console errors recorded so far: {len(console_errors)}")
        if console_errors:
            print("Errors:", console_errors)

        # Test sizes
        viewports = [
            ("screenshot_1440.png", 1440, 900),
            ("screenshot_390.png", 390, 844)
        ]

        for filename, width, height in viewports:
            print(f"\n--- Testing viewport {width}x{height} ---")
            send("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 2,
                "mobile": width <= 600
            })
            time.sleep(1)

            # Scroll to bottom to trigger animations
            send("Runtime.evaluate", {
                "expression": """
                window.scrollTo({top: document.body.scrollHeight, behavior: 'instant'});
                """
            })
            time.sleep(1.5)

            # Scroll back to top
            send("Runtime.evaluate", {
                "expression": """
                window.scrollTo({top: 0, behavior: 'instant'});
                """
            })
            time.sleep(1)

            # Check horizontal scroll on mobile
            if width == 390:
                overflow_check = send("Runtime.evaluate", {
                    "expression": """
                    ({
                        scrollWidth: document.documentElement.scrollWidth,
                        clientWidth: document.documentElement.clientWidth,
                        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
                    })
                    """,
                    "returnByValue": True
                })
                print("Mobile overflow check:", overflow_check.get("result", {}).get("value"))

            # Capture full page screenshot
            print(f"Capturing full-page screenshot for {width}px...")
            clip = send("Page.getLayoutMetrics")
            content_size = clip.get("contentSize", {})
            full_height = int(content_size.get("height", 3000))

            ss_result = send("Page.captureScreenshot", {
                "format": "png",
                "captureBeyondViewport": True
            })

            data = base64.b64decode(ss_result["data"])
            out_path = os.path.abspath(filename)
            with open(out_path, "wb") as f:
                f.write(data)
            print(f"Saved screenshot: {out_path} ({len(data)} bytes)")

        # Verify FAQ accordion click
        print("\nTesting FAQ accordion click...")
        faq_test = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const q = document.querySelectorAll('.apple-faq-question')[1];
                if (!q) return 'FAQ question 2 not found';
                q.click();
                const parent = q.closest('.apple-faq-item');
                return parent.classList.contains('is-open') ? 'FAQ accordion works' : 'FAQ failed';
            })()
            """,
            "returnByValue": True
        })
        print("FAQ click test result:", faq_test.get("result", {}).get("value"))

        # Verify Category Tabs click
        print("\nTesting Category tabs click...")
        tab_test = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const tabs = document.querySelectorAll('.apple-segmented__btn');
                if (tabs.length < 2) return 'Not enough tabs';
                tabs[1].click();
                return 'Tab clicked: ' + tabs[1].textContent;
            })()
            """,
            "returnByValue": True
        })
        print("Tab test result:", tab_test.get("result", {}).get("value"))

        ws.close()
    finally:
        proc.terminate()
        print("Chrome terminated.")

if __name__ == "__main__":
    run()
