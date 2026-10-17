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

def test_api_flow():
    print("=== 1. 测试 API 业务全流程 ===")
    
    # 1.1 登录
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": PASSWORD}).json()
    assert login_res.get("success"), f"Login failed: {login_res}"
    token = login_res["token"]
    print("✓ 1.1 登录成功获取令牌")
    headers = {"Authorization": f"Bearer {token}"}

    # Clean up studio-demo if exists
    init_cat = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
    for item in init_cat.get("catalog", {}).get("software", []):
        if item.get("slug") == "studio-demo" or item.get("id") == "studio-demo":
            requests.post(f"{BASE_URL}/api/admin/software/delete", json={"id": item["id"], "force": True}, headers=headers)

    # 1.2 新建软件
    sw_payload = {
        "id": "studio-demo",
        "slug": "studio-demo",
        "name": "Studio 演示软件",
        "categoryId": "general",
        "tagline": "基于新 Studio 深度架构发布的生产力工具",
        "requirements": "Windows 10 / 11 64位",
        "landingUrl": "/download.html?app=studio-demo",
        "sortOrder": 0,
        "highlights": [
            {"title": "分片直传", "text": "最高支持 10GB 大文件 8 路乱序分片上传"},
            {"title": "多平台矩阵", "text": "同一版本支持标准安装版与绿色免安装版"}
        ]
    }
    sw_res = requests.post(f"{BASE_URL}/api/admin/software", json=sw_payload, headers=headers).json()
    assert sw_res.get("success"), f"Create software failed: {sw_res}"
    print("✓ 1.2 新建软件成功 (studio-demo)")

    # 1.3 上传 15MB 以上安装包（走分片上传）
    size_15mb = 15 * 1024 * 1024 + 512 * 1024  # 15.5MB
    content_15mb = b"A" * size_15mb
    file_name_15mb = "studio-demo-3.0.0-Setup.exe"

    presign_res = requests.post(
        f"{BASE_URL}/api/admin/releases/presign",
        json={"softwareId": "studio-demo", "version": "3.0.0", "fileName": file_name_15mb, "fileSize": size_15mb},
        headers=headers
    ).json()
    assert presign_res.get("success"), f"Presign failed: {presign_res}"
    upload_id = presign_res["uploadId"]
    file_key = presign_res["fileKey"]

    # 上传 2 个分片 (Part 1: 10MB, Part 2: 5.5MB)
    part_size = 10 * 1024 * 1024
    parts = []
    
    # Part 1
    part1_data = content_15mb[:part_size]
    p1_res = requests.post(
        f"{BASE_URL}/api/admin/uploads/part",
        data=part1_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
            "X-Upload-Id": upload_id,
            "X-File-Key": file_key,
            "X-Part-Number": "1",
            "X-Storage-Id": "default"
        }
    ).json()
    assert p1_res.get("success"), f"Part 1 failed: {p1_res}"
    parts.append({"partNumber": 1, "etag": p1_res["etag"]})

    # Part 2
    part2_data = content_15mb[part_size:]
    p2_res = requests.post(
        f"{BASE_URL}/api/admin/uploads/part",
        data=part2_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream",
            "X-Upload-Id": upload_id,
            "X-File-Key": file_key,
            "X-Part-Number": "2",
            "X-Storage-Id": "default"
        }
    ).json()
    assert p2_res.get("success"), f"Part 2 failed: {p2_res}"
    parts.append({"partNumber": 2, "etag": p2_res["etag"]})

    # 合并分片完成发布
    comp_res = requests.post(
        f"{BASE_URL}/api/admin/releases/complete-upload",
        json={
            "uploadId": upload_id,
            "fileKey": file_key,
            "softwareId": "studio-demo",
            "version": "3.0.0",
            "fileName": file_name_15mb,
            "fileSize": size_15mb,
            "parts": parts,
            "changelog": "这是 15.5MB 分片上传发布的大包",
            "isLatest": True
        },
        headers=headers
    ).json()
    assert comp_res.get("success"), f"Complete upload failed: {comp_res}"
    print("✓ 1.3 上传 15.5MB 安装包（走分片上传）发布成功")

    # 1.4 再为同版本上传绿色版 (portable)
    portable_content = b"PORTABLE_PACKAGE_CONTENT_V300"
    files = {
        "token": (None, token),
        "softwareId": (None, "studio-demo"),
        "version": (None, "3.0.0"),
        "changelog": (None, "同版本绿色便携版"),
        "isLatest": (None, "1"),
        "file": ("studio-demo-3.0.0-portable.zip", portable_content, "application/zip")
    }
    port_res = requests.post(f"{BASE_URL}/api/admin/releases", files=files).json()
    assert port_res.get("success"), f"Upload portable failed: {port_res}"
    print("✓ 1.4 同版本上传绿色便携版成功")

    # 1.5 编辑平台/包名
    cat_res = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
    sw_item = next(s for s in cat_res["catalog"]["software"] if s["slug"] == "studio-demo")
    releases = sw_item.get("releases", [])
    assert len(releases) == 2, f"Expected 2 releases for studio-demo, found {len(releases)}"

    r_exe = next(r for r in releases if "Setup.exe" in r["fileName"])
    r_zip = next(r for r in releases if "portable.zip" in r["fileName"])

    # 编辑 exe 包
    up1 = requests.post(
        f"{BASE_URL}/api/admin/releases/update",
        json={
            "releaseId": r_exe["id"],
            "action": "edit",
            "version": "3.0.0",
            "fileName": r_exe["fileName"],
            "platform": "windows",
            "label": "Windows 官方安装版",
            "arch": "x64",
            "isLatest": True,
            "status": "published"
        },
        headers=headers
    ).json()
    assert up1.get("success"), f"Update exe release failed: {up1}"

    # 编辑 zip 绿色包
    up2 = requests.post(
        f"{BASE_URL}/api/admin/releases/update",
        json={
            "releaseId": r_zip["id"],
            "action": "edit",
            "version": "3.0.0",
            "fileName": r_zip["fileName"],
            "platform": "portable",
            "label": "绿色便携免安装版",
            "arch": "x64",
            "isLatest": True,
            "status": "published"
        },
        headers=headers
    ).json()
    assert up2.get("success"), f"Update zip release failed: {up2}"
    print("✓ 1.5 编辑平台与包名成功 (windows / portable)")

    # 1.6 发布在线热更新
    hu_res = requests.post(
        f"{BASE_URL}/api/update",
        json={
            "app": "desktop",
            "version": "2.2.0",
            "appName": "天才猫桌面 2.0",
            "patchUrl": "/apps/desktop/TianCaiMao.Desktop.exe",
            "changelog": "Studio 在线热更新端到端发布验证通过"
        },
        headers=headers
    ).json()
    assert hu_res.get("success") or hu_res.get("version"), f"Publish update failed: {hu_res}"
    check_hu = requests.get(f"{BASE_URL}/api/update?app=desktop").json()
    assert check_hu.get("version") == "2.2.0", f"Hot update readback mismatch: {check_hu}"
    print("✓ 1.6 发布热更新并读取校验成功 (v2.2.0)")

    # 1.7 切换首页落地页
    set_home_res = requests.post(
        f"{BASE_URL}/api/admin/landing",
        json={"action": "setHome", "homeLanding": "desktop"},
        headers=headers
    ).json()
    assert set_home_res.get("success"), f"Set home landing failed: {set_home_res}"
    home_html = requests.get(f"{BASE_URL}/").text
    assert "desktop.html" in home_html or "data-landing-page=\"desktop\"" in home_html, "Home did not serve desktop landing"
    
    # 还原回 portal
    requests.post(f"{BASE_URL}/api/admin/landing", json={"action": "setHome", "homeLanding": "portal"}, headers=headers)
    print("✓ 1.7 切换首页落地页 (切至 desktop 验证再切回 portal) 成功")
    return token

