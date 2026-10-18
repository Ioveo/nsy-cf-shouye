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

def run_browser_phase4_tests():
    print("=== Phase 4 Browser Acceptance Verification ===")
    profile_dir = os.path.abspath("tmp_chrome_verify_p4")
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-extensions",
        f"--user-data-dir={profile_dir}",
        f"{BASE_URL}/music.html"
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

        def evaluate(expression):
            res = send("Runtime.evaluate", {
                "expression": expression,
                "returnByValue": True,
                "awaitPromise": True
            })
            if "exceptionDetails" in res:
                print(f"Eval Exception: {res['exceptionDetails']}")
            return res.get("result", {}).get("value")

        def set_viewport(width, height):
            send("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": width < 600
            })
            time.sleep(0.5)

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

        # -------------------------------------------------------------
        # Test 1: Load music.html, verify scene channels & playlist cards
        # -------------------------------------------------------------
        print("\nTesting music.html Scene Playlists shelf...")
        navigate(f"{BASE_URL}/music.html")
        set_viewport(1440, 900)

        r1 = evaluate("""(() => {
            const tabs = document.querySelectorAll('.scene-tab-btn');
            const cards = document.querySelectorAll('.playlist-card');
            const heroTitle = document.getElementById('heroHeadline')?.textContent;
            return {
                tabsCount: tabs.length,
                cardsCount: cards.length,
                firstCardTitle: cards[0]?.querySelector('.playlist-card__title')?.textContent,
                heroTitle: heroTitle
            };
        })()""")
        print(f"Scene Playlists result: {r1}")
        assert r1.get("tabsCount") >= 6, "Must have 6 scene tabs"
        assert r1.get("cardsCount") >= 2, "Must show at least 2 playlist cards"
        print("PASS 1: Scene Playlists shelf and featured Hero verified")
        take_screenshot("phase4_music_home_1440.png")

        set_viewport(390, 844)
        take_screenshot("phase4_music_home_390.png")

        # -------------------------------------------------------------
        # Test 2: Enter playlist detail view (?playlist=pl_phase4_live)
        # -------------------------------------------------------------
        print("\nTesting Playlist Detail view (?playlist=pl_phase4_live)...")
        set_viewport(1440, 900)
        navigate(f"{BASE_URL}/music.html?playlist=pl_phase4_live")

        r2 = evaluate("""(() => {
            const view = document.getElementById('playlistDetailView');
            const isVisible = view && !view.hidden;
            const title = view.querySelector('.playlist-detail__title')?.textContent;
            const rows = view.querySelectorAll('.playlist-track-row');
            return {
                isVisible: isVisible,
                title: title,
                trackRowsCount: rows.length,
                firstTrackTitle: rows[0]?.querySelector('.playlist-track-row__title')?.textContent
            };
        })()""")
        print(f"Playlist Detail result: {r2}")
        assert r2.get("isVisible"), "Playlist detail view must be visible"
        assert "直播暖场" in (r2.get("title") or ""), "Playlist title must match"
        # draft track was skipped: 3 IDs in playlist, 1 draft -> exactly 2 tracks rendered
        assert r2.get("trackRowsCount") == 2, f"Draft track must be skipped; expected 2 rows, got {r2.get('trackRowsCount')}"
        print("PASS 2: Playlist Detail view and draft track skip verified")
        take_screenshot("phase4_playlist_detail_1440.png")

        set_viewport(390, 844)
        take_screenshot("phase4_playlist_detail_390.png")

        # -------------------------------------------------------------
        # Test 3: Play All & Floating Capsule Player
        # -------------------------------------------------------------
        print("\nTesting Play All & Floating Capsule Player...")
        set_viewport(1440, 900)
        evaluate("""(() => {
            document.getElementById('playAllBtn')?.click();
        })()""")
        time.sleep(1)

        r3 = evaluate("""(() => {
            const player = document.getElementById('musicPlayer');
            const isVisible = player && !player.hidden;
            const title = document.getElementById('playerTitle')?.textContent;
            const hasPrev = !!document.getElementById('playerPrev');
            const hasNext = !!document.getElementById('playerNext');
            const hasPlay = !!document.getElementById('playerPlay');
            const hasSlider = !!document.getElementById('playerProgress');
            const hasVolume = !!document.getElementById('playerVolume');
            const queueBadge = document.getElementById('playerQueueBadge')?.textContent;
            return {
                isVisible: isVisible,
                title: title,
                hasPrev: hasPrev,
                hasNext: hasNext,
                hasPlay: hasPlay,
                hasSlider: hasSlider,
                hasVolume: hasVolume,
                queueBadge: queueBadge
            };
        })()""")
        print(f"Capsule Player result: {r3}")
        assert r3.get("isVisible"), "Capsule player must be visible"
        assert "超燃战歌" in (r3.get("title") or ""), "Track title must match playing track"
        assert r3.get("queueBadge") == "2", "Queue badge must show 2 tracks"
        print("PASS 3: Floating Capsule Audio Player DOM and playback queue verified")

        # -------------------------------------------------------------
        # Test 4: Open Lyrics Panel and Queue Drawer
        # -------------------------------------------------------------
        print("\nTesting Lyrics Panel and Queue Drawer...")
        evaluate("""(() => {
            document.getElementById('playerLyricsBtn')?.click();
        })()""")
        time.sleep(0.5)

        r4_lyrics = evaluate("""(() => {
            const panel = document.getElementById('playerLyricsPanel');
            const lines = panel.querySelectorAll('.lyric-line');
            return {
                panelVisible: panel && !panel.hidden,
                linesCount: lines.length,
                firstLine: lines[0]?.textContent?.trim()
            };
        })()""")
        print(f"Lyrics panel result: {r4_lyrics}")
        assert r4_lyrics.get("panelVisible"), "Lyrics panel must be open"
        assert r4_lyrics.get("linesCount") >= 3, "Parsed lyrics lines must be >= 3"

        take_screenshot("phase4_player_capsule_lyrics_1440.png")
        set_viewport(390, 844)
        take_screenshot("phase4_player_capsule_lyrics_390.png")

        set_viewport(1440, 900)
        evaluate("""(() => {
            document.getElementById('playerQueueBtn')?.click();
        })()""")
        time.sleep(0.5)

        r4_queue = evaluate("""(() => {
            const drawer = document.getElementById('playerQueueDrawer');
            const items = drawer.querySelectorAll('.queue-item');
            const activeItem = drawer.querySelector('.queue-item.is-active');
            return {
                drawerVisible: drawer && !drawer.hidden,
                itemsCount: items.length,
                activeTitle: activeItem?.querySelector('strong')?.textContent
            };
        })()""")
        print(f"Queue drawer result: {r4_queue}")
        assert r4_queue.get("drawerVisible"), "Queue drawer must be open"
        assert r4_queue.get("itemsCount") == 2, "Queue must contain 2 items"
        print("PASS 4: Lyrics Panel with LRC timestamps and Queue Drawer verified")

        # -------------------------------------------------------------
        # Test 5: SessionStorage State Persistence on Reload
        # -------------------------------------------------------------
        print("\nTesting SessionStorage Player State Persistence on Reload...")
        state_str = evaluate("sessionStorage.getItem('nsy_music_player_v4_state')")
        print(f"Stored session state: {state_str}")
        assert state_str, "Player state must be stored in sessionStorage"

        navigate(f"{BASE_URL}/music.html")
        time.sleep(1.5)

        r5 = evaluate("""(() => {
            const player = document.getElementById('musicPlayer');
            const isVisible = player && !player.hidden;
            const title = document.getElementById('playerTitle')?.textContent;
            const badge = document.getElementById('playerQueueBadge')?.textContent;
            return {
                isVisible: isVisible,
                title: title,
                badge: badge
            };
        })()""")
        print(f"Reload restored state result: {r5}")
        assert r5.get("isVisible"), "Capsule player must stay visible after reload"
        assert "超燃战歌" in (r5.get("title") or ""), "Restored track title must match"
        assert r5.get("badge") == "2", "Restored queue count must match"
        print("PASS 5: Player state restored after page reload verified")

        # -------------------------------------------------------------
        # Check Console Errors
        # -------------------------------------------------------------
        print(f"\nChecking console errors (found {len(console_errors)})...")
        if console_errors:
            for err in console_errors:
                print("Console Error:", err)
        assert len(console_errors) == 0, f"Found {len(console_errors)} console errors!"
        print("\nALL PHASE 4 BROWSER ACCEPTANCE TESTS PASSED WITH 0 CONSOLE ERRORS!\n")

    finally:
        if ws:
            try: ws.close()
            except: pass
        proc.terminate()
        try: proc.wait(timeout=2)
        except: proc.kill()

if __name__ == "__main__":
    run_browser_phase4_tests()
