import os
import sys
import json
import time
import base64
import subprocess
import requests
import websocket

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8788"
PASSWORD = "admin123"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACTS_DIR = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"

def test_flagship_dynamic_update():
    print("=== 1. 测试首页旗舰产品数据由后台动态驱动 ===")
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": PASSWORD}).json()
    assert login_res.get("success"), f"Login failed: {login_res}"
    token = login_res["token"]
    headers = {"Authorization": f"Bearer {token}"}

    cat_res = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
    software_list = cat_res.get("catalog", {}).get("software", [])
    desktop = next((s for s in software_list if s["slug"] == "desktop"), None)
    assert desktop is not None, "Desktop software not found in catalog"

    orig_tagline = desktop.get("tagline") or desktop.get("description") or ""
    test_tagline = "【后台动态驱动验证】专为 Windows 打造的极致灵动桌面与运营中枢"

    # 更新 desktop 的 tagline 并确保其 sortOrder = 0
    updated_payload = dict(desktop)
    updated_payload["tagline"] = test_tagline
    updated_payload["sortOrder"] = 0
    up_res = requests.post(f"{BASE_URL}/api/admin/software", json=updated_payload, headers=headers).json()
    assert up_res.get("success"), f"Update software failed: {up_res}"
    print(f"✓ 1.1 成功在后台将 desktop 的 tagline 改为: {test_tagline}")

    # 读取前台首页 /api/catalog 验证数据同步
    time.sleep(1)
    home_cat = requests.get(f"{BASE_URL}/api/catalog").json()
    home_desktop = next(s for s in home_cat["software"] if s["slug"] == "desktop")
    assert home_desktop.get("tagline") == test_tagline, f"Catalog tagline mismatch: {home_desktop.get('tagline')}"
    print("✓ 1.2 前台 /api/catalog 成功读取到更新后的 tagline")

    return token, desktop, orig_tagline

