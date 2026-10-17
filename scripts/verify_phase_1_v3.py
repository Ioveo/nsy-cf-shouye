import os
import sys
import json
import time
import subprocess
import base64
import requests
import websocket

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8788"
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"

def run_verification():
    print("=== 开始 Phase 1 (v3) 自动化端到端验收 ===")
    
    tmp_profile = os.path.abspath("tmp_chrome_phase_1_v3")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9226",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={tmp_profile}",
        "about:blank"
    ])

    time.sleep(2)
    try:
        tabs = requests.get("http://127.0.0.1:9226/json/list").json()
        page_tabs = [t for t in tabs if t.get("type") == "page"]
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]
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

        def set_viewport(w, h, mobile=False):
            send("Emulation.setDeviceMetricsOverride", {
                "width": w,
                "height": h,
                "deviceScaleFactor": 1,
                "mobile": mobile
            })
            time.sleep(0.5)

        def take_screenshot(filename):
            mid = send("Page.captureScreenshot", {"format": "png"})
            start = time.time()
            while time.time() - start < 8:
                try:
                    raw = ws.recv()
                    msg = json.loads(raw)
                    if msg.get("id") == mid:
                        data = msg["result"]["data"]
                        target_path = os.path.join(ARTIFACT_DIR, filename)
                        with open(target_path, "wb") as f:
                            f.write(base64.b64decode(data))
                        print(f"  [截图保存成功] {target_path}")
                        return target_path
                except websocket.WebSocketTimeoutException:
                    continue
            raise TimeoutError("Screenshot timeout")

        send("Page.enable")
        send("Runtime.enable")
        send("Log.enable")

        # -------------------------------------------------------------
        # 1. 验证 download.html
        # -------------------------------------------------------------
        print("\n--- 1. 验证 download.html (软件中心主列表页) ---")
        send("Page.navigate", {"url": f"{BASE_URL}/download.html"})
        time.sleep(2)

        # 检查控制台报错
        eval_js("1+1")
        assert len(console_errors) == 0, f"发现控制台报错: {console_errors}"
        print("✓ 控制台零报错")

        # 验证 1440 宽
        set_viewport(1440, 900)
        scroll_w_1440 = eval_js("document.documentElement.scrollWidth")
        inner_w_1440 = eval_js("window.innerWidth")
        print(f"  1440px 视口宽度: scrollWidth={scroll_w_1440}, innerWidth={inner_w_1440}")
        assert scroll_w_1440 <= inner_w_1440, "1440px 下存在意外横向溢出"
        take_screenshot("download_v3_1440.png")

        # 验证 1024 宽
        set_viewport(1024, 768)
        scroll_w_1024 = eval_js("document.documentElement.scrollWidth")
        inner_w_1024 = eval_js("window.innerWidth")
        print(f"  1024px 视口宽度: scrollWidth={scroll_w_1024}, innerWidth={inner_w_1024}")
        if scroll_w_1024 > inner_w_1024:
            diag = eval_js("""
                (() => {
                    const docW = window.innerWidth;
                    const res = [];
                    document.querySelectorAll('*').forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.right > docW + 1) {
                            res.push({
                                tag: el.tagName,
                                id: el.id,
                                cls: el.className,
                                right: r.right,
                                width: r.width
                            });
                        }
                    });
                    return res.slice(0, 10);
                })()
            """)
            print(f"  [溢出元素诊断] {json.dumps(diag, indent=2, ensure_ascii=False)}")
        assert scroll_w_1024 <= inner_w_1024, "1024px 下存在意外横向溢出"
        take_screenshot("download_v3_1024.png")

        # 验证 390 宽 (手机)
        set_viewport(390, 844, mobile=True)
        scroll_w_390 = eval_js("document.documentElement.scrollWidth")
        inner_w_390 = eval_js("window.innerWidth")
        print(f"  390px 视口宽度: scrollWidth={scroll_w_390}, innerWidth={inner_w_390}")
        assert scroll_w_390 <= inner_w_390, "390px 手机视口下存在意外横向溢出"
        take_screenshot("download_v3_390.png")

        # 恢复桌面视口测试交互响应时间
        set_viewport(1440, 900)

        # 交互 1: 平台分段筛选响应时间
        t_start = time.time()
        res_plat = eval_js("""
            (() => {
                const btn = document.querySelector('.sc-segment__btn[data-platform="windows"]');
                if (btn) btn.click();
                return document.querySelectorAll('.sc-card').length;
            })()
        """)
        t_cost_plat = (time.time() - t_start) * 1000
        print(f"✓ 平台筛选响应耗时: {t_cost_plat:.2f}ms (<100ms 约束), 筛选后数量: {res_plat}")
        assert t_cost_plat < 100, f"平台切换耗时超过 100ms: {t_cost_plat}ms"

        # 交互 2: URL 参数同步
        current_href = eval_js("window.location.search")
        assert "platform=windows" in current_href, f"URL 未同步 platform 参数: {current_href}"
        print(f"✓ URL 状态已无刷新同步: {current_href}")

        # 交互 3: 下载链接检查
        dl_links = eval_js("""
            (() => {
                const links = Array.from(document.querySelectorAll('a[href^="/download/"]')).map(a => a.getAttribute('href'));
                return links;
            })()
        """)
        print(f"✓ 检测到前台 {len(dl_links)} 个下载链接，样例: {dl_links[:3]}")
        assert len(dl_links) > 0, "应包含 /download/<id> 的下载直链"
        for l in dl_links:
            assert l.startswith("/download/"), f"非法下载链接: {l}"

        # -------------------------------------------------------------
        # 2. 验证 software.html
        # -------------------------------------------------------------
        print("\n--- 2. 验证 software.html (软件详情页) ---")
        send("Page.navigate", {"url": f"{BASE_URL}/software.html"})
        time.sleep(2)

        # 检查控制台报错
        eval_js("1+1")
        assert len(console_errors) == 0, f"发现控制台报错: {console_errors}"
        print("✓ 控制台零报错")

        # 验证 1440 宽
        set_viewport(1440, 900)
        sw_scroll_1440 = eval_js("document.documentElement.scrollWidth")
        sw_inner_1440 = eval_js("window.innerWidth")
        assert sw_scroll_1440 <= sw_inner_1440, "software.html 1440px 下存在意外横向溢出"
        take_screenshot("software_v3_1440.png")

        # 验证 1024 宽
        set_viewport(1024, 768)
        sw_scroll_1024 = eval_js("document.documentElement.scrollWidth")
        sw_inner_1024 = eval_js("window.innerWidth")
        assert sw_scroll_1024 <= sw_inner_1024, "software.html 1024px 下存在意外横向溢出"
        take_screenshot("software_v3_1024.png")

        # 验证 390 宽 (手机)
        set_viewport(390, 844, mobile=True)
        sw_scroll_390 = eval_js("document.documentElement.scrollWidth")
        sw_inner_390 = eval_js("window.innerWidth")
        assert sw_scroll_390 <= sw_inner_390, "software.html 390px 下存在意外横向溢出"
        take_screenshot("software_v3_390.png")

        # 验证详情页主要 DOM 元素就绪
        app_name = eval_js("document.getElementById('appName').textContent")
        assert app_name and app_name != "-", f"软件详情名称未正确加载: {app_name}"
        print(f"✓ 详情页软件名称加载成功: 「{app_name}」")

        print("\n=== Phase 1 (v3) 自动化端到端验收全部通过！ ===")

    finally:
        try:
            ws.close()
        except Exception:
            pass
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    run_verification()
