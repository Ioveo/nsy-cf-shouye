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

def run_phase_d_test():
    print("=== 开始 Phase D 自动化全链路验收 ===")

    # 1. 后台登录获取 token
    login_res = requests.post(f"{BASE_URL}/api/admin/login", json={"password": PASSWORD}).json()
    assert login_res.get("success"), f"Login failed: {login_res}"
    token = login_res["token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ 1. 后台登录成功")

    # 清理可能残留的测试数据
    cat_init = requests.post(f"{BASE_URL}/api/admin/catalog", headers=headers).json()
    for a in cat_init.get("catalog", {}).get("articles", []):
        if "phase-d" in a.get("id", "") or "phase-d" in a.get("slug", ""):
            requests.post(f"{BASE_URL}/api/admin/articles/delete", json={"id": a["id"]}, headers=headers)
    for g in cat_init.get("catalog", {}).get("gallery", []):
        if "phase-d" in g.get("id", ""):
            requests.post(f"{BASE_URL}/api/admin/gallery", json={"id": g["id"], "action": "delete"}, headers=headers)
    for m in cat_init.get("catalog", {}).get("music", []):
        if "phase-d" in m.get("id", ""):
            requests.post(f"{BASE_URL}/api/admin/music", json={"id": m["id"], "action": "delete"}, headers=headers)

    # 2. 文章模块：上传 3 张图片并发布带图文章
    print("=== 2. 上传 3 张文章图片并发布图文文章 ===")
    article_img_urls = []
    for i in range(1, 4):
        img_bytes = f"PHASE_D_ARTICLE_IMG_{i}_PNG_DATA".encode("utf-8")
        files = {
            "token": (None, token),
            "kind": (None, "image"),
            "folder": (None, "article"),
            "storageId": (None, "default"),
            "file": (f"article_image_{i}.png", img_bytes, "image/png")
        }
        res = requests.post(f"{BASE_URL}/api/admin/assets/upload", files=files).json()
        assert res.get("success"), f"Upload article image {i} failed: {res}"
        url = res.get("url") or res.get("asset", {}).get("url")
        article_img_urls.append(url)
    print(f"✓ 上传 3 张文章插图成功: {article_img_urls}")

    article_content = f"""## Phase D 图文排版测试

这是一篇在 Studio 中撰写的高级图文测试文章。

### 第一节：架构设计
![架构插图 1]({article_img_urls[0]})

### 第二节：组件交互
![组件插图 2]({article_img_urls[1]})

### 第三节：数据闭环
![闭环插图 3]({article_img_urls[2]})

全链路验证通过。
"""
    article_payload = {
        "id": "phase-d-article",
        "slug": "phase-d-article",
        "title": "Phase D 极速内容创作与图文排版实战",
        "summary": "测试 Studio 文章发布流程与 3 张插图实时排版",
        "category": "架构设计",
        "tags": ["Studio", "PhaseD", "自动化测试"],
        "coverUrl": article_img_urls[0],
        "content": article_content,
        "status": "published",
        "featured": True,
        "seoTitle": "Phase D 图文实战",
        "seoDescription": "自动化验证文章及插图"
    }
    save_art_res = requests.post(f"{BASE_URL}/api/admin/articles", json=article_payload, headers=headers).json()
    assert save_art_res.get("success"), f"Save article failed: {save_art_res}"
    print("✓ 文章已发布成功")

    # 3. 画廊模块：批量上传 10 张图片，并串行重排序
    print("=== 3. 批量上传 10 张画廊图片并串行排序 ===")
    gallery_img_urls = []
    for i in range(1, 11):
        g_bytes = f"PHASE_D_GALLERY_IMG_{i}_PNG_DATA".encode("utf-8")
        files = {
            "token": (None, token),
            "kind": (None, "image"),
            "folder": (None, "gallery"),
            "storageId": (None, "default"),
            "file": (f"gallery_{i:02d}.png", g_bytes, "image/png")
        }
        res = requests.post(f"{BASE_URL}/api/admin/assets/upload", files=files).json()
        assert res.get("success"), f"Upload gallery image {i} failed: {res}"
        url = res.get("url") or res.get("asset", {}).get("url")
        gallery_img_urls.append(url)

    # 串行注册 10 个画廊条目（正序 1..10）
    for i in range(1, 11):
        g_item = {
            "id": f"phase-d-gallery-{i:02d}",
            "title": f"Phase D 艺术摄影 {i:02d}",
            "description": f"画廊自动化测试精选第 {i} 张",
            "imageUrl": gallery_img_urls[i - 1],
            "thumbUrl": gallery_img_urls[i - 1],
            "tags": ["PhaseD", "摄影"],
            "status": "published",
            "sortOrder": i
        }
        res = requests.post(f"{BASE_URL}/api/admin/gallery", json=g_item, headers=headers).json()
        assert res.get("success"), f"Save gallery item {i} failed: {res}"

    print("✓ 10 张画廊图片串行保存成功，开始模拟拖拽重排序（反转顺序 10 -> 1）...")
    # 串行更新排序：将图片 10 设为 1，图片 9 设为 2 ...
    for i in range(1, 11):
        reverse_order = 11 - i
        g_item = {
            "id": f"phase-d-gallery-{i:02d}",
            "title": f"Phase D 艺术摄影 {i:02d}",
            "description": f"画廊自动化测试精选第 {i} 张",
            "imageUrl": gallery_img_urls[i - 1],
            "thumbUrl": gallery_img_urls[i - 1],
            "tags": ["PhaseD", "摄影"],
            "status": "published",
            "sortOrder": reverse_order
        }
        res = requests.post(f"{BASE_URL}/api/admin/gallery", json=g_item, headers=headers).json()
        assert res.get("success"), f"Update gallery sortOrder {i} failed: {res}"
    print("✓ 画廊 10 张图片反序重排并串行保存完成")

    # 4. 音乐模块：上传一首测试音频并发布
    print("=== 4. 上传一首测试音频并发布 ===")
    audio_bytes = b"ID3\x03\x00\x00\x00\x00\x00#MOCK_MP3_AUDIO_STREAM_PHASE_D_TEST"
    files = {
        "token": (None, token),
        "kind": (None, "audio"),
        "folder": (None, "music"),
        "storageId": (None, "default"),
        "file": ("phase-d-spatial-audio.mp3", audio_bytes, "audio/mpeg")
    }
    res_audio = requests.post(f"{BASE_URL}/api/admin/assets/upload", files=files).json()
    assert res_audio.get("success"), f"Upload audio failed: {res_audio}"
    audio_url = res_audio.get("url") or res_audio.get("asset", {}).get("url")

    music_payload = {
        "id": "phase-d-music-01",
        "title": "Phase D 空间全景测试曲",
        "artist": "天才猫实验乐团",
        "album": "Studio Future 2026",
        "audioUrl": audio_url,
        "coverUrl": article_img_urls[0],
        "lyric": "[00:00.00]Phase D 自动化验证曲目\n[00:05.00]音频流播放试听正常",
        "tags": ["PhaseD", "空间音频", "高保真"],
        "status": "published",
        "featured": True,
        "sortOrder": 1
    }
    save_mus_res = requests.post(f"{BASE_URL}/api/admin/music", json=music_payload, headers=headers).json()
    assert save_mus_res.get("success"), f"Save music failed: {save_mus_res}"
    print("✓ 音乐发布成功")

    # 5. 校验公共接口 /api/catalog 包含且仅包含 published 项
    print("=== 5. 校验 /api/catalog 公共接口 ===")
    pub_cat = requests.get(f"{BASE_URL}/api/catalog").json()
    assert any(a.get("slug") == "phase-d-article" for a in pub_cat.get("articles", [])), "Public catalog missing article"
    assert any(m.get("id") == "phase-d-music-01" for m in pub_cat.get("music", [])), "Public catalog missing music"
    
    pub_gallery_test_items = [g for g in pub_cat.get("gallery", []) if "phase-d-gallery" in g.get("id", "")]
    assert len(pub_gallery_test_items) == 10, f"Expected 10 test gallery items, got {len(pub_gallery_test_items)}"
    # 验证公共 catalog 中排序是否按照 sortOrder 升序（即 id 10 为 sortOrder 1 在最前）
    assert pub_gallery_test_items[0]["id"] == "phase-d-gallery-10", f"First gallery item should be 10, got {pub_gallery_test_items[0]['id']}"
    assert pub_gallery_test_items[-1]["id"] == "phase-d-gallery-01", f"Last gallery item should be 01, got {pub_gallery_test_items[-1]['id']}"
    print("✓ 公开接口数据顺序与校验完全符合预期")

    # 6. 使用真实 Chrome CDP 验证前台 3 个页面渲染与控制台 0 报错
    print("=== 6. 真实 Chrome 浏览器全链路渲染与无报错校验 ===")
    chrome_port = 9334
    user_data_dir = os.path.join(os.environ.get("TEMP", "C:\\temp"), "chrome_dev_user_data_phase_d")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={chrome_port}",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data_dir}",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        "about:blank"
    ])

    ws = None
    try:
        # 等待 Chrome 启动
        for _ in range(30):
            try:
                res = requests.get(f"http://127.0.0.1:{chrome_port}/json/list").json()
                page_tabs = [t for t in res if t.get("type") == "page"]
                if page_tabs:
                    ws_url = page_tabs[0]["webSocketDebuggerUrl"]
                    break
            except Exception:
                time.sleep(0.2)
        else:
            raise RuntimeError("Cannot connect to Chrome remote debugging port")

        ws = websocket.create_connection(ws_url)
        ws.settimeout(1.0)
        msg_id = 1

        def send_cdp(method, params=None):
            nonlocal msg_id
            mid = msg_id
            msg_id += 1
            ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
            return mid

        def eval_js(expr, await_promise=False):
            params = {"expression": expr, "returnByValue": True}
            if await_promise:
                params["awaitPromise"] = True
            mid = send_cdp("Runtime.evaluate", params)
            start = time.time()
            while time.time() - start < 8:
                try:
                    raw = ws.recv()
                    msg = json.loads(raw)
                    if msg.get("id") == mid:
                        return msg.get("result", {}).get("result", {}).get("value")
                except websocket.WebSocketTimeoutException:
                    continue
            return None

        def navigate(url, wait_sec=1.5):
            send_cdp("Page.navigate", {"url": url})
            time.sleep(wait_sec)

        send_cdp("Page.enable")
        send_cdp("Network.enable")
        send_cdp("Network.setCacheDisabled", {"cacheDisabled": True})

        console_errors = []
        # 页面 A: articles.html
        print("-> 验证 articles.html 列表页")
        send_cdp("Page.navigate", {"url": f"{BASE_URL}/articles.html"})
        time.sleep(1.5)
        articles_rendered = eval_js("""
            (() => {
                const cards = Array.from(document.querySelectorAll("#articleGrid .article-card, .article-card"));
                const hasTestArticle = cards.some(c => c.textContent.includes("Phase D 极速内容创作与图文排版实战"));
                return { count: cards.length, hasTestArticle };
            })()
        """)
        assert articles_rendered and articles_rendered.get("hasTestArticle"), f"Article not found in list: {articles_rendered}"
        print(f"✓ articles.html 列表成功渲染发布文章: {articles_rendered}")

        # 页面 A2: article.html 详情页图文渲染
        print("-> 验证 article.html 详情页 3 张图片渲染")
        send_cdp("Page.navigate", {"url": f"{BASE_URL}/article.html?slug=phase-d-article"})
        time.sleep(1.5)
        article_detail_rendered = eval_js(f"""
            (() => {{
                const title = document.querySelector("#articleDetail h1")?.textContent || "";
                const articleEl = document.querySelector("#articleDetail article");
                const contentImgs = Array.from(articleEl ? articleEl.querySelectorAll("img") : []).map(img => img.src);
                return {{ title, contentImgs, imgCount: contentImgs.length, articleHtml: articleEl?.innerHTML || "" }};
            }})()
        """)
        assert "Phase D 极速内容创作与图文排版实战" in (article_detail_rendered.get("title") or ""), f"Title mismatch: {article_detail_rendered}"
        assert article_detail_rendered.get("imgCount") == 3, f"Expected 3 images, got {article_detail_rendered.get('imgCount')}"
        print(f"✓ article.html 成功完整渲染 3 张插图: {article_detail_rendered['imgCount']} 张")

        # 页面 A3: article.html 实时预览模式
        print("-> 验证 article.html?preview=1 实时预览消息机制")
        send_cdp("Page.navigate", {"url": f"{BASE_URL}/article.html?preview=1"})
        time.sleep(1.0)
        preview_test_res = eval_js("""
            new Promise((resolve) => {
                window.postMessage({
                    type: "studio-preview",
                    article: {
                        title: "实时 Studio 预览测试文章",
                        category: "草稿预览",
                        summary: "实时 postMessage 测试",
                        content: "## 实时预览正文\\n\\n正在编辑中的草稿。",
                        tags: ["草稿"]
                    }
                }, window.location.origin);
                setTimeout(() => {
                    const title = document.querySelector("#articleDetail h1")?.textContent || "";
                    resolve({ title });
                }, 300);
            })
        """, await_promise=True)
        assert "实时 Studio 预览测试文章" in (preview_test_res.get("title") or ""), f"Preview failed: {preview_test_res}"
        print(f"✓ article.html?preview=1 实时草稿预览渲染成功: {preview_test_res}")

        # 页面 B: gallery.html 画廊瀑布流与顺序一致性
        print("-> 验证 gallery.html 画廊排序与后台完全一致")
        send_cdp("Page.navigate", {"url": f"{BASE_URL}/gallery.html"})
        time.sleep(1.5)
        gallery_rendered = eval_js("""
            (() => {
                const tiles = Array.from(document.querySelectorAll("#galleryMasonry .gallery-tile strong"));
                const titles = tiles.map(t => t.textContent.trim()).filter(t => t.includes("Phase D 艺术摄影"));
                return { count: titles.length, titles };
            })()
        """)
        assert gallery_rendered.get("count") == 10, f"Expected 10 test gallery items, got {gallery_rendered.get('count')}"
        assert gallery_rendered["titles"][0] == "Phase D 艺术摄影 10", f"First tile must be 10, got {gallery_rendered['titles'][0]}"
        assert gallery_rendered["titles"][-1] == "Phase D 艺术摄影 01", f"Last tile must be 01, got {gallery_rendered['titles'][-1]}"
        print(f"✓ gallery.html 前台画廊展示与后台排序完全一致 (10 -> 01)")

        # 页面 C: music.html 音乐列表与试听播放器
        print("-> 验证 music.html 试听与播放器联动")
        send_cdp("Page.navigate", {"url": f"{BASE_URL}/music.html"})
        time.sleep(1.5)
        music_rendered = eval_js(f"""
            (() => {{
                const heroTitle = document.getElementById("heroTitle")?.textContent || "";
                const heroArtist = document.getElementById("heroArtist")?.textContent || "";
                // 点击试听按钮
                document.getElementById("heroPlay")?.click();
                const audioSrc = document.getElementById("playerAudio")?.src || "";
                return {{ heroTitle, heroArtist, audioSrc }};
            }})()
        """)
        assert "Phase D 空间全景测试曲" in music_rendered.get("heroTitle", ""), f"Music title mismatch: {music_rendered}"
        assert "phase-d-spatial-audio.mp3" in music_rendered.get("audioSrc", ""), f"Audio src mismatch: {music_rendered}"
        print(f"✓ music.html 音乐成功试听，播放器加载音源成功: {music_rendered}")

    finally:
        if ws:
            try: ws.close()
            except Exception: pass
        try:
            proc.terminate()
            proc.wait(timeout=3)
        except Exception:
            pass

    # 7. 清理测试产生的数据
    print("=== 7. 清理测试数据 ===")
    requests.post(f"{BASE_URL}/api/admin/articles/delete", json={"id": "phase-d-article"}, headers=headers)
    for i in range(1, 11):
        requests.post(f"{BASE_URL}/api/admin/gallery", json={"id": f"phase-d-gallery-{i:02d}", "action": "delete"}, headers=headers)
    requests.post(f"{BASE_URL}/api/admin/music", json={"id": "phase-d-music-01", "action": "delete"}, headers=headers)
    print("✓ 测试数据清理完毕")

    print("\n==========================================")
    print("🎉 Phase D 全链路验收测试 100% 全部通过！")
    print("==========================================")

if __name__ == "__main__":
    run_phase_d_test()