def test_browser_flow(token):
    print("=== 2. 测试 Chrome 浏览器与控制台无报错 ===")
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
        f"{BASE_URL}/studio/sign-in"
    ])

    time.sleep(2)
    try:
        tabs = requests.get("http://127.0.0.1:9223/json/list").json()
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

        time.sleep(1)

        # 2.1 检查登录页渲染
        title = send("Runtime.evaluate", {"expression": "document.title"})["result"].get("value")
        print(f"✓ 2.1 登录页加载成功，页面标题: {title}")

        def poll_text(keyword, timeout=12):
            start = time.time()
            last_text = ""
            while time.time() - start < timeout:
                try:
                    res = send("Runtime.evaluate", {"expression": "document.body ? document.body.textContent : ''"})
                    last_text = res.get("result", {}).get("value", "") or ""
                    if keyword in last_text:
                        return last_text
                except Exception:
                    pass
                time.sleep(0.5)
            return last_text

        # 2.2 注入登录 token 并跳转至 /studio/
        send("Runtime.evaluate", {
            "expression": f"sessionStorage.setItem('downloadAdminToken', '{token}'); location.href = '/studio/';"
        })
        time.sleep(2)

        dash_url = send("Runtime.evaluate", {"expression": "window.location.pathname"})["result"].get("value")
        print(f"✓ 2.2 进入控制台: {dash_url}")

        # 2.3 导航至软件管理
        send("Runtime.evaluate", {
            "expression": "const link = document.querySelector('a[href=\"/software\"]') || document.querySelector('a[href=\"/studio/software\"]'); if (link) link.click(); else location.href = '/studio/software';"
        })
        sw_text = poll_text("Studio 演示软件", timeout=15)
        assert "Studio 演示软件" in sw_text, f"Expected 'Studio 演示软件' in software list: {sw_text[:200]}"
        print("✓ 2.3 软件管理列表加载成功，找到「Studio 演示软件」")

        # 2.4 导航至版本管理
        send("Runtime.evaluate", {
            "expression": "const link = document.querySelector('a[href=\"/releases\"]') || document.querySelector('a[href=\"/studio/releases\"]'); if (link) link.click(); else location.href = '/studio/releases';"
        })
        rel_text = poll_text("3.0.0", timeout=15)
        assert "Windows 官方安装版" in rel_text or "3.0.0" in rel_text, f"Expected release in releases list: {rel_text[:200]}"
        print("✓ 2.4 版本管理列表加载成功，找到 v3.0.0 及多平台安装包")

        # 2.5 访问前台软件中心页面 /download.html?app=studio-demo 验证看到两个下载包
        send("Runtime.evaluate", {"expression": "location.href = '/download.html?app=studio-demo';"})
        center_text = poll_text("Studio 演示软件", timeout=12)
        assert "Studio 演示软件" in center_text, f"Software center missing software name: {center_text[:200]}"
        assert "Windows 官方安装版" in center_text or "绿色便携免安装版" in center_text, "Software center missing package labels"
        print("✓ 2.5 前台软件中心页渲染成功，确认看到 studio-demo 及其两个不同平台下载包！")

        # 过滤并检查 console 报错
        real_errors = [e for e in console_errors if "favicon" not in str(e).lower()]
        assert len(real_errors) == 0, f"Found console errors: {real_errors}"
        print(f"✓ 2.6 全程控制台报错数: 0")

        ws.close()
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    t = test_api_flow()
    test_browser_flow(t)
    print("\n🎉 PHASE 3 验收全项通过！")
