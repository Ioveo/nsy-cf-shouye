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

def run_phase_b_test():
    print("=== 开始 Phase B 自动化全链路验收 ===")

    # 1. 后台登录获取 token
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": PASSWORD}).json()
    assert login_res.get("success"), f"Login failed: {login_res}"
    token = login_res["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ 1. 后台登录成功")

    # 清理已存在的测试软件
    cat = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
    for s in cat.get("catalog", {}).get("software", []):
        if s.get("slug") == "test-mac-app":
            requests.post(f"{BASE_URL}/api/admin/software/delete", json={"id": s["id"], "force": True}, headers=headers)

    # 2. 新建一个只有 macOS 包的软件
    sw_data = {
        "id": "test-mac-app",
        "slug": "test-mac-app",
        "name": "Mac 专享极速工具",
        "categoryId": "desktop",
        "tagline": "基于 Apple Silicon 原生打造的轻量效能中枢",
        "description": "## 专为 Mac 打造\n\n提供原生 **Apple Silicon M系列** 芯片超强算力支持。\n\n- 极致能效\n- 零延迟调度",
        "requirements": "macOS 12.0+",
        "featured": False,
        "featuredOrder": 1,
        "priceLabel": "免费",
        "developer": "NSY Mac Lab",
        "website": "https://nsyoo.com",
        "highlights": [
            {"title": "原生加速", "text": "Metal 3 硬件加速图形管线"},
            {"title": "低耗内存", "text": "仅占用 24MB 物理常驻内存"}
        ],
        "screenshots": ["/card-desktop-full.png", "/preview-desktop-widgets.png"]
    }
    create_res = requests.post(f"{BASE_URL}/api/admin/software", json=sw_data, headers=headers).json()
    assert create_res.get("success"), f"Create software failed: {create_res}"
    print("✓ 2. 新建软件成功 (test-mac-app)")

    # 3. 为该软件上传一个 macOS dmg 包
    dmg_content = b"TEST_MACOS_DMG_CONTENT_DATA_12345678"
    files = {
        "token": (None, token),
        "softwareId": (None, "test-mac-app"),
        "version": (None, "1.0.0"),
        "changelog": (None, "首次公测版本发布"),
        "isLatest": (None, "1"),
        "file": ("MacTool-1.0.0-mac.zip", dmg_content, "application/zip")
    }
    up_res = requests.post(f"{BASE_URL}/api/admin/releases", files=files).json()
    assert up_res.get("success"), f"Upload DMG failed: {up_res}"

    # 确保 platform 为 macos
    cat_after = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
    mac_sw = next(s for s in cat_after["catalog"]["software"] if s["slug"] == "test-mac-app")
    rel_id = mac_sw["releases"][0]["id"]
    requests.post(f"{BASE_URL}/api/admin/releases/update", json={
        "releaseId": rel_id,
        "action": "edit",
        "platform": "macos",
        "label": "macOS 官方通用版",
        "status": "published",
        "isLatest": True
    }, headers=headers)
    print("✓ 3. 上传并发布 macOS 专用安装包成功")

    # 4. 在 Chrome 中验证 download.html 平台筛选功能
    print("=== 4. 浏览器端验证列表页筛选与展示 ===")
    tmp_profile = os.path.abspath("tmp_chrome_phase_b")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9225",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={tmp_profile}",
        "about:blank"
    ])

    time.sleep(2)
    try:
        tabs = requests.get("http://127.0.0.1:9225/json/list").json()
        page_tabs = [t for t in tabs if t.get("type") == "page"]
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]
        ws = websocket.create_connection(ws_url)
        ws.settimeout(1.0)
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
            while time.time() - start < 5:
                try:
                    raw = ws.recv()
                    msg = json.loads(raw)
                    if msg.get("id") == mid:
                        return msg.get("result", {}).get("result", {}).get("value")
                except websocket.WebSocketTimeoutException:
                    continue
            return None

        def poll_text(keyword, timeout=10):
            start = time.time()
            while time.time() - start < timeout:
                txt = eval_js("document.body ? document.body.textContent : ''") or ""
                if keyword in txt:
                    return txt
                time.sleep(0.3)
            return eval_js("document.body ? document.body.textContent : ''") or ""

        send("Page.enable")
        send("Runtime.enable")
        send("Log.enable")

        # 4.1 打开 /download.html 默认全平台
        send("Page.navigate", {"url": f"{BASE_URL}/download.html"})
        text_all = poll_text("Mac 专享极速工具", timeout=12)
        assert "Mac 专享极速工具" in text_all, "全部平台下应能看到 Mac 专享极速工具"
        print("✓ 4.1 软件中心列表页成功加载，找到「Mac 专享极速工具」")

        # 4.2 切换至 macOS 筛选：应能看到
        res_mac = eval_js("(() => { const btn = document.querySelector('button[data-platform=\"macos\"]'); if (btn) { btn.click(); return 'CLICKED_MAC'; } return 'NO_MAC_BTN'; })()")
        print("4.2 Click macOS result:", res_mac)
        time.sleep(1)
        mac_text = eval_js("document.getElementById('softwareGrid').textContent")
        assert "Mac 专享极速工具" in mac_text, f"macOS 筛选下必须能看到 Mac 工具: {mac_text}"
        print("✓ 4.2 点击「macOS」筛选成功，列表中包含「Mac 专享极速工具」")

        # 4.3 切换至 Windows 筛选：应该看不到！
        res_win = eval_js("(() => { const btn = document.querySelector('button[data-platform=\"windows\"]'); if (btn) { btn.click(); return 'CLICKED_WIN'; } return 'NO_WIN_BTN'; })()")
        print("4.3 Click Windows result:", res_win)
        time.sleep(1)
        win_text = eval_js("document.getElementById('softwareGrid').textContent")
        print("4.3 Windows grid text:", win_text.strip().replace('\n', ' ')[:120])
        assert "Mac 专享极速工具" not in win_text, f"Windows 筛选下绝不应该看到 Mac 工具: {win_text}"
        print("✓ 4.3 点击「Windows」筛选成功，列表中排除了「Mac 专享极速工具」")

        # 5. 设为主推后出现在轮播
        print("=== 5. 验证主推轮播特性 ===")
        # 初始状态未主推，轮播不应有它
        eval_js("const allBtn = document.querySelector('button[data-platform=\"all\"]'); if (allBtn) allBtn.click();")
        time.sleep(1)
        carousel_text_before = eval_js("document.getElementById('carouselTrack')?.textContent || ''")
        assert "Mac 专享极速工具" not in carousel_text_before, "未设主推时不应在轮播中"

        # 设置为主推
        sw_data["featured"] = True
        sw_data["featuredOrder"] = 1
        requests.post(f"{BASE_URL}/api/admin/software", json=sw_data, headers=headers)
        
        # 刷新页面验证出现在轮播中
        send("Page.navigate", {"url": f"{BASE_URL}/download.html"})
        poll_text("精选主推", timeout=10)
        carousel_text_after = eval_js("document.getElementById('carouselTrack')?.textContent || ''")
        assert "Mac 专享极速工具" in carousel_text_after, f"设为主推后轮播必须显示 Mac 工具: {carousel_text_after}"
        print("✓ 5. 设为主推后成功在顶部轮播中展现！")

        # 6. 下载 3 次后下载榜变化
        print("=== 6. 验证下载统计与排行榜 Top 10 ===")
        rank_before = eval_js("document.getElementById('rankingTop10')?.textContent || ''")
        
        # 连续下载 3 次
        for i in range(3):
            dl_res = requests.get(f"{BASE_URL}/download/{rel_id}")
            assert dl_res.status_code == 200, f"Download failed: {dl_res.status_code}"
            time.sleep(0.2)

        # 刷新列表页查看排行榜下载数更新
        send("Page.navigate", {"url": f"{BASE_URL}/download.html"})
        time.sleep(2)
        rank_after = eval_js("document.getElementById('rankingTop10')?.textContent || ''")
        assert "Mac 专享极速工具" in rank_after and "3 次" in rank_after, f"下载榜未检测到 3 次下载记录: {rank_after}"
        print("✓ 6. 下载 3 次后，排行榜实时更新并正确显示「3 次」下载！")

        # 7. 详情页 software.html 测试
        print("=== 7. 验证 software.html 详情页 ===")
        send("Page.navigate", {"url": f"{BASE_URL}/software.html?slug=test-mac-app"})
        detail_txt = poll_text("专为 Mac 打造", timeout=10)
        assert "专为 Mac 打造" in detail_txt, f"Detail page missing content: {detail_txt[:200]}"
        assert "Mac 专享极速工具" in detail_txt, "Detail page missing title"
        assert "macOS 12.0+" in detail_txt, "Detail page missing requirements"
        assert "原生加速" in detail_txt, "Detail page missing highlights"
        print("✓ 7. software.html 详情页渲染完整（Markdown、亮点、规格、下载包）")

        # 8. 测试兼容旧链接: download.html?app=test-mac-app 应跳转到 /software.html?slug=test-mac-app
        print("=== 8. 验证旧版参数跳转兼容 ===")
        send("Page.navigate", {"url": f"{BASE_URL}/download.html?app=test-mac-app"})
        time.sleep(2)
        current_href = eval_js("window.location.href")
        assert ("software" in current_href) and ("slug=test-mac-app" in current_href), f"Expected redirect to software: {current_href}"
        print(f"✓ 8. 旧链接 /download.html?app=test-mac-app 成功自动跳转至: {current_href}")

    finally:
        proc.terminate()

    print("\n🎉 PHASE B 全项验收通过！")

if __name__ == "__main__":
    run_phase_b_test()
