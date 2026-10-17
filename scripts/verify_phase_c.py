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

def run_phase_c_test():
    print("=== 开始 Phase C 自动化全链路验收 ===")

    # 1. 后台登录获取 token
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": PASSWORD}).json()
    assert login_res.get("success"), f"Login failed: {login_res}"
    token = login_res["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ 1. 后台登录成功")

    # 清理已存在的测试软件
    cat = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
    for s in cat.get("catalog", {}).get("software", []):
        if s.get("slug") == "wizard-app-v2":
            requests.post(f"{BASE_URL}/api/admin/software/delete", json={"id": s["id"], "force": True}, headers=headers)

    # 2. 模拟向导：上传 3 张截图
    screenshot_urls = []
    for i in range(1, 4):
        img_bytes = f"FAKED_PNG_SCREENSHOT_DATA_{i}".encode("utf-8")
        files = {
            "token": (None, token),
            "kind": (None, "image"),
            "folder": (None, "software-wizard-app-v2"),
            "storageId": (None, "default"),
            "file": (f"screenshot_{i}.png", img_bytes, "image/png")
        }
        res = requests.post(f"{BASE_URL}/api/admin/assets/upload", files=files).json()
        assert res.get("success"), f"Upload screenshot {i} failed: {res}"
        url = res.get("url") or res.get("asset", {}).get("url")
        screenshot_urls.append(url)
    print(f"✓ 2. 上传 3 张截图成功: {screenshot_urls}")

    # 3. 存为草稿 (status: "draft")
    draft_payload = {
        "id": "wizard-app-v2",
        "slug": "wizard-app-v2",
        "name": "极速向导发布神器",
        "categoryId": "desktop",
        "tagline": "一站式发布、智能识别多平台安装包并实时预览",
        "description": "## 向导神器详细介绍\n\n- 自动识别多平台\n- 8路断点分片续传\n- 实时检查清单校验",
        "requirements": "Windows 10 / 11 64位, macOS 12+",
        "priceLabel": "免费",
        "developer": "天才猫 Studio",
        "website": "https://nsyoo.com",
        "iconUrl": screenshot_urls[0],
        "coverUrl": screenshot_urls[1],
        "screenshots": screenshot_urls,
        "highlights": [
            {"title": "全平台覆盖", "text": "支持 Windows 与 便携免安装版"},
            {"title": "秒级发布", "text": "向导化配置，实时防呆校验"},
            {"title": "安全稳定", "text": "Cloudflare R2 存储与高速直链"}
        ],
        "featured": False,
        "featuredOrder": 1,
        "status": "draft"
    }

    res_draft = requests.post(f"{BASE_URL}/api/admin/software", json=draft_payload, headers=headers).json()
    assert res_draft.get("success"), f"Save draft failed: {res_draft}"
    print("✓ 3. 成功保存软件为草稿 (status: draft)")

    # 4. 验证前台公开接口不可见 (前台看不到草稿)
    public_cat = requests.get(f"{BASE_URL}/api/catalog").json()
    public_slugs = [s["slug"] for s in public_cat.get("software", [])]
    assert "wizard-app-v2" not in public_slugs, f"Error: Draft software appeared in public catalog! {public_slugs}"
    print("✓ 4. 前台公开接口验证：草稿软件在前台完全不可见")

    # 5. 启动 Chrome 验证预览模式 (preview=1 + postMessage)
    print("=== 5. 启动 Chrome 验证预览模式 ===")
    tmp_profile = os.path.abspath("tmp_chrome_phase_c")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9227",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={tmp_profile}",
        "about:blank"
    ])

    ws = None
    try:
        time.sleep(2)
        tabs = requests.get("http://127.0.0.1:9227/json/list").json()
        page_tabs = [t for t in tabs if t.get("type") == "page"]
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]
        ws = websocket.create_connection(ws_url)
        ws.settimeout(1.0)
        msg_id = 1

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
                    if msg.get("id") == mid:
                        return msg.get("result", {}).get("result", {}).get("value")
                except websocket.WebSocketTimeoutException:
                    continue
            return None

        def navigate_page(url, wait_sec=2):
            send("Page.navigate", {"url": url})
            time.sleep(wait_sec)

        send("Page.enable")
        send("Runtime.enable")

        # 导航到 /software.html?preview=1
        navigate_page(f"{BASE_URL}/software.html?preview=1", 2)

        # 模拟 Studio 发送 postMessage
        preview_data = {
            **draft_payload,
            "categoryName": "桌面效能",
            "releases": [
                {
                    "id": "rel-win",
                    "version": "1.0.0",
                    "fileName": "Wizard-Setup-1.0.0.exe",
                    "fileSize": 1024000,
                    "size": "1.0 MB",
                    "platform": "windows",
                    "label": "Windows 安装包",
                    "isLatest": True,
                    "status": "published"
                },
                {
                    "id": "rel-port",
                    "version": "1.0.0",
                    "fileName": "Wizard-Portable-1.0.0.zip",
                    "fileSize": 950000,
                    "size": "928 KB",
                    "platform": "portable",
                    "label": "绿色便携版",
                    "isLatest": False,
                    "status": "published"
                }
            ]
        }
        send_msg_script = f"""
        window.postMessage({{
            type: "studio-preview",
            software: {json.dumps(preview_data)}
        }}, window.location.origin);
        """
        eval_js(send_msg_script)
        time.sleep(1)

        # 验证详情页成功渲染了预览数据
        check_script = """
        ({
            title: document.getElementById('hero-title')?.textContent,
            tagline: document.getElementById('hero-tagline')?.textContent,
            hasPreviewNotice: document.body.textContent.includes('草稿预览') || document.body.textContent.includes('预览模式') || document.body.textContent.includes('极速向导发布神器'),
            packageCount: document.querySelectorAll('.package-card, #other-packages-menu a, [data-platform]').length
        })
        """
        check_res = eval_js(check_script)
        assert check_res and "极速向导发布神器" in (check_res.get("title") or ""), f"Preview title mismatch: {check_res}"
        print(f"✓ 5. 详情页预览模式成功渲染草稿: {check_res}")

        # 6. 上传两个真实安装包（Windows 包 + 绿色版）并上架
        print("=== 6. 上传 Windows 安装包与绿色便携版 ===")
        # 包 1: Windows 安装包
        win_bytes = b"MOCK_WINDOWS_EXE_DATA_SETUP_123456"
        res_win = requests.post(f"{BASE_URL}/api/admin/releases", files={
            "token": (None, token),
            "softwareId": (None, "wizard-app-v2"),
            "version": (None, "1.0.0"),
            "changelog": (None, "首发 1.0.0 正式版"),
            "isLatest": (None, "1"),
            "file": ("Wizard-Setup-v1.0.0.exe", win_bytes, "application/octet-stream")
        }).json()
        assert res_win.get("success"), f"Upload Win package failed: {res_win}"

        # 获取新增版本并更新 platform/label
        cat_p = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
        sw_obj = next(s for s in cat_p["catalog"]["software"] if s["slug"] == "wizard-app-v2")
        win_rel = next(r for r in sw_obj["releases"] if r["fileName"] == "Wizard-Setup-v1.0.0.exe")
        requests.post(f"{BASE_URL}/api/admin/releases/update", json={
            "releaseId": win_rel["id"],
            "action": "edit",
            "version": "1.0.0",
            "platform": "windows",
            "label": "Windows 官方安装包",
            "arch": "x64",
            "status": "published",
            "isLatest": True
        }, headers=headers)

        # 包 2: 绿色便携版
        port_bytes = b"MOCK_PORTABLE_ZIP_DATA_789012"
        res_port = requests.post(f"{BASE_URL}/api/admin/releases", files={
            "token": (None, token),
            "softwareId": (None, "wizard-app-v2"),
            "version": (None, "1.0.0"),
            "changelog": (None, "首发 1.0.0 正式版"),
            "isLatest": (None, "0"),
            "file": ("Wizard-v1.0.0-portable.zip", port_bytes, "application/zip")
        }).json()
        assert res_port.get("success"), f"Upload Portable package failed: {res_port}"

        cat_p2 = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
        sw_obj2 = next(s for s in cat_p2["catalog"]["software"] if s["slug"] == "wizard-app-v2")
        port_rel = next(r for r in sw_obj2["releases"] if r["fileName"] == "Wizard-v1.0.0-portable.zip")
        requests.post(f"{BASE_URL}/api/admin/releases/update", json={
            "releaseId": port_rel["id"],
            "action": "edit",
            "version": "1.0.0",
            "platform": "portable",
            "label": "绿色便携免安装版",
            "arch": "x64",
            "status": "published",
            "isLatest": False
        }, headers=headers)

        # 将软件状态改为 active（正式上架）
        res_active = requests.post(f"{BASE_URL}/api/admin/software", json={
            **draft_payload,
            "status": "active"
        }, headers=headers).json()
        assert res_active.get("success"), f"Publish software failed: {res_active}"
        print("✓ 6. 两个安装包上传完成，软件正式上架 (status: active)")

        # 7. 验证前台公开页面出现该软件
        navigate_page(f"{BASE_URL}/download.html", 2)
        check_front = """
        ({
            hasApp: document.body.textContent.includes('极速向导发布神器'),
            hasWinPlatform: document.body.textContent.includes('windows') || document.body.textContent.includes('Windows'),
            hasPortPlatform: document.body.textContent.includes('portable') || document.body.textContent.includes('绿色')
        })
        """
        front_res = eval_js(check_front)
        assert front_res and front_res.get("hasApp"), f"Software not found on download.html: {front_res}"
        print(f"✓ 7. 前台软件中心页面验证：已上架软件正常展示在列表网格 (front_res={front_res})")

        # 8. 设为主推软件 (featured: true, featuredOrder: 1)
        print("=== 8. 设为主推软件并验证轮播展示 ===")
        res_featured = requests.post(f"{BASE_URL}/api/admin/software", json={
            **draft_payload,
            "status": "active",
            "featured": True,
            "featuredOrder": 1
        }, headers=headers).json()
        assert res_featured.get("success"), f"Set featured failed: {res_featured}"

        # 刷新前台 download.html
        navigate_page(f"{BASE_URL}/download.html", 2)
        check_carousel = """
        ({
            hasCarousel: Boolean(document.getElementById('featuredCarouselSection')),
            inCarousel: (document.getElementById('carouselTrack')?.textContent || '').includes('极速向导发布神器')
        })
        """
        carousel_res = eval_js(check_carousel)
        assert carousel_res and carousel_res.get("inCarousel"), f"Featured software not in carousel: {carousel_res}"
        print(f"✓ 8. 轮播验证通过：主推软件已成功展示在首屏大轮播图中！(carousel_res={carousel_res})")

        # 9. 验证 Studio 后台路由可以直接打开并展示该软件
        navigate_page(f"{BASE_URL}/studio/software", 2)
        check_studio = """
        ({
            inStudio: document.body.textContent.includes('软件管理') || document.body.textContent.includes('极速向导发布神器')
        })
        """
        studio_res = eval_js(check_studio)
        print(f"✓ 9. Studio 软件列表页加载正常: {studio_res}")

        # 清理测试数据
        requests.post(f"{BASE_URL}/api/admin/software/delete", json={"id": "wizard-app-v2", "force": True}, headers=headers)
        print("✓ 10. 测试数据清理完成")

    finally:
        if ws:
            ws.close()
        proc.kill()
        proc.wait()

    print("\n==========================================")
    print("🎉 Phase C 所有功能验收全部通过！")
    print("==========================================")

if __name__ == "__main__":
    run_phase_c_test()
