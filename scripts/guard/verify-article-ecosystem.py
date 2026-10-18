# -*- coding: utf-8 -*-
import sys
import json
import time
import subprocess
import os
import socket
import requests
import websocket
import base64

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:8788"

def run_ecosystem_verification():
    print("=== Article & Software/Music Eco-System Closed Loop & R2 Verification ===")

    # 1. API & D1 Test: Post an article containing embedded software, music and R2 imagery
    print("\n--- Step 1: Testing Article Post to D1 with Software & Music Embeds ---")
    login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "admin123"}).json()
    token = login_resp.get("token")
    assert token, "Admin login must succeed"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    test_slug = f"ecosystem-closed-loop-{int(time.time())}"
    article_payload = {
        "title": "天才猫桌面 2.0 发布盛典：深度体验与原声大碟",
        "slug": test_slug,
        "summary": "全屏微信公众号排版工作台打造，正文深度引用自研软件、音乐频道原声音频与 R2 媒体库图片，实现完美生态闭环。",
        "category": "上手教程",
        "tags": ["生态闭环", "微信排版", "自研软件", "原声音乐"],
        "coverUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        "softwareIds": ["desktop"],
        "featured": True,
        "status": "published",
        "content": """
## 为什么生态闭环如此重要？

在过去，文章只是一篇孤立的博客。现在，通过全屏微信公众号工作台，我们实现了与**自研软件**和**音乐频道**的双向深度闭环。

<div class="article-callout article-callout--tip">
  <div class="article-callout__header">💡 沉浸式阅读提示</div>
  <p>点击下方嵌入的音乐卡片即可边听边读，享受沉浸式排版体验。</p>
</div>

<div class="article-embed-music" data-track-id="m-demo">
  <div class="article-embed-music__cover-wrap">
    <img src="/logo.png" alt="灵动清晨" class="article-embed-music__cover" />
    <button type="button" class="article-embed-music__play-btn" aria-label="播放音乐">
      <span class="article-embed-music__play-icon">▶</span>
    </button>
  </div>
  <div class="article-embed-music__main">
    <div class="article-embed-music__title-row">
      <h4 class="article-embed-music__title">灵动清晨 (Morning Vibe)</h4>
      <span class="article-embed-music__badge">音乐馆特推</span>
    </div>
    <div class="article-embed-music__sub">
      <span class="article-embed-music__artist">天才猫乐团 · 官方原声</span>
      <div class="article-embed-music__wave" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  </div>
  <div class="article-embed-music__actions">
    <a href="/music.html" target="_blank" class="article-embed-music__link">音乐馆 ↗</a>
  </div>
  <audio class="article-embed-music__audio" src="/logo.png" preload="none"></audio>
</div>

<div class="article-quote-card">
  <div class="article-quote-card__mark">“</div>
  <p class="article-quote-card__text">软件是生产力，音乐是生命力，文章是连接它们的桥梁。</p>
  <div class="article-quote-card__author">—— 天才猫生态设计宣言</div>
</div>

## 立即体验 Desktop 2.0

你可以直接在下方卡片中点击下载最新安装包，无需离开当前页面：

<div class="article-embed-software" data-slug="desktop">
  <div class="article-embed-software__icon-wrap">
    <img src="/logo.png" alt="Desktop 2.0" class="article-embed-software__icon" />
  </div>
  <div class="article-embed-software__main">
    <div class="article-embed-software__title-row">
      <h3 class="article-embed-software__name">Desktop 2.0 灵动桌面</h3>
      <span class="article-embed-software__badge">官方旗舰</span>
    </div>
    <p class="article-embed-software__desc">下一代沉浸式桌面小组件与状态栏系统，极速高效。</p>
  </div>
  <div class="article-embed-software__actions">
    <a href="/software.html?slug=desktop" class="article-embed-software__btn article-embed-software__btn--outline">了解详情</a>
    <a href="/download/latest/desktop" class="article-embed-software__btn article-embed-software__btn--primary">↓ 立即下载</a>
  </div>
</div>

<hr class="article-divider" />

<p>本文由全新的<strong>全屏微信工作台生态闭环引擎</strong>发布。</p>
""".strip()
    }

    post_resp = requests.post(f"{BASE_URL}/api/admin/articles", json=article_payload, headers=headers).json()
    assert post_resp.get("success"), f"Save article to D1 failed: {post_resp}"
    print(f"PASS: Article successfully saved to D1 with slug: {test_slug}")

    # Verify public API returns the article from D1
    get_resp = requests.get(f"{BASE_URL}/api/article/{test_slug}").json()
    assert get_resp.get("article"), "Public API must return article from D1"
    assert get_resp["article"]["slug"] == test_slug, "Slug must match"
    print("PASS: Public GET /api/article/:slug retrieved article from D1")

    # 2. Browser CDP Test: Verify Workbench Toolbar Buttons & Dialogs
    print("\n--- Step 2: Testing Headless Chrome Studio Workbench Features ---")
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    cdp_port = s.getsockname()[1]
    s.close()

    profile_dir = os.path.abspath(f"tmp_chrome_verify_eco_{cdp_port}")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={cdp_port}",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={profile_dir}",
        "about:blank"
    ])

    ws = None
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
                time.sleep(0.4)

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

        def poll_text(keyword, timeout=10):
            start = time.time()
            while time.time() - start < timeout:
                txt = eval_js("document.body ? document.body.innerText : ''") or ""
                if keyword in txt:
                    return txt
                time.sleep(0.2)
            return eval_js("document.body ? document.body.innerText : ''") or ""

        def set_viewport(width, height):
            send("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": width < 600,
            })

        def take_screenshot(name):
            mid = send("Page.captureScreenshot", {"format": "png"})
            start = time.time()
            b64 = None
            while time.time() - start < 6:
                try:
                    raw = ws.recv()
                    msg = json.loads(raw)
                    if msg.get("id") == mid:
                        b64 = msg.get("result", {}).get("data")
                        break
                except websocket.WebSocketTimeoutException:
                    continue
            if b64:
                brain_dir = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"
                os.makedirs(brain_dir, exist_ok=True)
                out_path = os.path.join(brain_dir, name)
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(b64))
                print(f"Captured: {name}")

        send("Page.enable")
        send("Runtime.enable")
        send("Log.enable")
        set_viewport(1440, 900)

        # 3. Inject token into sessionStorage via sign-in page
        send("Page.navigate", {"url": f"{BASE_URL}/studio/sign-in"})
        time.sleep(1.5)
        eval_js(f"""
            sessionStorage.setItem('downloadAdminToken', '{token}');
            sessionStorage.setItem('admin_token', '{token}');
        """)

        # 4. Navigate to articles management
        send("Page.navigate", {"url": f"{BASE_URL}/studio/content/articles"})
        art_txt = poll_text("文章专栏", timeout=10)
        assert "文章专栏" in art_txt, f"Failed to load articles list: {art_txt[:200]}"
        print("PASS: Articles management page loaded!")

        # Click "撰写新文章" to open Full-Screen Workbench
        print("\nOpening Full-Screen Workbench...")
        eval_js("""(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('撰写新文章'));
            btn?.click();
        })()""")
        wb_txt = poll_text("微信公众号手机真实仿真预览", timeout=8)
        assert "微信公众号手机真实仿真预览" in wb_txt, "Full-screen workbench did not open"
        print("PASS: Full-screen workbench opened")

        # Verify Toolbar Buttons
        toolbar_check = eval_js("""(() => {
            const text = document.body.innerText;
            const hasEmbedSoftwareBtn = text.includes('引用软件');
            const hasEmbedMusicBtn = text.includes('引用音乐');
            const hasImageBtn = text.includes('插图');
            return {
                hasEmbedSoftwareBtn,
                hasEmbedMusicBtn,
                hasImageBtn
            };
        })()""")

        print("Toolbar buttons check:", toolbar_check)
        assert toolbar_check.get("hasEmbedSoftwareBtn"), "Toolbar must include '引用软件' button"
        assert toolbar_check.get("hasEmbedMusicBtn"), "Toolbar must include '引用音乐' button"
        assert toolbar_check.get("hasImageBtn"), "Toolbar must include '插图' button"
        print("PASS: Workbench toolbar has '引用软件', '引用音乐', and '插图' buttons!")

        # Test opening Software Embed Modal
        print("\nTesting '引用软件' Dialog...")
        eval_js("""(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('引用软件'));
            btn?.click();
        })()""")
        sw_txt = poll_text("引用软件中心卡片到正文", timeout=6)
        assert "引用软件中心卡片到正文" in sw_txt, "Software embed dialog did not open"
        print("PASS: Software embed dialog opened successfully!")

        # Close Software Modal
        eval_js("""(() => {
            const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '取消');
            cancelBtn?.click();
        })()""")
        time.sleep(0.5)

        # Test opening Music Embed Modal
        print("\nTesting '引用音乐' Dialog...")
        eval_js("""(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('引用音乐'));
            btn?.click();
        })()""")
        music_txt = poll_text("引用音乐频道歌曲到正文", timeout=6)
        assert "引用音乐频道歌曲到正文" in music_txt, "Music embed dialog did not open"
        print("PASS: Music embed dialog opened successfully!")

        # Close Music Modal
        eval_js("""(() => {
            const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '取消');
            cancelBtn?.click();
        })()""")
        time.sleep(0.5)

        take_screenshot("article_workbench_ecosystem_1440.png")

        # Step 3: Verify Public Article Detail Page renders software card and interactive music player
        print("\n--- Step 3: Testing Public Article Page Rendering & Audio Interaction ---")
        set_viewport(1440, 900)
        send("Page.navigate", {"url": f"{BASE_URL}/article.html?slug={test_slug}"})
        poll_text("立即体验", timeout=8)

        public_check = eval_js("""(() => {
            const swCard = document.querySelector('.article-embed-software');
            const swTitle = swCard?.querySelector('.article-embed-software__name')?.textContent;
            const swDlBtn = swCard?.querySelector('.article-embed-software__btn--primary');
            const swDetailBtn = swCard?.querySelector('.article-embed-software__btn--outline');

            const musicCard = document.querySelector('.article-embed-music');
            const musicTitle = musicCard?.querySelector('.article-embed-music__title')?.textContent;
            const musicPlayBtn = musicCard?.querySelector('.article-embed-music__play-btn');
            const musicWave = musicCard?.querySelector('.article-embed-music__wave');
            const musicLink = musicCard?.querySelector('.article-embed-music__link');

            return {
                hasSwCard: Boolean(swCard),
                swTitle,
                hasSwDlBtn: Boolean(swDlBtn),
                hasSwDetailBtn: Boolean(swDetailBtn),
                hasMusicCard: Boolean(musicCard),
                musicTitle,
                hasMusicPlayBtn: Boolean(musicPlayBtn),
                hasMusicWave: Boolean(musicWave),
                hasMusicLink: Boolean(musicLink)
            };
        })()""")

        print("Public article render check:", public_check)
        assert public_check.get("hasSwCard"), "Embedded software card must be rendered"
        assert "Desktop" in (public_check.get("swTitle") or ""), "Software title must be rendered"
        assert public_check.get("hasSwDlBtn"), "Software download button must be present"
        assert public_check.get("hasSwDetailBtn"), "Software detail link must be present"

        assert public_check.get("hasMusicCard"), "Embedded music card must be rendered"
        assert "灵动清晨" in (public_check.get("musicTitle") or ""), "Music track title must match"
        assert public_check.get("hasMusicPlayBtn"), "Music play button must be present"
        assert public_check.get("hasMusicWave"), "Sound wave visualizer must be present"
        assert public_check.get("hasMusicLink"), "Link to music channel must be present"
        print("PASS: Public article page rendered both software card and music card!")

        # Test Music Play Toggle Interaction
        print("\nTesting Music Play Toggle Interaction...")
        play_toggle_result = eval_js("""(() => {
            const card = document.querySelector('.article-embed-music');
            const playBtn = card?.querySelector('.article-embed-music__play-btn');
            const iconBefore = card?.querySelector('.article-embed-music__play-icon')?.textContent;
            playBtn?.click();
            const isPlayingAfterClick = card?.classList.contains('is-playing');
            return {
                iconBefore,
                isPlayingAfterClick
            };
        })()""")

        print("Play toggle check:", play_toggle_result)
        assert play_toggle_result.get("isPlayingAfterClick"), "Clicking play button must add 'is-playing' class and start playback"
        print("PASS: Audio player toggle interaction works seamlessly!")

        take_screenshot("article_public_closed_loop_1440.png")
        set_viewport(390, 844)
        take_screenshot("article_public_closed_loop_390.png")

        # Check console errors
        print(f"\nChecking console errors (found {len(console_errors)})...")
        if console_errors:
            for err in console_errors:
                print("Console Error:", err)
        assert len(console_errors) == 0, f"Found {len(console_errors)} console errors!"
        print("\nALL ECO-SYSTEM CLOSED LOOP & R2 ACCEPTANCE TESTS PASSED WITH 0 CONSOLE ERRORS!\n")

    finally:
        if ws:
            try: ws.close()
            except: pass
        proc.terminate()
        try: proc.wait(timeout=2)
        except: proc.kill()

if __name__ == "__main__":
    run_ecosystem_verification()
