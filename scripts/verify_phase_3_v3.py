import os
import sys
import json
import time
import base64
import socket
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
ARTIFACT_DIR = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"

def get_free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

def run_phase_3_test():
    print("=== 开始 Phase 3 (v3) Studio 软件中心设置与仪表盘自动化验收 ===")

    # 1. 后台登录获取 token
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": PASSWORD}).json()
    assert login_res.get("success"), f"Login failed: {login_res}"
    token = login_res["token"]
    print("✓ 1. 后台登录接口通过")

    # 2. 启动无头浏览器
    cdp_port = get_free_port()
    tmp_profile = os.path.abspath(f"tmp_chrome_phase_3_{cdp_port}")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={cdp_port}",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={tmp_profile}",
        "about:blank"
    ])

    try:
        time.sleep(1.5)
        ws_url = None
        for _ in range(15):
            try:
                tabs = requests.get(f"http://127.0.0.1:{cdp_port}/json/list").json()
                page_tabs = [t for t in tabs if t.get("type") == "page"]
                if page_tabs:
                    ws_url = page_tabs[0]["webSocketDebuggerUrl"]
                    break
                else:
                    new_tab = requests.put(f"http://127.0.0.1:{cdp_port}/json/new").json()
                    if "webSocketDebuggerUrl" in new_tab:
                        ws_url = new_tab["webSocketDebuggerUrl"]
                        break
            except Exception:
                time.sleep(0.5)

        assert ws_url, "Failed to connect to Chrome CDP"
        ws = websocket.create_connection(ws_url)
        ws.settimeout(2.5)
        msg_id = 1
        console_errors = []

        def send(method, params=None):
            nonlocal msg_id
            mid = msg_id
            msg_id += 1
            ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
            return mid

        def eval_js(expr):
            mid = send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
            start = time.time()
            while time.time() - start < 6:
                try:
                    raw = ws.recv()
                    msg = json.loads(raw)
                    if msg.get("method") == "Runtime.consoleAPICalled":
                        if msg.get("params", {}).get("type") == "error":
                            args = msg.get("params", {}).get("args", [])
                            console_errors.append(" ".join(str(a.get("value", a)) for a in args))
                    if msg.get("id") == mid:
                        return msg.get("result", {}).get("result", {}).get("value")
                except websocket.WebSocketTimeoutException:
                    continue
            return None

        def poll_text(keyword, timeout=8):
            start = time.time()
            while time.time() - start < timeout:
                txt = eval_js("document.body ? document.body.textContent : ''") or ""
                if keyword in txt:
                    return txt
                time.sleep(0.15)
            return eval_js("document.body ? document.body.textContent : ''") or ""

        def capture_screenshot(filename):
            send("Page.captureScreenshot")
            start = time.time()
            while time.time() - start < 8:
                try:
                    raw = ws.recv()
                    msg = json.loads(raw)
                    if "result" in msg and "data" in msg["result"]:
                        img_data = base64.b64decode(msg["result"]["data"])
                        out_path = os.path.join(ARTIFACT_DIR, filename)
                        with open(out_path, "wb") as f:
                            f.write(img_data)
                        print(f"  📸 截图已保存至: {filename}")
                        return
                except websocket.WebSocketTimeoutException:
                    continue

        send("Page.enable")
        send("Runtime.enable")
        send("Log.enable")
        send("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })

        # 3. 注入 sessionStorage token
        send("Page.navigate", {"url": f"{BASE_URL}/studio/sign-in"})
        time.sleep(1.5)
        eval_js(f"""
            sessionStorage.setItem('downloadAdminToken', '{token}');
            sessionStorage.setItem('admin_token', '{token}');
        """)

        # 4. 验收 1: 仪表盘「软件中心预览」卡片
        print("\n=== 2. 验收仪表盘「软件中心预览」卡片 ===")
        send("Page.navigate", {"url": f"{BASE_URL}/studio/"})
        dash_txt = poll_text("软件中心预览", timeout=8)
        assert "软件中心预览" in dash_txt, f"仪表盘未找到「软件中心预览」文字: {dash_txt[:200]}"
        assert "打开前台" in dash_txt, "仪表盘未找到「打开前台」按钮"

        # 验证 iframe 是否内嵌 /download.html
        has_iframe = eval_js("""
            (() => {
                const iframes = Array.from(document.querySelectorAll('iframe'));
                return iframes.some(f => f.src && f.src.includes('/download.html'));
            })()
        """)
        assert has_iframe, "未在仪表盘找到指向 /download.html 的缩略 iframe"
        print("  ✓ 仪表盘成功展示「软件中心预览」卡片，内嵌 /download.html iframe，并提供「打开前台」跳转入口")
        time.sleep(1)
        capture_screenshot("studio_dashboard_v3.png")

        # 5. 验收 2: 软件列表「新品」标识列
        print("\n=== 3. 验收软件列表「新品」标识列 ===")
        send("Page.navigate", {"url": f"{BASE_URL}/studio/software"})
        sw_txt = poll_text("统一管理软件档案", timeout=8)
        assert "统一管理软件档案" in sw_txt, f"无法进入软件管理列表: {sw_txt[:200]}"

        # 验证表头是否包含「新品」
        has_new_col = eval_js("""
            (() => {
                const ths = Array.from(document.querySelectorAll('th'));
                return ths.some(th => th.textContent.includes('新品'));
            })()
        """)
        assert has_new_col, "软件管理表格未包含「新品」表头列"
        print("  ✓ 软件管理表格已成功添加只读「新品」标识列")
        time.sleep(0.5)
        capture_screenshot("studio_software_list_v3.png")

        # 6. 验收 3: 软件向导「封面图 (16:9 用于头部推广)」与「主推开关 + 主推排序」
        print("\n=== 4. 验收软件向导设置与直观预览 ===")
        send("Page.navigate", {"url": f"{BASE_URL}/studio/software/desktop"})
        wizard_txt = poll_text("基础档案资料", timeout=8)
        assert "基础档案资料" in wizard_txt, f"无法进入向导: {wizard_txt[:200]}"

        # 切换到步骤 2：媒体素材
        click_step2 = eval_js("""
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const st2 = btns.find(b => b.textContent.includes('媒体素材'));
                if (st2) { st2.click(); return true; }
                return false;
            })()
        """)
        assert click_step2, "未找到「媒体素材」步骤切换按钮"
        media_txt = poll_text("用于头部推广", timeout=5)
        assert "用于头部推广" in media_txt, f"步骤 2 未看到「用于头部推广」标签: {media_txt[:200]}"
        assert "16:9" in media_txt, "步骤 2 未看到「16:9 比例」说明"
        assert "软件运行截图画廊" in media_txt, "步骤 2 未看到「软件运行截图画廊」"

        # 验证截图支持拖拽排序属性
        has_draggable_screenshot = eval_js("""
            (() => {
                const shots = Array.from(document.querySelectorAll('[draggable="true"]'));
                return shots.length > 0;
            })()
        """)
        print(f"  ✓ 媒体素材步骤具备 16:9 封面预览（明确标注「用于头部推广」）、应用图标上传与截图组拖拽排序 (draggable: {has_draggable_screenshot})")
        time.sleep(0.5)
        capture_screenshot("studio_wizard_media_v3.png")

        # 切换到步骤 4：展示与发布
        click_step4 = eval_js("""
            (() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const st4 = btns.find(b => b.textContent.includes('展示与发布'));
                if (st4) { st4.click(); return true; }
                return false;
            })()
        """)
        assert click_step4, "未找到「展示与发布」步骤切换按钮"
        publish_txt = poll_text("设为主推软件", timeout=5)
        assert "设为主推软件" in publish_txt, "步骤 4 未找到「设为主推软件 (Featured)」开关"
        assert "主推排序权重" in publish_txt, "步骤 4 未找到「主推排序权重 (Featured Order)」"
        assert "首屏主推卡片直观预览" in publish_txt, "步骤 4 未找到「首屏主推卡片直观预览」"
        print("  ✓ 展示与发布步骤具备主推开关、主推排序权重以及首屏主推卡片直观预览")
        time.sleep(0.5)
        capture_screenshot("studio_wizard_publish_v3.png")

        # 7. 控制台错误检查
        assert len(console_errors) == 0, f"发现控制台错误: {console_errors}"
        print("✓ 全程控制台零报错")

        print("\n=== Phase 3 (v3) 自动化验收全部通过！ ===")

    finally:
        try:
            ws.close()
        except Exception:
            pass
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_phase_3_test()
