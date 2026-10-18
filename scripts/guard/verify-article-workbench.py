# -*- coding: utf-8 -*-
import sys
import json
import time
import subprocess
import os
import requests
import websocket
import base64

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:8788"

def run_workbench_verification():
    print("=== Article Full-Screen Workbench & WeChat CMS Acceptance Verification ===")

    # 1. API & D1 Test: Post an article with rich WeChat components
    print("\n--- Step 1: Testing Article Post to D1 API ---")
    login_resp = requests.post(f"{BASE_URL}/api/admin/login", json={"password": "admin123"}).json()
    token = login_resp.get("token")
    assert token, "Admin login must succeed"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    test_slug = f"wechat-workbench-demo-{int(time.time())}"
    article_payload = {
        "title": "天才猫桌面 2.0 效率排版全景演示",
        "slug": test_slug,
        "summary": "采用全新沉浸式微信公众号排版工作台撰写，体验卡片式提示框与双向软件闭环。",
        "category": "上手教程",
        "tags": ["微信排版", "沉浸工作台", "效率进阶"],
        "coverUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
        "softwareIds": ["desktop"],
        "featured": True,
        "status": "published",
        "content": """
## 为什么我们需要微信公众号级的排版？

在技术分享与产品手册中，纯文本很容易造成阅读疲劳。通过卡片化排版，可以直击核心要点：

<div class="article-callout article-callout--tip">
  <div class="article-callout__header">💡 核心技巧</div>
  <p>利用快捷键 Alt + Space 呼出抽屉收纳盒，支持拖入各类免装依赖的独立软件。</p>
</div>

<div class="article-quote-card">
  <div class="article-quote-card__mark">“</div>
  <p class="article-quote-card__text">把复杂的底层交互，压缩成一次极简的双击与触达。</p>
  <div class="article-quote-card__author">—— 天才猫团队设计法则</div>
</div>

<div class="article-step-card">
  <div class="article-step-card__item">
    <span class="article-step-card__num">01</span>
    <div class="article-step-card__body">
      <h4>第一步：快捷唤醒抽屉</h4>
      <p>按下 Alt + Space 快速呼出收纳盒与灵动检索。</p>
    </div>
  </div>
  <div class="article-step-card__item">
    <span class="article-step-card__num">02</span>
    <div class="article-step-card__body">
      <h4>第二步：归档常用桌面应用</h4>
      <p>将桌面常用快捷方式拖拽至对应分类格子内。</p>
    </div>
  </div>
</div>

<hr class="article-divider" />

<p>本文由全新的<strong>沉浸式全屏微信公众号工作台</strong>撰写发布。</p>
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

    # 2. Browser CDP Test: Verify Full-Screen Studio Workbench & Public Article
    print("\n--- Step 2: Testing Headless Chrome Studio Workbench ---")
    profile_dir = os.path.abspath("tmp_chrome_verify_wb")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={profile_dir}",
        f"{BASE_URL}/studio/"
    ])

    time.sleep(3)
    ws = None
    try:
        targets = requests.get("http://127.0.0.1:9222/json").json()
        page_target = next(t for t in targets if t.get("type") == "page")
        ws_url = page_target["webSocketDebuggerUrl"]

        ws = websocket.create_connection(ws_url, timeout=10)
        msg_id = 0
        console_errors = []

        def send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method, "params": params or {}}
            ws.send(json.dumps(payload))
            while True:
                resp = json.loads(ws.recv())
                if resp.get("method") == "Console.messageAdded":
                    msg = resp.get("params", {}).get("message", {})
                    if msg.get("level") == "error":
                        console_errors.append(msg)
                if resp.get("method") == "Runtime.consoleAPICalled":
                    args = resp.get("params", {})
                    if args.get("type") == "error":
                        console_errors.append(args)
                if resp.get("id") == msg_id:
                    return resp.get("result", {})

        send("Page.enable")
        send("Console.enable")
        send("Runtime.enable")

        def set_viewport(width, height):
            send("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": width < 600,
            })

        def take_screenshot(name):
            data = send("Page.captureScreenshot", {"format": "png"})
            b64 = data.get("data")
            if b64:
                brain_dir = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"
                os.makedirs(brain_dir, exist_ok=True)
                out_path = os.path.join(brain_dir, name)
                with open(out_path, "wb") as f:
                    f.write(base64.b64decode(b64))
                print(f"Captured: {name}")

        def navigate(url):
            send("Page.navigate", {"url": url})
            time.sleep(2)

        # Set token in sessionStorage
        navigate(f"{BASE_URL}/studio/")
        send("Runtime.evaluate", {"expression": f"sessionStorage.setItem('downloadAdminToken', '{token}')"})
        time.sleep(0.5)

        # Navigate to /studio/content/articles
        navigate(f"{BASE_URL}/studio/content/articles")
        for _ in range(20):
            time.sleep(0.5)
            has_content = send("Runtime.evaluate", {"expression": "Boolean(document.getElementById('root')?.children?.length && document.body.innerText.includes('文章专栏'))", "returnByValue": True}).get("result", {}).get("value")
            if has_content:
                break

        set_viewport(1440, 900)

        # Click "撰写新文章" to open Full-Screen Workbench
        print("\nOpening Full-Screen Workbench...")
        send("Runtime.evaluate", {"expression": """(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('撰写新文章'));
            btn?.click();
        })()"""})
        time.sleep(1)

        # Verify Workbench Elements
        wb_check = send("Runtime.evaluate", {"expression": """(() => {
            const text = document.body.innerText;
            const hasPhoneSim = text.includes('微信公众号手机真实仿真预览') || text.includes('天才猫官方专栏');
            const hasToolbar = text.includes('公众号样式模板') || text.includes('文字色');
            const hasTitleInput = Boolean(document.querySelector('input[placeholder*=\"输入文章主标题\"]'));
            const hasSummary = Boolean(document.querySelector('textarea[placeholder*=\"简要提炼\"]'));
            const hasCanvas = Boolean(document.querySelector('textarea[placeholder*=\"从这里开始撰写正文\"]'));
            const hasWordCount = text.includes('正文字数') || text.includes('预计阅读');
            const hasFixedContainer = Boolean(document.querySelector('.fixed.inset-0'));
            return {
                hasFixedContainer,
                hasPhoneSim,
                hasToolbar,
                hasTitleInput,
                hasSummary,
                hasCanvas,
                hasWordCount
            };
        })()""", "returnByValue": True}).get("result", {}).get("value")

        print("Workbench elements check:", wb_check)
        assert wb_check.get("hasFixedContainer"), "Workbench must be rendered in full-screen fixed inset-0 container"
        assert wb_check.get("hasPhoneSim"), "WeChat iPhone simulator must be visible in split-phone view"
        assert wb_check.get("hasToolbar"), "WeChat formatting toolbar must be present"
        assert wb_check.get("hasTitleInput"), "Title canvas input must be present"
        assert wb_check.get("hasCanvas"), "Main writing canvas textarea must be present"
        assert wb_check.get("hasWordCount"), "Word count and reading time must be displayed"
        print("PASS: Full-Screen WeChat-style Workbench loaded with all canvas and phone simulator elements!")

        take_screenshot("article_workbench_fullscreen_1440.png")
        set_viewport(390, 844)
        take_screenshot("article_workbench_mobile_390.png")

        # Step 3: Verify Public Article Detail Page renders WeChat styled cards
        print("\n--- Step 3: Testing Public Article Page Rendering WeChat Style Cards ---")
        set_viewport(1440, 900)
        navigate(f"{BASE_URL}/article.html?slug={test_slug}")
        time.sleep(1.5)

        public_check = send("Runtime.evaluate", {"expression": """(() => {
            const tip = document.querySelector('.article-callout--tip');
            const quote = document.querySelector('.article-quote-card');
            const steps = document.querySelector('.article-step-card');
            const divider = document.querySelector('.article-divider');
            const relatedSoftware = document.querySelector('.article-software-widget');
            return {
                hasTipCallout: Boolean(tip),
                tipHeaderText: tip?.querySelector('.article-callout__header')?.textContent,
                hasQuoteCard: Boolean(quote),
                hasStepCard: Boolean(steps),
                hasDivider: Boolean(divider),
                hasRelatedSoftware: Boolean(relatedSoftware)
            };
        })()""", "returnByValue": True}).get("result", {}).get("value")

        print("Public article render check:", public_check)
        assert public_check.get("hasTipCallout"), "Tip callout must be rendered on public page"
        assert "核心技巧" in (public_check.get("tipHeaderText") or ""), "Tip callout header text must match"
        assert public_check.get("hasQuoteCard"), "Quote card must be rendered on public page"
        assert public_check.get("hasStepCard"), "Step guide card must be rendered on public page"
        assert public_check.get("hasDivider"), "Divider must be rendered"
        assert public_check.get("hasRelatedSoftware"), "Associated software card must be rendered"
        print("PASS: Public article page rendered all WeChat components & software loop successfully!")

        take_screenshot("article_public_wechat_detail_1440.png")

        # Check console errors
        print(f"\nChecking console errors (found {len(console_errors)})...")
        if console_errors:
            for err in console_errors:
                print("Console Error:", err)
        assert len(console_errors) == 0, f"Found {len(console_errors)} console errors!"
        print("\nALL ARTICLE WORKBENCH ACCEPTANCE TESTS PASSED WITH 0 CONSOLE ERRORS!\n")

    finally:
        if ws:
            try: ws.close()
            except: pass
        proc.terminate()
        try: proc.wait(timeout=2)
        except: proc.kill()

if __name__ == "__main__":
    run_workbench_verification()
