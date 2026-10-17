import os
import sys
import json
import time
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

def run_phase_2_test():
    print("=== 开始 Phase 2 (v3) Studio 路由与卡顿修复自动化验收 ===")

    # 1. 后台登录获取 token
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": PASSWORD}).json()
    assert login_res.get("success"), f"Login failed: {login_res}"
    token = login_res["token"]
    print("✓ 1. 后台登录接口通过")

    import socket
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    cdp_port = s.getsockname()[1]
    s.close()

    tmp_profile = os.path.abspath(f"tmp_chrome_phase_2_{cdp_port}")
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
        ws.settimeout(2.0)
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

        send("Page.enable")
        send("Runtime.enable")
        send("Log.enable")
        send("Emulation.setDeviceMetricsOverride", {
            "width": 1440,
            "height": 900,
            "deviceScaleFactor": 1,
            "mobile": False
        })

        # 3. 注入 sessionStorage token 并进入 Studio
        send("Page.navigate", {"url": f"{BASE_URL}/studio/sign-in"})
        time.sleep(1.5)
        eval_js(f"""
            sessionStorage.setItem('downloadAdminToken', '{token}');
            sessionStorage.setItem('admin_token', '{token}');
        """)

        # 4. 进入 /studio/content/articles
        send("Page.navigate", {"url": f"{BASE_URL}/studio/content/articles"})
        txt1 = poll_text("文章专栏管理", timeout=8)
        assert "文章专栏管理" in txt1, f"无法进入文章管理: {txt1[:200]}"
        print("✓ 2. 初始加载 /studio/content/articles 成功")

        # 5. 模拟在侧边栏连续快速点击切换：文章 -> 音乐 -> 画廊 -> 软件 -> 照片墙 -> 文章
        # 记录初始的 navigation count / timestamp
        eval_js("window.__test_page_reload_tracker = 1")

        routes_to_test = [
            ("a[href*='/content/music']", "音乐频道管理", "/content/music"),
            ("a[href*='/content/gallery']", "画廊相册管理", "/content/gallery"),
            ("a[href*='/content/photo-wall']", "照片墙互动展示", "/content/photo-wall"),
            ("a[href*='/software']", "统一管理软件档案", "/software"),
            ("a[href*='/site/carousel']", "首页巨幕轮播管理", "/site/carousel"),
            ("a[href*='/site/navigation']", "站点顶部导航管理", "/site/navigation"),
            ("a[href*='/content/articles']", "文章专栏管理", "/content/articles"),
        ]

        print("=== 3. 开始侧边栏连续无刷新快速切换验收 ===")
        for selector, expected_text, expected_path in routes_to_test:
            t0 = time.time()
            click_res = eval_js(f"""
                (() => {{
                    const el = document.querySelector("{selector}");
                    if (el) {{
                        el.click();
                        return true;
                    }}
                    return false;
                }})()
            """)
            if not click_res:
                links = eval_js("Array.from(document.querySelectorAll('a')).map(a => a.href + ' ' + (a.innerText || ''))")
                print("DEBUG FOUND LINKS:", links)
            assert click_res, f"未找到侧边栏元素: {selector}"

            # 等待内容切换成功
            body_txt = poll_text(expected_text, timeout=5)
            cost_ms = (time.time() - t0) * 1000
            assert expected_text in body_txt, f"点击 {selector} 后未看到期望文字: {expected_text}"
            
            # 验证 URL 正确变化
            current_path = eval_js("window.location.pathname")
            assert expected_path in current_path, f"URL 未正确更新: current={current_path}, expected={expected_path}"
            
            # 验证无整页 reload (tracker 变量必须依旧存在)
            tracker = eval_js("window.__test_page_reload_tracker")
            assert tracker == 1, f"检测到发生整页刷新！tracker lost on {selector}"

            print(f"  ✓ 瞬时切换至 [{expected_text}] (路径: {expected_path}, 响应耗时: {cost_ms:.1f}ms, 无刷新)")

        # 6. 测试历史旧地址重定向：/studio/content?tab=music -> /studio/content/music
        print("\n=== 4. 验证旧地址重定向兼容性 ===")
        send("Page.navigate", {"url": f"{BASE_URL}/studio/content?tab=music"})
        poll_text("音乐频道管理", timeout=8)
        redirected_path = eval_js("window.location.pathname")
        print(f"  访问 /studio/content?tab=music 成功重定向至: {redirected_path}")
        assert "/content/music" in redirected_path, f"重定向失败: {redirected_path}"
        print("✓ 旧地址重定向验证通过")

        # 7. 控制台错误检查
        assert len(console_errors) == 0, f"发现控制台错误: {console_errors}"
        print("✓ 全程控制台零报错")

        print("\n=== Phase 2 (v3) 自动化验收全部通过！ ===")

    finally:
        try:
            ws.close()
        except Exception:
            pass
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_phase_2_test()
