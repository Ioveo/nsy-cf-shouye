import json
import time
import subprocess
import base64
import os
import requests
import websocket

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
URL = "http://127.0.0.1:8788/download"

def run():
    print("Launching Chrome to verify download.html...")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        "--user-data-dir=" + os.path.abspath("tmp_chrome_download"),
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

            send("Runtime.evaluate", {
                "expression": "window.scrollTo({top: document.body.scrollHeight, behavior: 'instant'});"
            })
            time.sleep(1)
            send("Runtime.evaluate", {
                "expression": "window.scrollTo({top: 0, behavior: 'instant'});"
            })
            time.sleep(1)

            if width == 390:
                overflow = send("Runtime.evaluate", {
                    "expression": "({scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth})",
                    "returnByValue": True
                })
                print("Mobile overflow check:", overflow.get("result", {}).get("value"))

            ss_result = send("Page.captureScreenshot", {
                "format": "png",
                "captureBeyondViewport": True
            })

            data = base64.b64decode(ss_result["data"])
            out_path = os.path.abspath(filename)
            with open(out_path, "wb") as f:
                f.write(data)
            print(f"Saved: {out_path} ({len(data)} bytes)")

        # Test Accordion
        acc_test = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const btn = document.querySelectorAll('.changelog-toggle')[1];
                if (!btn) return 'btn not found';
                btn.click();
                const content = document.querySelectorAll('.changelog-content')[1];
                return !content.classList.contains('hidden') ? 'Accordion works' : 'Accordion failed';
            })()
            """,
            "returnByValue": True
        })
        print("Accordion test:", acc_test.get("result", {}).get("value"))

        ws.close()
    finally:
        proc.terminate()
        print("Done.")

if __name__ == "__main__":
    run()