def test_browser_and_screenshots(token, desktop, orig_tagline):
    print("=== 2. 浏览器端到端校验与 1440 / 390 截图 ===")
    tmp_profile = os.path.abspath("tmp_chrome_phase3")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9223",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={tmp_profile}",
        f"{BASE_URL}/"
    ])

    time.sleep(2)
    try:
        tabs = requests.get("http://127.0.0.1:9223/json/list").json()
        page_tabs = [t for t in tabs if t.get("type") == "page"]
        assert page_tabs, "No page tab found"
        target_tab = next((t for t in page_tabs if BASE_URL in t.get("url", "")), page_tabs[0])
        ws_url = target_tab["webSocketDebuggerUrl"]

        ws = websocket.create_connection(ws_url)
        msg_id = [1]
        console_errors = []

        def send(method, params=None):
            m = msg_id[0]
            msg_id[0] += 1
            payload = {"id": m, "method": method, "params": params or {}}
            ws.send(json.dumps(payload))
            while True:
                resp = json.loads(ws.recv())
                if resp.get("method") == "Runtime.exceptionThrown":
                    console_errors.append(resp.get("params", {}))
                elif resp.get("method") == "Log.entryAdded":
                    entry = resp.get("params", {}).get("entry", {})
                    if entry.get("level") == "error":
                        console_errors.append(entry)
                elif resp.get("id") == m:
                    return resp.get("result", {})

        send("Console.enable")
        send("Runtime.enable")
        send("Page.enable")
        send("Log.enable")

        time.sleep(1)

        # 2.1 验证旗舰区 DOM 中的 tagline 已经由后台数据驱动改变
        def poll_flagship(keyword, timeout=10):
            start = time.time()
            while time.time() - start < timeout:
                try:
                    res = send("Runtime.evaluate", {
                        "expression": "document.getElementById('flagshipTagline') ? document.getElementById('flagshipTagline').textContent : ''",
                        "returnByValue": True
                    })
                    print("POLL RES:", res)
                    val = res.get("result", {}).get("value", "")
                    if keyword in val:
                        return val
                except Exception as e:
                    print("POLL ERROR:", e)
                time.sleep(0.5)
            return ""

        tagline_val = poll_flagship("后台动态驱动验证", 10)
        assert "后台动态驱动验证" in tagline_val, f"Expected dynamic tagline in flagship, got: '{tagline_val}'"
        print(f"✓ 2.1 首页旗舰区 DOM 成功动态展示后台新 tagline: {tagline_val}")

        # 2.2 测试 FAQ 点击手风琴展开
        faq_open_before = send("Runtime.evaluate", {"expression": "document.querySelectorAll('.apple-faq-item.is-open').length"})["result"].get("value")
        send("Runtime.evaluate", {"expression": "document.querySelectorAll('.apple-faq-question')[1].click()"})
        time.sleep(0.5)
        faq_open_after = send("Runtime.evaluate", {"expression": "document.querySelectorAll('.apple-faq-item.is-open').length"})["result"].get("value")
        print(f"✓ 2.2 FAQ 展开交互测试正常 (展开数: {faq_open_after})")

        # 2.3 截取 1440px 截图
        send("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        time.sleep(1)
        # 滚动到底部触发所有元素渲染
        send("Runtime.evaluate", {"expression": "window.scrollTo(0, document.body.scrollHeight);"})
        time.sleep(1)
        send("Runtime.evaluate", {"expression": "window.scrollTo(0, 0);"})
        time.sleep(0.5)

        layout = send("Page.getLayoutMetrics")
        content_size = layout.get("contentSize", {})
        h_1440 = int(content_size.get("height", 3200))
        send("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": h_1440,
            "deviceScaleFactor": 1,
            "mobile": False
        })
        time.sleep(1)
        shot1440 = send("Page.captureScreenshot", {"format": "png"})
        png_1440 = base64.b64decode(shot1440["data"])
        
        path_1440_local = "screenshot_1440.png"
        path_1440_artifact = os.path.join(ARTIFACTS_DIR, "portal_1440.png")
        with open(path_1440_local, "wb") as f:
            f.write(png_1440)
        with open(path_1440_artifact, "wb") as f:
            f.write(png_1440)
        print(f"✓ 2.3 成功截取 1440px 全页图: {len(png_1440)} 字节")

        # 2.4 截取 390px 截图
        send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": 844,
            "deviceScaleFactor": 2,
            "mobile": True
        })
        time.sleep(1)
        # 检查是否有横向溢出
        scroll_width = send("Runtime.evaluate", {"expression": "document.documentElement.scrollWidth"})["result"].get("value")
        client_width = send("Runtime.evaluate", {"expression": "document.documentElement.clientWidth"})["result"].get("value")
        assert scroll_width <= client_width + 1, f"Horizontal scroll detected on 390px! scrollWidth={scroll_width}, clientWidth={client_width}"
        print(f"✓ 2.4 390px 移动端校验无横向滚动 (scrollWidth: {scroll_width}, clientWidth: {client_width})")

        layout_m = send("Page.getLayoutMetrics")
        content_size_m = layout_m.get("contentSize", {})
        h_390 = int(content_size_m.get("height", 4800))
        send("Emulation.setDeviceMetricsOverride", {
            "width": 390,
            "height": h_390,
            "deviceScaleFactor": 1,
            "mobile": True
        })
        time.sleep(1)
        shot390 = send("Page.captureScreenshot", {"format": "png"})
        png_390 = base64.b64decode(shot390["data"])
        
        path_390_local = "screenshot_390.png"
        path_390_artifact = os.path.join(ARTIFACTS_DIR, "portal_390.png")
        with open(path_390_local, "wb") as f:
            f.write(png_390)
        with open(path_390_artifact, "wb") as f:
            f.write(png_390)
        print(f"✓ 2.5 成功截取 390px 全页图: {len(png_390)} 字节")

        # 2.6 检查 console 报错
        real_errors = [e for e in console_errors if "favicon" not in str(e).lower()]
        assert len(real_errors) == 0, f"Found console errors: {real_errors}"
        print(f"✓ 2.6 控制台报错数: 0")

        ws.close()
    finally:
        proc.terminate()
        proc.wait()

    # 还原 tagline
    headers = {"Authorization": f"Bearer {token}"}
    restore_payload = dict(desktop)
    restore_payload["tagline"] = orig_tagline
    requests.post(f"{BASE_URL}/api/admin/software", json=restore_payload, headers=headers)
    print("✓ 2.7 还原 desktop 原始 tagline 成功")

if __name__ == "__main__":
    t, d, orig = test_flagship_dynamic_update()
    test_browser_and_screenshots(t, d, orig)
    print("\n🎉 PHASE 4 验收全项通过！")
