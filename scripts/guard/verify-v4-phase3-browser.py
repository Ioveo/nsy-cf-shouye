# -*- coding: utf-8 -*-
import json
import time
import subprocess
import os
import requests
import websocket
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
BASE_URL = "http://127.0.0.1:8788"

def run_browser_phase3_tests():
    print("=== Phase 3 Browser Acceptance Verification ===")
    profile_dir = os.path.abspath("tmp_chrome_verify_p3")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={profile_dir}",
        f"{BASE_URL}/articles.html"
    ])

    time.sleep(3)
    ws = None
    try:
        tabs = requests.get("http://127.0.0.1:9222/json/list").json()
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
            ws.send(json.dumps({"id": m_id, "method": method, "params": params or {}}))
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

        brain_dir = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4"
        os.makedirs(brain_dir, exist_ok=True)

        def capture(name, width=1440, height=900):
            send("Emulation.setDeviceMetricsOverride", {
                "width": width, "height": height, "deviceScaleFactor": 2, "mobile": width <= 600
            })
            time.sleep(1)
            shot = send("Page.captureScreenshot", {"format": "png"})
            path = os.path.join(brain_dir, name)
            with open(path, "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print(f"Captured: {name}")

        # 1. Test articles.html with Grid Layout (?cat=p3-grid)
        print("\nTesting articles.html with Grid Layout (?cat=p3-grid)...")
        send("Page.navigate", {"url": f"{BASE_URL}/articles.html?cat=p3-grid"})
        time.sleep(3)

        grid_res = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const navTabs = Array.from(document.querySelectorAll('.articles-nav-tab')).map(t => t.textContent.trim());
                const grid = document.getElementById('articleGrid');
                const cards = grid ? grid.querySelectorAll('.article-card') : [];
                return {
                    navTabCount: navTabs.length,
                    hasGrid: Boolean(grid),
                    cardCount: cards.length
                };
            })()
            """,
            "returnByValue": True
        }).get("result", {}).get("value", {})
        print("Grid test result:", grid_res)
        assert grid_res.get("navTabCount", 0) >= 4, "Top navigation should show at least 4 tabs"
        assert grid_res.get("hasGrid"), "Should render grid layout"
        assert grid_res.get("cardCount", 0) >= 1, "Should render at least 1 card in p3-grid"
        print("PASS 1: Grid layout verified")

        capture("phase3_articles_grid_1440.png", 1440, 900)
        capture("phase3_articles_grid_390.png", 390, 844)

        # 2. Test articles.html with List Layout (?cat=p3-list)
        print("\nTesting articles.html with List Layout (?cat=p3-list)...")
        send("Page.navigate", {"url": f"{BASE_URL}/articles.html?cat=p3-list"})
        time.sleep(3)

        list_res = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const listContainer = document.querySelector('.article-list-container');
                const items = listContainer ? listContainer.querySelectorAll('.article-list-item') : [];
                const firstTitle = items.length > 0 ? (items[0].querySelector('.article-list-item__title')?.textContent.trim() || '') : '';
                return {
                    hasListContainer: Boolean(listContainer),
                    itemCount: items.length,
                    firstTitle
                };
            })()
            """,
            "returnByValue": True
        }).get("result", {}).get("value", {})
        print("List test result:", list_res)
        assert list_res.get("hasListContainer"), "Should render .article-list-container"
        assert list_res.get("itemCount", 0) >= 1, "Should render at least 1 list item in p3-list"
        assert "上手指南" in list_res.get("firstTitle", ""), "Article 2 with legacy category name must match p3-list"
        print("PASS 2: List layout and legacy category matching verified")

        capture("phase3_articles_list_1440.png", 1440, 900)
        capture("phase3_articles_list_390.png", 390, 844)

        # 3. Test articles.html with Docs Layout (?cat=p3-docs)
        print("\nTesting articles.html with Docs Layout (?cat=p3-docs)...")
        send("Page.navigate", {"url": f"{BASE_URL}/articles.html?cat=p3-docs"})
        time.sleep(3)

        docs_res = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const docsLayout = document.querySelector('.article-docs-layout');
                const sidebar = document.querySelector('.article-docs__sidebar');
                const treeItems = sidebar ? sidebar.querySelectorAll('.article-docs__item') : [];
                const mainTitle = document.querySelector('.article-docs__title')?.textContent.trim() || '';
                const widget = document.querySelector('.article-software-widget');
                return {
                    hasDocsLayout: Boolean(docsLayout),
                    hasSidebar: Boolean(sidebar),
                    treeItemCount: treeItems.length,
                    mainTitle,
                    hasSoftwareWidget: Boolean(widget)
                };
            })()
            """,
            "returnByValue": True
        }).get("result", {}).get("value", {})
        print("Docs test result:", docs_res)
        assert docs_res.get("hasDocsLayout"), "Should render .article-docs-layout"
        assert docs_res.get("hasSidebar"), "Should render left sidebar"
        assert docs_res.get("treeItemCount", 0) >= 1, "Should render tree items in sidebar"
        assert "快捷键" in docs_res.get("mainTitle", ""), "Docs layout should render article content on the right"
        assert docs_res.get("hasSoftwareWidget"), "Should render software download widget in docs layout"
        print("PASS 3: Docs layout with tree sidebar and direct reader verified")

        capture("phase3_articles_docs_1440.png", 1440, 900)
        capture("phase3_articles_docs_390.png", 390, 844)

        # 4. Test article detail page (article.html) software widget
        print("\nTesting article.html software download widget...")
        send("Page.navigate", {"url": f"{BASE_URL}/article.html?slug=desktop-v2-release"})
        time.sleep(3)

        art_detail_res = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const widget = document.querySelector('.article-software-widget');
                const widgetName = widget ? widget.querySelector('.article-software-widget__name')?.textContent.trim() : '';
                const widgetBtn = widget ? widget.querySelector('.article-software-widget__btn') : null;
                const widgetBtnHref = widgetBtn ? widgetBtn.getAttribute('href') : '';
                const asideRelated = document.querySelector('.article-related__downloads');
                return {
                    hasWidget: Boolean(widget),
                    widgetName,
                    widgetBtnHref,
                    hasAsideRelated: Boolean(asideRelated)
                };
            })()
            """,
            "returnByValue": True
        }).get("result", {}).get("value", {})
        print("Article detail test result:", art_detail_res)
        assert art_detail_res.get("hasWidget"), "Should render .article-software-widget at end of article"
        assert "天才猫桌面" in art_detail_res.get("widgetName", ""), "Widget should show software name"
        assert "/download/latest/" in art_detail_res.get("widgetBtnHref", ""), "Widget download button must link to download URL"
        assert art_detail_res.get("hasAsideRelated"), "Aside should also display related downloads"
        print("PASS 4: Article page software download widget verified at body bottom and sidebar")

        capture("phase3_article_detail_1440.png", 1440, 900)
        capture("phase3_article_detail_390.png", 390, 844)

        # 5. Test software.html related articles section
        print("\nTesting software.html related articles section...")
        send("Page.navigate", {"url": f"{BASE_URL}/software.html?id=desktop"})
        time.sleep(3)

        soft_detail_res = send("Runtime.evaluate", {
            "expression": """
            (() => {
                const section = document.getElementById('articlesSection');
                const isVisible = section ? (section.style.display !== 'none') : false;
                const grid = document.getElementById('articlesGrid');
                const cards = grid ? grid.querySelectorAll('.sc-card') : [];
                return {
                    isVisible,
                    cardCount: cards.length
                };
            })()
            """,
            "returnByValue": True
        }).get("result", {}).get("value", {})
        print("Software detail articles result:", soft_detail_res)
        assert soft_detail_res.get("isVisible"), "articlesSection should be visible on software detail page"
        assert soft_detail_res.get("cardCount", 0) >= 1, "Should render related article cards"
        print("PASS 5: Software detail page closed loop verified with related articles section")

        capture("phase3_software_related_articles_1440.png", 1440, 900)
        capture("phase3_software_related_articles_390.png", 390, 844)

        assert len(console_errors) == 0, f"Expected 0 console errors, got {console_errors}"
        print("\nALL PHASE 3 BROWSER ACCEPTANCE TESTS PASSED WITH 0 CONSOLE ERRORS!")

    finally:
        if ws:
            ws.close()
        proc.terminate()
        time.sleep(1)

if __name__ == "__main__":
    run_browser_phase3_tests()
