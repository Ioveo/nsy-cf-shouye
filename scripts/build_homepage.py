# -*- coding: utf-8 -*-
"""
GeniusCat Desktop 2.0 - Official Flagship Homepage Generator
Based on 'C:\\Users\\miguo\\Downloads\\LTX Video Replica.html'
Outputs to 'F:\\AI\\cf-down\\public\\index.html'
"""

import os
import re

source_path = r"C:\Users\miguo\Downloads\LTX Video Replica.html"
output_path = r"F:\AI\cf-down\public\index.html"

with open(source_path, "r", encoding="utf-8") as f:
    source_html = f.read()

# Extract video element from source html so we keep the exact animated canvas/video
video_match = re.search(r'(<video class="hero-video"[^>]*>.*?</video>)', source_html, re.DOTALL)
if video_match:
    video_tag = video_match.group(1)
else:
    video_tag = '<div class="hero-fallback-bg"></div>'

# Now we craft the complete, upgraded, polished homepage for GeniusCat Desktop 2.0
custom_html = f'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="light dark" />
  <link rel="icon" type="image/x-icon" href="/app.ico" />
  <link rel="apple-touch-icon" href="/app.ico" />
  <title>天才猫桌面 2.0 (GeniusCat Desktop) - 下一代 Windows 灵动桌面中枢与效率管家 | 官方网站</title>
  <meta name="description" content="天才猫桌面 2.0 是专为 Windows 10/11 打造的下一代现代化桌面中枢。抽屉式侧边收纳盒、微信核心离线截图翻译与 OCR、NovaDisk 2.0 C盘无损空间管家、TopPeekDock 顶部窗口速览、治愈系灵动桌宠与天气待办看板于一体。内置独立完整运行环境，任意纯净电脑双击开箱即用，免装任何依赖。" />
  <meta name="keywords" content="天才猫桌面,天才猫,桌面整理,侧边收纳盒,C盘清理,截图翻译,离线OCR,顶部窗口速览,桌宠,Windows桌面美化,NovaDisk" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800;900&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root{{
      color-scheme: light dark;
      --bg: #f2f5f2;
      --surface: #ffffff;
      --surface-2: rgba(255, 255, 255, 0.72);
      --ink: #101514;
      --muted: #5c6762;
      --line: rgba(16, 21, 20, 0.11);
      --glass: rgba(255, 255, 255, 0.58);
      --glass-strong: rgba(255, 255, 255, 0.88);
      --green: #00b887;
      --green-2: #0dd8a0;
      --orange: #ff6942;
      --blue: #3b82f6;
      --purple: #8b5cf6;
      --pink: #ec4899;
      --yellow: #ffe78f;
      --shadow: 0 28px 80px rgba(21, 37, 31, 0.13);
      --soft-shadow: 0 12px 40px rgba(21, 37, 31, 0.08);
      --radius: 28px;
      --max: 1260px;
    }}
    @media (prefers-color-scheme: dark) {{
      :root {{
        --bg: #0b0f0e;
        --surface: #131816;
        --surface-2: rgba(19, 24, 22, 0.75);
        --ink: #f2f7f4;
        --muted: #a6b0ab;
        --line: rgba(255, 255, 255, 0.12);
        --glass: rgba(15, 21, 19, 0.62);
        --glass-strong: rgba(15, 21, 19, 0.90);
        --shadow: 0 28px 80px rgba(0, 0, 0, 0.38);
        --soft-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
      }}
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; background: var(--bg); }}
    body {{
      margin: 0;
      font-family: "Noto Sans SC", system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--ink);
      overflow-x: hidden;
      line-height: 1.6;
    }}
    button, input {{ font: inherit; }}
    button, a {{ -webkit-tap-highlight-color: transparent; }}
    a {{ color: inherit; text-decoration: none; }}
    img, video {{ display: block; max-width: 100%; }}
    .wrap {{ width: min(var(--max), calc(100% - 48px)); margin-inline: auto; }}

    /* Top Nav */
    .nav-shell {{
      position: fixed;
      inset: 18px 24px auto;
      z-index: 80;
      display: flex;
      justify-content: center;
      pointer-events: none;
    }}
    .nav {{
      width: min(1040px, 100%);
      min-height: 64px;
      padding: 0 12px 0 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      border: 1px solid rgba(255, 255, 255, 0.42);
      background: rgba(255, 255, 255, 0.36);
      backdrop-filter: blur(18px) saturate(150%);
      -webkit-backdrop-filter: blur(18px) saturate(150%);
      box-shadow: 0 8px 32px rgba(15, 23, 20, 0.08);
      border-radius: 22px;
      transition: 0.35s ease;
      pointer-events: auto;
    }}
    .nav.scrolled {{
      background: var(--glass-strong);
      border-color: var(--line);
      backdrop-filter: blur(28px) saturate(160%);
      -webkit-backdrop-filter: blur(28px) saturate(160%);
      box-shadow: var(--soft-shadow);
    }}
    .nav-brand {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: -0.02em;
    }}
    .nav-brand img {{
      width: 28px;
      height: 28px;
      border-radius: 8px;
    }}
    .nav-badge {{
      font-size: 10px;
      background: linear-gradient(135deg, #00b887, #0dd8a0);
      color: #fff;
      padding: 2px 7px;
      border-radius: 99px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }}
    .nav-links {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 26px;
      margin: auto;
      font-size: 13px;
      font-weight: 600;
    }}
    .nav-links a {{
      position: relative;
      padding: 9px 0;
      transition: color 0.2s;
    }}
    .nav-links a:hover {{ color: var(--green); }}
    .nav-links a:after {{
      content: "";
      position: absolute;
      inset: auto 0 4px;
      height: 2px;
      border-radius: 2px;
      background: var(--green);
      transform: scaleX(0);
      transition: transform 0.25s ease;
    }}
    .nav-links a:hover:after, .nav-links a:focus-visible:after {{
      transform: scaleX(1);
    }}

    /* Buttons */
    .btn {{
      border: 0;
      border-radius: 14px;
      padding: 12px 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: transform 0.25s, background 0.25s, color 0.25s, box-shadow 0.25s;
    }}
    .btn:hover {{ transform: translateY(-2px); }}
    .btn-dark {{
      background: var(--ink);
      color: var(--bg);
      box-shadow: 0 10px 22px rgba(9, 15, 13, 0.18);
    }}
    .btn-green {{
      background: var(--green);
      color: #fff;
      box-shadow: 0 10px 24px rgba(0, 184, 135, 0.28);
    }}
    .btn-green:hover {{ background: #02a377; }}
    .btn-light {{
      background: rgba(255, 255, 255, 0.78);
      color: #0c1110;
      border: 1px solid rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(14px);
    }}
    .btn-outline {{
      background: transparent;
      border: 1px solid var(--line);
      color: var(--ink);
    }}
    .btn-pink {{
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      color: #fff;
      box-shadow: 0 10px 24px rgba(225, 29, 72, 0.25);
    }}
    .menu-btn {{
      display: none;
      margin-left: auto;
      border: 0;
      background: transparent;
      color: inherit;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      cursor: pointer;
    }}
    .menu-btn span {{
      display: block;
      width: 20px;
      height: 2px;
      background: currentColor;
      margin: 5px auto;
      transition: 0.25s;
    }}

    /* Hero Section */
    .hero {{
      position: relative;
      min-height: 100svh;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
      background: #d6ebe4;
    }}
    .hero-video {{
      position: absolute;
      inset: -6% -3%;
      width: 106%;
      height: 112%;
      object-fit: cover;
      transform: scale(1.04);
      filter: hue-rotate(85deg) saturate(0.85) brightness(1.12);
      will-change: transform;
    }}
    .hero:after {{
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(242, 249, 246, 0.15), rgba(240, 249, 245, 0.35) 45%, rgba(242, 245, 242, 0.95) 100%);
    }}
    @media (prefers-color-scheme: dark) {{
      .hero-video {{ filter: hue-rotate(85deg) saturate(0.75) brightness(0.65); }}
      .hero:after {{
        background: linear-gradient(180deg, rgba(7, 10, 9, 0.15), rgba(7, 10, 9, 0.38) 50%, rgba(7, 10, 9, 0.96) 100%);
      }}
    }}
    .hero-content {{
      position: relative;
      z-index: 2;
      width: min(1360px, calc(100% - 64px));
      margin: 0 auto;
      padding: 130px 0 60px;
    }}
    .hero-grid {{
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 40px;
      align-items: center;
    }}
    .status-pill {{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(18px);
      padding: 8px 14px;
      border-radius: 999px;
      color: #17201d;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 10px 24px rgba(27, 46, 39, 0.08);
      margin-bottom: 24px;
    }}
    .status-dot {{
      width: 8px;
      height: 8px;
      background: #20d68c;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(32, 214, 140, 0.2);
    }}
    h1 {{
      font-size: clamp(48px, 6vw, 92px);
      line-height: 1.02;
      letter-spacing: -0.06em;
      margin: 0 0 24px;
      font-weight: 800;
      color: #0d1311;
      text-wrap: balance;
    }}
    h1 em {{
      font-family: "Noto Serif SC", serif;
      font-style: normal;
      font-weight: 400;
      letter-spacing: -0.03em;
      color: var(--green);
    }}
    @media (prefers-color-scheme: dark) {{
      h1 {{ color: #f6f9f5; }}
      .status-pill {{ background: rgba(15, 21, 19, 0.6); color: #f6f9f5; border-color: rgba(255, 255, 255, 0.18); }}
    }}
    .hero-copy {{
      max-width: 620px;
      font-size: 16px;
      line-height: 1.75;
      color: #25302c;
      margin: 0 0 28px;
    }}
    @media (prefers-color-scheme: dark) {{
      .hero-copy {{ color: #d5ded9; }}
    }}
    .hero-actions {{
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }}
    .hero-actions .btn {{ padding: 14px 24px; font-size: 14px; }}
    .platforms {{
      font-size: 12px;
      color: #4b5853;
      margin: 16px 0 0;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .platforms svg {{ width: 15px; height: 15px; fill: currentColor; }}
    @media (prefers-color-scheme: dark) {{
      .platforms {{ color: #9ea9a3; }}
    }}

    /* Real Widget Mockup in Hero */
    .widget-card {{
      background: rgba(255, 255, 255, 0.62);
      border: 1px solid rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(28px) saturate(155%);
      -webkit-backdrop-filter: blur(28px) saturate(155%);
      border-radius: 28px;
      padding: 22px;
      box-shadow: 0 24px 60px rgba(25, 45, 38, 0.14);
      color: #111916;
      width: min(440px, 100%);
      margin-left: auto;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }}
    .widget-card:hover {{
      transform: translateY(-4px);
      box-shadow: 0 32px 75px rgba(25, 45, 38, 0.18);
    }}
    @media (prefers-color-scheme: dark) {{
      .widget-card {{
        background: rgba(18, 25, 22, 0.72);
        border-color: rgba(255, 255, 255, 0.16);
        color: #edf2ef;
      }}
    }}
    .widget-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }}
    .widget-title {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 15px;
    }}
    .widget-cat-icon {{
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a78bfa, #818cf8);
      display: grid;
      place-items: center;
      font-size: 14px;
      color: #fff;
    }}
    .widget-toggle-pill {{
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      border-radius: 99px;
      background: rgba(0, 0, 0, 0.05);
      font-size: 11px;
      font-weight: 700;
    }}
    @media (prefers-color-scheme: dark) {{
      .widget-toggle-pill {{ background: rgba(255, 255, 255, 0.1); }}
    }}
    .toggle-dot {{
      width: 14px;
      height: 14px;
      background: #f43f5e;
      border-radius: 50%;
    }}
    .widget-clock-row {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;
    }}
    .widget-time {{
      font-size: 42px;
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.04em;
    }}
    .widget-sec {{
      font-size: 20px;
      color: #f43f5e;
      font-weight: 800;
      margin-left: 2px;
    }}
    .widget-date {{
      font-size: 11px;
      color: var(--muted);
      margin-top: 4px;
      font-weight: 600;
    }}
    .widget-pet-switch {{
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.06);
      padding: 6px 12px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
    }}
    @media (prefers-color-scheme: dark) {{
      .widget-pet-switch {{ background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.1); }}
    }}
    .tidy-btn-capsule {{
      width: 100%;
      padding: 13px 18px;
      border-radius: 18px;
      background: linear-gradient(135deg, #fb7185 0%, #f43f5e 50%, #e11d48 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 8px 24px rgba(244, 63, 94, 0.28);
      margin-bottom: 16px;
      transition: transform 0.2s;
    }}
    .tidy-btn-capsule:hover {{ transform: scale(1.015); }}
    .tidy-btn-left {{ display: flex; align-items: center; gap: 8px; }}
    .tidy-btn-desc {{ font-size: 10px; opacity: 0.88; font-weight: 500; margin-left: 4px; }}
    .widget-tool-grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 18px;
    }}
    .widget-tool-item {{
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      padding: 12px 6px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      transition: background 0.2s, transform 0.2s;
      cursor: pointer;
    }}
    .widget-tool-item:hover {{
      background: rgba(255, 255, 255, 0.85);
      transform: translateY(-2px);
    }}
    @media (prefers-color-scheme: dark) {{
      .widget-tool-item {{ background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.08); }}
      .widget-tool-item:hover {{ background: rgba(255, 255, 255, 0.16); }}
    }}
    .tool-icon {{
      width: 32px;
      height: 32px;
      margin: 0 auto 6px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 15px;
    }}
    .anniversary-card {{
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 20px;
      padding: 14px 16px;
    }}
    @media (prefers-color-scheme: dark) {{
      .anniversary-card {{ background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.08); }}
    }}
    .anni-top {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 8px;
    }}
    .anni-capsule {{
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.28));
      border: 1px solid rgba(244, 63, 94, 0.25);
      border-radius: 14px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .anni-name {{ font-weight: 800; font-size: 13px; }}
    .anni-days {{
      background: #fff;
      color: #f43f5e;
      padding: 3px 10px;
      border-radius: 99px;
      font-weight: 900;
      font-size: 13px;
    }}

    /* Marquee Strip */
    .logo-strip {{
      border-block: 1px solid var(--line);
      overflow: hidden;
      background: var(--bg);
    }}
    .track {{
      display: flex;
      width: max-content;
      animation: marquee 34s linear infinite;
      padding: 22px 0;
    }}
    .logo-set {{
      display: flex;
      align-items: center;
      gap: 56px;
      padding-right: 56px;
      color: var(--muted);
      font-size: 14px;
      font-weight: 700;
    }}
    .logo-set span:nth-child(2n) {{
      font-family: "Noto Serif SC", serif;
      font-size: 17px;
      font-weight: 400;
      color: var(--green);
    }}
    @keyframes marquee {{ to {{ transform: translateX(-50%); }} }}

    /* Sections Shared */
    section {{ padding: 110px 0; }}
    .section-head {{
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 32px;
      margin-bottom: 52px;
    }}
    .eyebrow {{
      font-size: 12px;
      font-weight: 800;
      color: var(--green);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin: 0 0 12px;
    }}
    h2 {{
      font-size: clamp(38px, 5vw, 68px);
      line-height: 1.05;
      letter-spacing: -0.055em;
      margin: 0;
      font-weight: 800;
      max-width: 840px;
    }}
    h2 em {{
      font-family: "Noto Serif SC", serif;
      font-style: normal;
      font-weight: 400;
      color: var(--green);
    }}
    .section-note {{
      max-width: 440px;
      color: var(--muted);
      line-height: 1.75;
      margin: 0;
      font-size: 15px;
    }}

    /* Features Grid (3D Cards) */
    .features {{
      background: linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--bg) 90%, #baf4df));
    }}
    .feature-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      perspective: 1200px;
    }}
    .feature-card {{
      position: relative;
      min-height: 295px;
      padding: 30px;
      overflow: hidden;
      border: 1px solid var(--line);
      background: var(--surface-2);
      backdrop-filter: blur(18px);
      border-radius: var(--radius);
      box-shadow: var(--soft-shadow);
      transform-style: preserve-3d;
      transition: transform 0.2s ease, box-shadow 0.25s;
    }}
    .feature-card:hover {{ box-shadow: var(--shadow); }}
    .feature-card:before {{
      content: "";
      position: absolute;
      inset: -1px;
      background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.45) 48%, transparent 65%);
      transform: translateX(-120%);
      transition: transform 0.65s;
      pointer-events: none;
    }}
    .feature-card:hover:before {{ transform: translateX(120%); }}
    .feature-card:nth-child(1), .feature-card:nth-child(4) {{
      grid-column: span 2;
      background: linear-gradient(135deg, color-mix(in srgb, var(--surface) 86%, var(--yellow)), var(--surface-2));
    }}
    .feature-card:nth-child(4) {{
      background: linear-gradient(135deg, color-mix(in srgb, var(--surface) 84%, #b7f3df), var(--surface-2));
    }}
    .feature-top {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      transform: translateZ(20px);
    }}
    .icon {{
      width: 52px;
      height: 52px;
      border-radius: 18px;
      background: var(--surface);
      border: 1px solid var(--line);
      display: grid;
      place-items: center;
      color: var(--green);
      box-shadow: 0 10px 24px rgba(21, 31, 27, 0.08);
      font-size: 22px;
    }}
    .feature-num {{
      font: 400 20px "Noto Serif SC", serif;
      color: var(--muted);
    }}
    .feature-card h3 {{
      font-size: 24px;
      letter-spacing: -0.04em;
      margin: 50px 0 12px;
      font-weight: 800;
      transform: translateZ(26px);
    }}
    .feature-card p {{
      color: var(--muted);
      font-size: 14px;
      line-height: 1.75;
      margin: 0;
      max-width: 520px;
      transform: translateZ(18px);
    }}

    /* Interactive Showcase (Screen Tabs) */
    .showcase {{ background: var(--surface); }}
    .screen-tabs {{
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 26px;
    }}
    .filter {{
      border: 1px solid var(--line);
      background: transparent;
      color: var(--muted);
      border-radius: 999px;
      padding: 10px 18px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      transition: 0.22s;
    }}
    .filter:hover {{ color: var(--ink); border-color: var(--ink); }}
    .filter.active {{
      background: var(--ink);
      color: var(--bg);
      border-color: var(--ink);
    }}
    .screen-stage {{
      position: relative;
      border-radius: 32px;
      background: #0d1513;
      padding: 16px;
      box-shadow: 0 30px 80px rgba(16, 37, 29, 0.24);
      overflow: hidden;
    }}
    .screen {{
      display: none;
      min-height: 580px;
      border-radius: 22px;
      overflow: hidden;
      background: #eef4f1;
      color: #17201d;
      position: relative;
    }}
    @media (prefers-color-scheme: dark) {{
      .screen {{ background: #16201c; color: #edf2ef; }}
    }}
    .screen.active {{ display: block; }}
    .screen-grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 30px;
      align-items: center;
    }}
    .screen-img-box {{
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: #000;
    }}
    .screen-img-box img {{
      width: 100%;
      height: auto;
      display: block;
      transition: transform 0.4s ease;
    }}
    .screen-img-box:hover img {{ transform: scale(1.02); }}
    .screen-info h3 {{
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.04em;
      margin: 0 0 14px;
    }}
    .screen-info p {{
      color: var(--muted);
      font-size: 15px;
      line-height: 1.75;
      margin: 0 0 20px;
    }}
    .feature-checklist {{
      list-style: none;
      padding: 0;
      margin: 0 0 24px;
      display: grid;
      gap: 10px;
    }}
    .feature-checklist li {{
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
    }}
    .feature-checklist li:before {{
      content: "✓";
      display: inline-grid;
      place-items: center;
      width: 20px;
      height: 20px;
      background: #00b887;
      color: #fff;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 900;
      flex-shrink: 0;
    }}

    /* Treemap Mockup inside Screen */
    .treemap-mock {{
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      grid-template-rows: 150px 150px;
      gap: 10px;
      padding: 10px;
      background: #0c1210;
      border-radius: 18px;
    }}
    .treemap-tile {{
      border-radius: 12px;
      padding: 14px;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s;
    }}
    .treemap-tile:hover {{ transform: scale(0.985); }}
    .treemap-tile b {{ font-size: 16px; font-weight: 800; }}
    .treemap-tile span {{ font-size: 11px; opacity: 0.85; }}
    .tile-wechat {{
      grid-row: span 2;
      background: linear-gradient(135deg, #059669, #10b981);
    }}
    .tile-system {{ background: linear-gradient(135deg, #2563eb, #3b82f6); }}
    .tile-cache {{ background: linear-gradient(135deg, #d97706, #f59e0b); }}

    /* How It Works (Steps) */
    .how {{ position: relative; overflow: hidden; }}
    .how:before {{
      content: "";
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, #a9f1da, transparent 68%);
      opacity: 0.34;
      right: -220px;
      top: 20px;
      pointer-events: none;
    }}
    .steps {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
      margin-top: 60px;
      position: relative;
    }}
    .steps:before {{
      content: "";
      position: absolute;
      left: 8%;
      right: 8%;
      top: 31px;
      height: 1px;
      background: var(--line);
    }}
    .step {{ position: relative; padding-right: 54px; }}
    .step-index {{
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: var(--ink);
      color: var(--bg);
      display: grid;
      place-items: center;
      font: 400 18px "Noto Serif SC", serif;
      position: relative;
      z-index: 1;
      box-shadow: 0 0 0 10px var(--bg);
    }}
    .step h3 {{
      font-size: 26px;
      letter-spacing: -0.04em;
      margin: 32px 0 12px;
      font-weight: 800;
    }}
    .step p {{
      color: var(--muted);
      line-height: 1.75;
      margin: 0;
      font-size: 14px;
    }}

    /* Download Section */
    .download {{ padding-top: 20px; }}
    .download-panel {{
      position: relative;
      background: linear-gradient(125deg, #d9fff2 0%, #ebf4ff 48%, #fff0d8 100%);
      border: 1px solid rgba(31, 61, 50, 0.1);
      border-radius: 40px;
      padding: 58px;
      overflow: hidden;
      color: #101513;
    }}
    .download-panel:after {{
      content: "猫";
      position: absolute;
      right: -10px;
      top: -70px;
      font: 700 360px "Noto Serif SC", serif;
      color: rgba(16, 21, 19, 0.035);
      pointer-events: none;
    }}
    .download-grid {{
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 45px;
      position: relative;
      z-index: 1;
    }}
    .version {{
      font-size: 13px;
      font-weight: 800;
      color: #067b5b;
      margin: 16px 0 24px;
    }}
    .download-buttons-group {{
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 440px;
    }}
    .main-download-btn {{
      padding: 16px 24px;
      border-radius: 16px;
      font-size: 15px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
    }}
    .download-note {{
      font-size: 12px;
      color: #55635d;
      margin-top: 14px;
      line-height: 1.6;
    }}
    .requirements {{
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: 24px;
      padding: 26px;
      backdrop-filter: blur(16px);
    }}
    .requirements h3 {{ margin: 0 0 16px; font-size: 19px; font-weight: 800; }}
    .req-row {{
      padding: 11px 0;
      border-bottom: 1px solid rgba(16, 21, 19, 0.08);
      font-size: 12px;
      line-height: 1.6;
    }}
    .req-row:last-child {{ border-bottom: 0; }}
    .req-row b {{ display: inline-block; width: 92px; color: #101514; }}
    .changelog {{
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(16, 21, 19, 0.1);
      font-size: 11px;
      line-height: 1.7;
    }}
    .download-toast {{
      display: none;
      margin-top: 14px;
      padding: 12px 16px;
      border-radius: 14px;
      background: #101513;
      color: #fff;
      font-size: 12px;
      max-width: 480px;
    }}
    .download-toast.show {{ display: block; }}

    /* Pricing Section */
    .pricing {{
      background: #111714;
      color: #f4f7f3;
      border-radius: 54px 54px 0 0;
    }}
    .pricing .eyebrow {{ color: #73efc7; }}
    .pricing .section-note {{ color: #aeb8b3; }}
    .price-grid {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      align-items: stretch;
      margin-top: 30px;
    }}
    .price-card {{
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.055);
      border-radius: 26px;
      padding: 30px;
      display: flex;
      flex-direction: column;
      min-height: 480px;
    }}
    .price-card.pro {{
      background: #f4f7f3;
      color: #111714;
      transform: translateY(-16px);
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.35);
    }}
    .plan-tag {{
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      opacity: 0.7;
    }}
    .price-card h3 {{
      font-size: 28px;
      margin: 14px 0 2px;
      letter-spacing: -0.045em;
      font-weight: 800;
    }}
    .amount {{
      display: flex;
      align-items: start;
      margin: 26px 0 20px;
    }}
    .currency {{ font-size: 18px; margin-top: 8px; }}
    .number {{
      font-size: 54px;
      line-height: 1;
      letter-spacing: -0.07em;
      font-weight: 900;
    }}
    .period {{ font-size: 12px; opacity: 0.6; margin: 30px 0 0 7px; }}
    .price-card ul {{
      list-style: none;
      padding: 0;
      margin: 18px 0 30px;
    }}
    .price-card li {{
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 13px;
      display: flex;
      gap: 10px;
    }}
    .price-card.pro li {{ border-color: rgba(0, 0, 0, 0.1); }}
    .price-card li:before {{ content: "↳"; opacity: 0.65; }}
    .price-card .btn {{ margin-top: auto; }}

    /* Notes / Reviews Carousel */
    .notes {{ background: var(--surface); overflow: hidden; }}
    .carousel-shell {{
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 70px;
      align-items: end;
    }}
    .carousel-controls {{ display: flex; gap: 10px; margin-top: 28px; }}
    .round-btn {{
      width: 48px;
      height: 48px;
      border: 1px solid var(--line);
      background: transparent;
      color: var(--ink);
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      transition: background 0.2s, color 0.2s;
    }}
    .round-btn:hover {{ background: var(--ink); color: var(--bg); }}
    .quote-stage {{ position: relative; min-height: 340px; }}
    .quote {{
      position: absolute;
      inset: 0;
      opacity: 0;
      visibility: hidden;
      transform: translateX(36px);
      transition: opacity 0.55s cubic-bezier(0.2, 0.7, 0.2, 1), transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1), visibility 0s 0.55s;
      pointer-events: none;
      border-top: 1px solid var(--line);
      padding-top: 32px;
    }}
    .quote.active {{
      opacity: 1;
      visibility: visible;
      transform: none;
      pointer-events: auto;
      transition-delay: 0s;
    }}
    .quote-mark {{
      font: 400 62px "Noto Serif SC", serif;
      line-height: 0.5;
      color: var(--orange);
    }}
    blockquote {{
      font-size: clamp(23px, 3vw, 38px);
      line-height: 1.35;
      letter-spacing: -0.04em;
      margin: 24px 0 26px;
      font-weight: 700;
    }}
    .quote-person {{ display: flex; align-items: center; gap: 14px; }}
    .quote-avatar {{
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6ee7b7, #3b82f6);
      display: grid;
      place-items: center;
      font-size: 20px;
    }}
    .quote-person strong {{ display: block; font-size: 14px; }}
    .quote-person span {{ font-size: 12px; color: var(--muted); }}
    .dots {{ display: flex; gap: 6px; margin-top: 22px; }}
    .dot {{
      height: 4px;
      width: 24px;
      border: 0;
      background: var(--line);
      padding: 0;
      border-radius: 99px;
      cursor: pointer;
    }}
    .dot.active {{ background: var(--orange); }}

    /* FAQ Section */
    .faq {{ background: linear-gradient(180deg, var(--surface), var(--bg)); }}
    .faq-list {{ max-width: 900px; margin: 0 auto; border-top: 1px solid var(--line); }}
    .faq-item {{ border-bottom: 1px solid var(--line); }}
    .faq-q {{
      width: 100%;
      border: 0;
      background: transparent;
      color: var(--ink);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      text-align: left;
      padding: 24px 4px;
      font-weight: 700;
      font-size: 17px;
      cursor: pointer;
    }}
    .faq-q span:last-child {{
      font-size: 26px;
      font-weight: 400;
      transition: transform 0.25s;
    }}
    .faq-item.open .faq-q span:last-child {{ transform: rotate(45deg); }}
    .faq-a {{ display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; }}
    .faq-a > div {{ overflow: hidden; }}
    .faq-a p {{
      color: var(--muted);
      line-height: 1.8;
      margin: 0;
      padding: 0 60px 24px 4px;
      font-size: 14px;
    }}
    .faq-item.open .faq-a {{ grid-template-rows: 1fr; }}

    /* Final CTA */
    .final {{ padding: 42px; background: var(--bg); }}
    .final-panel {{
      position: relative;
      min-height: 480px;
      border-radius: 38px;
      background: linear-gradient(120deg, #00ae82 0%, #2563eb 50%, #f43f5e 100%);
      overflow: hidden;
      padding: 70px;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: var(--shadow);
    }}
    .final-panel h2 {{
      max-width: 860px;
      position: relative;
      z-index: 1;
      color: #fff;
    }}
    .final-actions {{
      position: relative;
      z-index: 2;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }}
    .final-note {{
      position: relative;
      z-index: 2;
      font-size: 13px;
      margin-top: 14px;
      opacity: 0.9;
    }}

    /* Footer */
    footer {{ padding: 64px 0 36px; background: var(--bg); }}
    .footer-grid {{
      display: grid;
      grid-template-columns: 1.4fr repeat(3, 1fr);
      gap: 50px;
    }}
    .footer-name {{ font-weight: 800; font-size: 18px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }}
    .footer-note {{ max-width: 340px; color: var(--muted); line-height: 1.7; font-size: 13px; }}
    .footer-col h4 {{ font-size: 13px; margin: 0 0 16px; font-weight: 800; }}
    .footer-col a {{ display: block; color: var(--muted); font-size: 12px; padding: 7px 0; transition: color 0.2s; }}
    .footer-col a:hover {{ color: var(--ink); }}
    .footer-bottom {{
      display: flex;
      justify-content: space-between;
      border-top: 1px solid var(--line);
      padding-top: 24px;
      margin-top: 48px;
      color: var(--muted);
      font-size: 12px;
    }}

    /* Reveal Animations */
    .reveal {{ opacity: 1; transform: none; }}
    .reveal.in {{ animation: revealIn 0.75s cubic-bezier(0.2, 0.7, 0.2, 1) both; }}
    @keyframes revealIn {{
      from {{ opacity: 0.15; transform: translateY(28px); }}
      to {{ opacity: 1; transform: none; }}
    }}

    /* Responsive */
    @media (max-width: 960px) {{
      .nav-links, .nav .btn-green {{ display: none; }}
      .menu-btn {{ display: block; }}
      .nav.open {{ height: auto; flex-wrap: wrap; padding-bottom: 14px; }}
      .nav.open .nav-links {{ order: 4; width: 100%; display: grid; gap: 0; }}
      .nav.open .nav-links a {{ padding: 13px 4px; border-top: 1px solid var(--line); }}
      .hero-grid {{ grid-template-columns: 1fr; }}
      .widget-card {{ margin: 0 auto; }}
      .section-head {{ display: block; }}
      .section-note {{ margin-top: 20px; }}
      .feature-grid {{ grid-template-columns: repeat(2, 1fr); }}
      .feature-card:nth-child(1), .feature-card:nth-child(4) {{ grid-column: span 1; }}
      .screen-grid-2 {{ grid-template-columns: 1fr; }}
      .download-grid {{ grid-template-columns: 1fr; }}
      .price-grid {{ grid-template-columns: 1fr; }}
      .price-card.pro {{ transform: none; order: -1; }}
      .carousel-shell {{ grid-template-columns: 1fr; gap: 42px; }}
      .footer-grid {{ grid-template-columns: repeat(2, 1fr); }}
    }}
    @media (max-width: 640px) {{
      .wrap {{ width: min(100% - 28px, var(--max)); }}
      .nav-shell {{ inset: 10px 10px auto; }}
      .nav {{ min-height: 58px; border-radius: 16px; }}
      .hero {{ min-height: 860px; }}
      .hero-content {{ padding: 110px 0 30px; }}
      .hero-actions .btn, .final-actions .btn {{ width: 100%; }}
      section {{ padding: 80px 0; }}
      .feature-grid {{ grid-template-columns: 1fr; }}
      .steps {{ grid-template-columns: 1fr; gap: 46px; margin-top: 50px; }}
      .steps:before {{ left: 30px; right: auto; top: 20px; bottom: 40px; height: auto; width: 1px; }}
      .step {{ padding: 0 0 0 88px; }}
      .step-index {{ position: absolute; left: 0; top: 0; }}
      .step h3 {{ margin-top: 0; }}
      .download-panel {{ padding: 34px 22px; border-radius: 28px; }}
      .final {{ padding: 14px; }}
      .final-panel {{ padding: 38px 24px; min-height: 440px; border-radius: 28px; }}
      .footer-grid {{ grid-template-columns: 1fr 1fr; gap: 36px 20px; }}
      .footer-grid > div:first-child {{ grid-column: 1 / -1; }}
      .footer-bottom {{ display: block; line-height: 2; }}
    }}
  </style>
</head>
<body>

  <!-- Navigation -->
  <div class="nav-shell">
    <nav class="nav" id="nav" aria-label="主要导航">
      <a class="nav-brand" href="#top">
        <img src="/app.ico" alt="天才猫桌面 LOGO" />
        <span>天才猫桌面</span>
        <span class="nav-badge">2.0</span>
      </a>
      <div class="nav-links" id="navLinks">
        <a href="#features">核心功能</a>
        <a href="#screens">真实界面</a>
        <a href="#novadisk">C盘管家</a>
        <a href="#peek">顶部速览</a>
        <a href="#how">使用指引</a>
        <a href="#download">免费下载</a>
        <a href="#faq">常见问题</a>
      </div>
      <a class="btn btn-green" href="#download">立即下载 <span>↓</span></a>
      <button class="menu-btn" id="menuBtn" aria-label="打开导航" aria-expanded="false">
        <span></span><span></span>
      </button>
    </nav>
  </div>

  <main id="top">
    <!-- Hero Section -->
    <header class="hero">
      {video_tag}
      <div class="hero-content">
        <div class="hero-grid">
          <div class="reveal">
            <div class="status-pill">
              <span class="status-dot"></span>
              <span>🔥 天才猫桌面 2.0 旗舰版现已发布 · 开箱即用免装环境</span>
            </div>
            <h1>灵动桌面效率中枢，让 Windows<em>重获新生。</em></h1>
            <p class="hero-copy">
              专为 Windows 10/11 打造的划时代桌面中枢。抽屉式侧边收纳、微信核心离线截图翻译与 OCR、NovaDisk 2.0 C盘无损空间管家、TopPeekDock 顶部窗口速览与治愈系桌宠，内置独立自包含环境，双击即可直接使用！
            </p>
            <div class="hero-actions">
              <a class="btn btn-dark" href="#download">
                <span>下载 Windows 官方版 (v2.0.0)</span>
                <span style="font-size: 11px; opacity:0.8;">~85MB</span>
              </a>
              <a class="btn btn-light" href="#screens">
                <span>浏览功能演示</span>
                <span>→</span>
              </a>
              <a class="btn btn-outline" href="/novadisk.html" target="_blank">
                <span>⚡ 在线体验 C盘管家</span>
              </a>
            </div>
            <div class="platforms">
              <svg viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801"/></svg>
              <span>完美支持 Windows 10 (19041+) / Windows 11 · 64 位独立免运行库版</span>
            </div>
          </div>

          <!-- Hero Right Mockup: 真实还原用户截图 1 的桌面小组件与状态 -->
          <div class="reveal">
            <div class="widget-card">
              <div class="widget-header">
                <div class="widget-title">
                  <div class="widget-cat-icon">🐱</div>
                  <span>天才猫桌面</span>
                  <span style="font-size:11px; color:#00b887; font-weight:700;">● 运行中</span>
                </div>
                <div class="widget-pet-switch">
                  <span>喵喵</span>
                  <div class="toggle-dot"></div>
                </div>
              </div>

              <div class="widget-clock-row">
                <div>
                  <div class="widget-time">21:21<span class="widget-sec">40</span></div>
                  <div class="widget-date">10月8日 星期四 · 农历八月廿八</div>
                </div>
                <div style="text-align: right; font-size:11px; color:var(--muted); font-weight:600;">
                  <span>24°C 晴朗</span><br>
                  <span style="color:#00b887;">空气质量 优 (32)</span>
                </div>
              </div>

              <!-- 一键整理快捷流光胶囊 -->
              <a class="tidy-btn-capsule" href="#screens">
                <div class="tidy-btn-left">
                  <span>⚡</span>
                  <span>一键整理桌面</span>
                  <span class="tidy-btn-desc">自动归类到收纳盒 · 可撤销</span>
                </div>
                <span>›</span>
              </a>

              <!-- 桌面工具快捷磁贴 -->
              <div class="widget-tool-grid">
                <div class="widget-tool-item">
                  <div class="tool-icon" style="background: linear-gradient(135deg, #10b981, #059669);">🗄️</div>
                  <span>新建收纳</span>
                </div>
                <div class="widget-tool-item">
                  <div class="tool-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">📁</div>
                  <span>文件管理</span>
                </div>
                <div class="widget-tool-item">
                  <div class="tool-icon" style="background: linear-gradient(135deg, #a855f7, #9333ea);">⌨️</div>
                  <span>快捷设置</span>
                </div>
                <div class="widget-tool-item">
                  <div class="tool-icon" style="background: linear-gradient(135deg, #f97316, #ea580c);">⚙️</div>
                  <span>设置中心</span>
                </div>
              </div>

              <!-- 纪念日卡片 -->
              <div class="anniversary-card">
                <div class="anni-top">
                  <span style="display:flex; align-items:center; gap:6px;">
                    <span style="color:#f43f5e;">🎁</span> 纪念日看板 (共 3 个)
                  </span>
                  <span style="color:#f43f5e; font-weight:800;">最近还有 1 天</span>
                </div>
                <div class="anni-capsule">
                  <div>
                    <div class="anni-name">TTTT</div>
                    <div style="font-size:10px; color:#5c6762; margin-top:2px;">⏱ 0 天 11:38:18 倒计时</div>
                  </div>
                  <div class="anni-days">还有 1 天</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Marquee Banner Strip -->
    <div class="logo-strip" aria-label="核心特色流动条">
      <div class="track">
        <div class="logo-set">
          <span>抽屉式侧边吸附</span><span>★</span>
          <span>微信离线 OCR 识别</span><span>★</span>
          <span>原图覆盖式多语翻译</span><span>★</span>
          <span>NovaDisk 2.0 C盘管家</span><span>★</span>
          <span>NTFS 软链接无损搬家</span><span>★</span>
          <span>TopPeekDock 顶部窗口速览</span><span>★</span>
          <span>Everything64 极速搜索</span><span>★</span>
          <span>治愈系灵动桌宠</span><span>★</span>
          <span>壁纸层跳秒天气时钟</span><span>★</span>
          <span>今日待办一句话记录</span><span>★</span>
          <span>纪念日精准倒数</span><span>★</span>
          <span>一键桌面智能整理撤销</span><span>★</span>
        </div>
        <div class="logo-set">
          <span>抽屉式侧边吸附</span><span>★</span>
          <span>微信离线 OCR 识别</span><span>★</span>
          <span>原图覆盖式多语翻译</span><span>★</span>
          <span>NovaDisk 2.0 C盘管家</span><span>★</span>
          <span>NTFS 软链接无损搬家</span><span>★</span>
          <span>TopPeekDock 顶部窗口速览</span><span>★</span>
          <span>Everything64 极速搜索</span><span>★</span>
          <span>治愈系灵动桌宠</span><span>★</span>
          <span>壁纸层跳秒天气时钟</span><span>★</span>
          <span>今日待办一句话记录</span><span>★</span>
          <span>纪念日精准倒数</span><span>★</span>
          <span>一键桌面智能整理撤销</span><span>★</span>
        </div>
      </div>
    </div>

    <!-- 6 大核心王牌能力 -->
    <section class="features" id="features">
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">六大王牌特性</p>
            <h2>拒绝花哨噱头，专为<em>真实效率而生。</em></h2>
          </div>
          <p class="section-note">
            从混乱桌面整理、高频跨语言办公、C盘爆满清理到沉浸多任务视窗，天才猫桌面 2.0 为您构筑丝滑顺手的工作环境。
          </p>
        </div>

        <div class="feature-grid" id="tiltGrid">
          <!-- 01 侧边收纳盒 -->
          <article class="feature-card reveal">
            <div class="feature-top">
              <div class="icon">🗄️</div>
              <span class="feature-num">01</span>
            </div>
            <h3>收纳盒“藏在屏幕侧边” · 抽屉式顺滑吸附</h3>
            <p>
              拖动收纳盒至屏幕左/右/顶边缘松手，自动弹性收缩进屏幕边框，仅留出一道精致超薄磨砂把手（例如 📁 文件夹 &lt;、🌐 网站 ˅）。鼠标触碰即平滑滑出，多个盒子自动垂直避让不重叠，彻底解决传统收纳盒常驻遮挡壁纸的痛点。
            </p>
          </article>

          <!-- 02 截图翻译与离线 OCR -->
          <article class="feature-card reveal">
            <div class="feature-top">
              <div class="icon">📸</div>
              <span class="feature-num">02</span>
            </div>
            <h3>微信级离线 OCR · 原图覆盖式高精翻译</h3>
            <p>
              深度集成微信离线 OCR 神经网络核心引擎，毫秒级解析文字，零网络请求保护企业与个人隐私。独创原图覆盖渲染，外文截屏就地替换为译文；更有滚动长截图、高保真 GIF 录制与桌面置顶钉图 Pin。
            </p>
          </article>

          <!-- 03 NovaDisk 2.0 C盘管家 -->
          <article class="feature-card reveal">
            <div class="feature-top">
              <div class="icon">💾</div>
              <span class="feature-num">03</span>
            </div>
            <h3>NovaDisk 2.0 C盘空间管家 · NTFS 无损搬迁</h3>
            <p>
              告别陈旧工控机花绿方块，采用 Fluent 2.0 亚克力圆角 Treemap 磁盘树图。内置智能知识库，为每个晦涩文件夹提供“智能身份证”说明用途；独创 NTFS Junction 软链接置换，无损搬走微信 QQ 几十 GB 数据，原软件无感读写，C盘瞬间回血！
            </p>
          </article>

          <!-- 04 TopPeekDock 顶部窗口速览 -->
          <article class="feature-card reveal">
            <div class="feature-top">
              <div class="icon">🖥️</div>
              <span class="feature-num">04</span>
            </div>
            <h3>TopPeekDock 顶部窗口速览 · 悬停“偷看”无缝盲操</h3>
            <p>
              屏幕上沿极简居中胶囊，鼠标碰顶优雅展开。悬停在窗口标签上，瞬间临时置顶“偷看”后台画面，移开即回原状，不打乱原本工作流；鼠标停留时支持键盘 ← → 轮播与 1~9 数字键盲操秒切，多任务办公神级辅助。
            </p>
          </article>

          <!-- 05 快捷操作中心 -->
          <article class="feature-card reveal">
            <div class="feature-top">
              <div class="icon">🚀</div>
              <span class="feature-num">05</span>
            </div>
            <h3>Alt+1~9 闪电直达 · Everything64 极速搜索</h3>
            <p>
              底层 Win32 全局热键中枢，自由绑定常用软件、项目文件夹、网址乃至独立浏览器分身；内置热键健康诊断冲突预警；Alt+Space 全局呼出 Everything 极速内核，全盘数百万文件毫秒级定位秒开。
            </p>
          </article>

          <!-- 06 治愈桌宠与桌面小组件 -->
          <article class="feature-card reveal">
            <div class="feature-top">
              <div class="icon">🐱</div>
              <span class="feature-num">06</span>
            </div>
            <h3>治愈系桌宠灵动交互 · 壁纸层微光小组件看板</h3>
            <p>
              零依赖轻量帧动画小猫，可拎起后颈、在屏幕侧边扒边探头与打盹；单击贴心问候，双击呼出专注时钟；搭配壁纸层天气农历跳秒时钟、今日待办随手记与纪念日精准倒计时，好看更好用。
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- 真实界面交互式展示台 (Showcase) -->
    <section class="showcase" id="screens">
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">真实软件视窗</p>
            <h2>所见即所得，现代磨砂<em>视觉美学。</em></h2>
          </div>
          <p class="section-note">
            基于微软 Fluent 现代设计规范打造，支持 125% DPI 自适应抗锯齿与多种高级治愈系配色方案。
          </p>
        </div>

        <!-- 切换选项卡 -->
        <div class="screen-tabs reveal" role="tablist" aria-label="软件界面预览选项卡">
          <button class="filter active" data-screen="desktop" role="tab" aria-selected="true">
            🗄️ 侧边收纳盒与桌面看板
          </button>
          <button class="filter" data-screen="peek" role="tab" aria-selected="false">
            🖥️ TopPeekDock 顶部速览
          </button>
          <button class="filter" data-screen="novadisk" role="tab" aria-selected="false">
            💾 NovaDisk 2.0 C盘管家
          </button>
          <button class="filter" data-screen="ocr" role="tab" aria-selected="false">
            📸 截图翻译与离线 OCR
          </button>
          <button class="filter" data-screen="hotkey" role="tab" aria-selected="false">
            🚀 快捷操作与极速搜索
          </button>
        </div>

        <div class="screen-stage reveal">
          <!-- Screen 1: 桌面小组件与侧边收纳 -->
          <div class="screen active" id="screen-desktop">
            <div class="screen-grid-2">
              <div class="screen-img-box">
                <img src="/preview-desktop-widgets.png" alt="天才猫桌面 2.0 真实桌面小组件与侧边把手截图" />
              </div>
              <div class="screen-info">
                <span class="eyebrow">抽屉式收纳 & 桌面看板</span>
                <h3>屏幕边缘吸附把手，桌面彻底清爽</h3>
                <p>
                  如图所示，收纳盒拖到屏幕边缘后自动隐藏为精致微光磨砂把手（屏幕最右侧「📁 文件夹 &lt;」、「📁 AI &lt;」以及顶端「🌐 网站 ˅」），轻触即可顺滑滑出。
                </p>
                <ul class="feature-checklist">
                  <li>多收纳盒智能等距垂直避让排开，绝不重叠</li>
                  <li>支持真实程序与文件的高保真原生图标渲染，杜绝虚假占位</li>
                  <li>壁纸层微光卡片：跳秒时钟、公历农历、实时气温空气指数</li>
                  <li>粉色一键整理胶囊：单击自动按文件格式分类入盒，支持一键撤销</li>
                  <li>精准纪念日看板：倒数日精确到秒，重要日程绝不错过</li>
                </ul>
                <div style="display:flex; gap:10px;">
                  <a class="btn btn-dark" href="#download">体验侧边收纳盒</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Screen 2: TopPeekDock 顶部速览 -->
          <div class="screen" id="screen-peek">
            <div class="screen-grid-2">
              <div class="screen-img-box">
                <img src="/preview-top-peek-dock.png" alt="TopPeekDock 顶部窗口速览 Dock 实机截图" />
              </div>
              <div class="screen-info">
                <span class="eyebrow">TopPeekDock 顶部窗口速览</span>
                <h3>屏幕上沿悬停“偷看”，多任务办公神器</h3>
                <p>
                  如图正上方所示，TopPeekDock 吸附在屏幕正顶端。平时为极简微光点阵胶囊，鼠标碰顶即优雅展开当前正在运行的窗口标签。
                </p>
                <ul class="feature-checklist">
                  <li>鼠标悬停某个窗口标签片刻：临时置顶呈现该窗口画面，移开立即自动复原</li>
                  <li>鼠标单击标签：正式激活并切换至目标工作视窗</li>
                  <li>键盘极速盲操：鼠标悬停在栏上时，← → 依次偷看，1~9 数字键秒切，Enter 确认，Esc 退出</li>
                  <li>拖拽加入：直接将任意正在运行的窗口拖曳至顶部栏松手即可固定</li>
                </ul>
                <div style="display:flex; gap:10px;">
                  <a class="btn btn-dark" href="#download">立即上手 TopPeekDock</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Screen 3: NovaDisk 2.0 C盘管家 -->
          <div class="screen" id="screen-novadisk">
            <div class="screen-grid-2">
              <div>
                <div class="treemap-mock">
                  <div class="treemap-tile tile-wechat">
                    <div>
                      <b>WeChat Files 微信数据</b><br>
                      <span>48.6 GB · 推荐无损搬迁至 D 盘</span>
                    </div>
                    <span style="font-size:10px; background:rgba(0,0,0,0.25); padding:3px 8px; border-radius:6px; align-self:flex-start;">NTFS 软链接保护</span>
                  </div>
                  <div class="treemap-tile tile-system">
                    <b>hiberfil.sys 休眠文件</b>
                    <span>16.0 GB · 可安全精简压缩</span>
                  </div>
                  <div class="treemap-tile tile-cache">
                    <b>WinSxS 系统冗余组件</b>
                    <span>12.4 GB · 可一键安全重置瘦身</span>
                  </div>
                </div>
                <div style="text-align:center; margin-top:14px;">
                  <span style="font-size:12px; color:var(--muted);">▲ 基于 Fluent 2.0 Mica 亚克力圆角磁贴 Treemap 实机演示结构</span>
                </div>
              </div>
              <div class="screen-info">
                <span class="eyebrow">NovaDisk 2.0 新星视盘</span>
                <h3>C 盘空间救星 · 文件夹智能身份证</h3>
                <p>
                  彻底终结误删恐惧！基于 NTFS MFT 硬件级极速秒扫全盘，知识库智能识别每个英文文件夹的来源与用途。
                </p>
                <ul class="feature-checklist">
                  <li>独创 NTFS Junction 软链接搬家：将微信/QQ几十G数据搬到D盘，原路径建软链接，软件无感运行，C盘立省几十G</li>
                  <li>文件夹智能身份证：回答“属于哪款软件？能不能删？删了会怎样？”</li>
                  <li>Dism++ 级系统优化：休眠文件瘦身、WinSxS 安全清理、更新补丁清空</li>
                </ul>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                  <a class="btn btn-dark" href="/novadisk.html" target="_blank">在线体验 NovaDisk 交互页 ↗</a>
                  <a class="btn btn-outline" href="#download">下载桌面完整版</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Screen 4: 截图翻译与离线 OCR -->
          <div class="screen" id="screen-ocr">
            <div class="screen-grid-2">
              <div style="background:#111b18; padding:24px; border-radius:18px; color:#fff;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px; margin-bottom:16px;">
                  <span style="font-size:13px; font-weight:800; color:#00b887;">📸 微信离线 OCR 引擎 · 就绪</span>
                  <span style="font-size:11px; background:rgba(0,184,135,0.2); padding:3px 8px; border-radius:99px; color:#7ff3ce;">零网络消耗 · 隐私加密</span>
                </div>
                <div style="background:rgba(255,255,255,0.06); padding:14px; border-radius:12px; margin-bottom:12px; font-size:12px; line-height:1.6;">
                  <b style="color:#ffe78f;">[原图覆盖翻译示意]</b><br>
                  原文: "Next-generation workspace with edge docking & offline OCR."<br>
                  <span style="color:#6ee7b7; font-weight:700;">译文覆盖: “集成边缘吸附与离线 OCR 的下一代桌面工作台。”</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px;">
                  <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px;">📌 桌面顶层贴图 (Pin)</div>
                  <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px;">📜 智能滚动长截图</div>
                  <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px;">🎞️ 高保真轻量 GIF 录屏</div>
                  <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:10px;">📊 表格结构识别导 Excel</div>
                </div>
              </div>
              <div class="screen-info">
                <span class="eyebrow">专业截图工具链</span>
                <h3>离线本地神经识别，外文一键原地翻译</h3>
                <p>
                  无需打开浏览器翻译网页，按下快捷键截取区域，离线神经网络秒级提取文字并直接在原图位置覆盖渲染翻译。
                </p>
                <ul class="feature-checklist">
                  <li>微信离线底层模型支持，完全脱机运行，绝不上传商业数据</li>
                  <li>支持中、英、日、韩等多语言自然覆盖渲染互译</li>
                  <li>桌面置顶贴图 Pin：截图钉在屏幕最前，边写代码边参考</li>
                  <li>像素级放大镜拾色器：精准取色并一键复制 HEX / RGB</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Screen 5: 快捷操作与极速搜索 -->
          <div class="screen" id="screen-hotkey">
            <div class="screen-grid-2">
              <div style="background:#111b18; padding:24px; border-radius:18px; color:#fff;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                  <span style="font-size:14px; font-weight:800;">快捷键直达槽位 (Alt + 1~9)</span>
                  <span style="font-size:11px; color:#00b887;">全部槽位已自检生效</span>
                </div>
                <div style="display:grid; gap:8px; font-size:12px;">
                  <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.07); padding:10px 14px; border-radius:10px;">
                    <span><b>Alt + 1</b> 微信工作台</span><span style="color:#7ff3ce;">正常</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.07); padding:10px 14px; border-radius:10px;">
                    <span><b>Alt + 2</b> 常用开发项目目录</span><span style="color:#7ff3ce;">正常</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.07); padding:10px 14px; border-radius:10px;">
                    <span><b>Alt + Space</b> Everything64 极速搜索</span><span style="color:#7ff3ce;">毫秒响应</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.07); padding:10px 14px; border-radius:10px;">
                    <span><b>F1</b> 屏幕截图翻译 OCR</span><span style="color:#7ff3ce;">就绪</span>
                  </div>
                </div>
              </div>
              <div class="screen-info">
                <span class="eyebrow">快捷操作中心</span>
                <h3>低延迟系统级响应，告别繁琐寻找</h3>
                <p>
                  为高频工作者量身定制。只需一次快捷键，瞬开程序、打开深层目录或检索全盘文件。
                </p>
                <ul class="feature-checklist">
                  <li>支持 Ctrl / Alt / Shift / Win 任意组合键注册</li>
                  <li>支持绑定多开浏览器独立 Profile，电商运营与开发者多账号神器</li>
                  <li>内置热键健康状态自检，遇冲突或文件丢失主动预警</li>
                  <li>集成 Everything64 核心，索引全盘百万文件毫秒级展现</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 三步轻松上手 -->
    <section class="how" id="how">
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">极简上手三步</p>
            <h2>双击即用，零门槛<em>恢复清爽。</em></h2>
          </div>
        </div>
        <div class="steps">
          <article class="step reveal">
            <span class="step-index">01</span>
            <h3>双击安装 · 免环境开箱即用</h3>
            <p>
              无需提前安装 .NET 运行时或 VC 运行库。下载官方安装包后双击，极速向导全自动配置开箱即用。
            </p>
          </article>
          <article class="step reveal">
            <span class="step-index">02</span>
            <h3>一键整理 · 桌面秒级归类</h3>
            <p>
              点击桌面微光小组件上的“一键整理桌面”，散落的图标与文件按规则自动收纳进分类盒子，且支持随时一键撤销。
            </p>
          </article>
          <article class="step reveal">
            <span class="step-index">03</span>
            <h3>边缘吸附 · 沉浸专注办公</h3>
            <p>
              将收纳盒拖到屏幕左侧或右侧自动化身精致把手，随用随滑出；随时唤出 TopPeekDock 与截图翻译，畅享高效体验。
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- 官方下载中心 (Download Section) -->
    <section class="download" id="download">
      <div class="wrap">
        <div class="download-panel reveal">
          <div class="download-grid">
            <div>
              <p class="eyebrow">官方旗舰发布渠道</p>
              <h2>立即下载天才猫桌面 2.0，<em>开启全新灵动体验。</em></h2>
              <p class="version">正式发行版：v2.0.0 (Windows x64 独立自包含版)</p>

              <div class="download-buttons-group">
                <a class="btn btn-dark main-download-btn" href="/downloads/天才猫桌面-Setup-v2.0.0.exe" download="天才猫桌面-Setup-v2.0.0.exe">
                  <span>
                    <b>🔥 下载官方安装包 (推荐)</b><br>
                    <small style="font-size:11px; opacity:0.8;">内置独立运行时 · 双击极速安装 · ~85.2 MB</small>
                  </span>
                  <span style="font-size:20px;">↓</span>
                </a>

                <a class="btn btn-light main-download-btn" href="/downloads/天才猫桌面-v2.0.0-绿色便携免安装版.rar" download="天才猫桌面-v2.0.0-绿色便携免安装版.rar">
                  <span>
                    <b>📦 绿色便携免安装版</b><br>
                    <small style="font-size:11px; opacity:0.8;">解压即用无需向导 · 适合 U 盘携带 · ~95.2 MB</small>
                  </span>
                  <span style="font-size:20px;">↓</span>
                </a>

                <a class="btn btn-outline" href="/downloads/天才猫桌面2.0.0.exe" download="天才猫桌面2.0.0.exe" style="justify-content:center;">
                  <span>便捷同名安装包备用下载</span>
                </a>
              </div>

              <p class="download-note">
                💡 <b>100% 绿色纯净</b>：无广告无弹窗、不收集个人隐私文件。自带签名校验，支持在线增量热更新与无缝平滑升级。
              </p>
              <div class="download-toast" id="downloadToast" role="status"></div>
            </div>

            <!-- 系统要求与更新说明 -->
            <div class="requirements">
              <h3>环境与技术保障</h3>
              <div class="req-row">
                <b>操作系统</b>Windows 10 (19041 或更高版本) / Windows 11 (64位)
              </div>
              <div class="req-row">
                <b>运行环境</b><span style="color:#00b887; font-weight:700;">内置完全独立 .NET 运行时，目标电脑零依赖免装库</span>
              </div>
              <div class="req-row">
                <b>内存与空间</b>建议 4GB 以上内存 · 安装占用约 220MB 硬盘空间
              </div>
              <div class="req-row">
                <b>渲染引擎</b>原生 DirectWrite / GDI+ 亚克力流光抗锯齿
              </div>
              <div class="changelog">
                <b>2.0.0 核心更新日志：</b><br>
                • 全新抽屉式侧边吸附把手与防重叠避让算法上线；<br>
                • 新增微信离线 OCR 核心与原图覆盖式多语翻译；<br>
                • NovaDisk 2.0 C盘管家支持 NTFS Junction 无损搬家；<br>
                • 升级 TopPeekDock 顶部窗口速览，支持键盘盲操偷看；<br>
                • 新增桌面天气跳秒时钟与纪念日精准倒计时看板。
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 版本与方案规划 -->
    <section class="pricing" id="pricing">
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">版本方案说明</p>
            <h2>个人完全免费，<em>团队定制支持。</em></h2>
          </div>
          <p class="section-note">
            核心基础能力对个人日常办公用户永久开放，让更多 Windows 用户享受到高效灵动的桌面体验。
          </p>
        </div>

        <div class="price-grid">
          <!-- 免费版 -->
          <article class="price-card reveal">
            <span class="plan-tag">日常个人使用</span>
            <h3>标准版</h3>
            <div class="amount">
              <span class="currency">¥</span>
              <span class="number">0</span>
              <span class="period">/ 永久免费</span>
            </div>
            <ul>
              <li>抽屉式侧边收纳盒 (无限数量)</li>
              <li>壁纸层跳秒时钟、今日待办与纪念日</li>
              <li>一键桌面智能整理与随时撤销</li>
              <li>微信离线高精 OCR 文本识别</li>
              <li>治愈系灵动桌宠交互模式</li>
              <li>Everything64 全盘极速检索</li>
            </ul>
            <a class="btn btn-outline" href="#download">立即免费使用</a>
          </article>

          <!-- 专业旗舰版 -->
          <article class="price-card pro reveal">
            <span class="plan-tag">极客与高频办公</span>
            <h3>专业旗舰版</h3>
            <div class="amount">
              <span class="currency">¥</span>
              <span class="number">59</span>
              <span class="period">/ 终身买断</span>
            </div>
            <ul>
              <li>包含免费版全部功能</li>
              <li>NovaDisk 2.0 NTFS 软链接无损搬迁全功能</li>
              <li>TopPeekDock 顶部窗口速览无限制固定</li>
              <li>原图覆盖式多语言即时翻译</li>
              <li>滚动长截图与高保真 GIF 动图录制</li>
              <li>支持多开独立浏览器 Profile 专属快捷绑定</li>
              <li>终身版本优先升级与技术支持</li>
            </ul>
            <a class="btn btn-dark" href="#download">体验旗舰全功能</a>
          </article>

          <!-- 团队定制版 -->
          <article class="price-card reveal">
            <span class="plan-tag">企业与团队定制</span>
            <h3>企业定制版</h3>
            <div class="amount">
              <span class="currency">¥</span>
              <span class="number">199</span>
              <span class="period">/ 席位买断</span>
            </div>
            <ul>
              <li>包含专业旗舰版全部功能</li>
              <li>支持企业专属品牌 LOGO 与图标定制</li>
              <li>统一预置业务系统快捷键与分身环境</li>
              <li>局域网离线私有化升级部署支持</li>
              <li>1 对 1 专属技术顾问与需求快速响应</li>
            </ul>
            <a class="btn btn-outline" href="mailto:support@geniuscat.com">联系团队定制</a>
          </article>
        </div>
      </div>
    </section>

    <!-- 真实体验场景反馈 (Notes Carousel) -->
    <section class="notes">
      <div class="wrap carousel-shell">
        <div class="reveal">
          <p class="eyebrow">真实用户反馈</p>
          <h2>听听效率达人们<em>怎么说。</em></h2>
          <div class="carousel-controls">
            <button class="round-btn" id="prevQuote" aria-label="上一条评价">←</button>
            <button class="round-btn" id="nextQuote" aria-label="下一条评价">→</button>
          </div>
          <div class="dots" id="dots" aria-label="选择评价"></div>
        </div>

        <div class="quote-stage reveal" id="quoteStage">
          <article class="quote active">
            <span class="quote-mark">“</span>
            <blockquote>
              以前桌面堆满了各种临时工程文件和安装包，用天才猫拖到屏幕右边变成两个极简小把手，随用随滑出，桌面瞬间比全新买的电脑还干净！
            </blockquote>
            <div class="quote-person">
              <div class="quote-avatar">👨‍💻</div>
              <div>
                <strong>李晨 · 全栈工程师</strong>
                <span>重度 Windows 开发者 / 多显示器用户</span>
              </div>
            </div>
          </article>

          <article class="quote">
            <span class="quote-mark">“</span>
            <blockquote>
              C 盘微信聊天记录占了快 60G，一直不敢删。NovaDisk 的无损软链接搬家一键帮我移到了 D 盘，微信正常读写，C 盘直接空出一大半，太神了！
            </blockquote>
            <div class="quote-person">
              <div class="quote-avatar">💼</div>
              <div>
                <strong>陈晓琳 · 商务总监</strong>
                <span>长期受 C 盘爆满红色告警困扰的职场用户</span>
              </div>
            </div>
          </article>

          <article class="quote">
            <span class="quote-mark">“</span>
            <blockquote>
              看外文设计稿和 PDF 时，按快捷键直接原图覆盖翻译，而且是离线算的不怕泄露公司商业素材。顶部速览 Dock 临时偷看窗口也省了大量 Alt+Tab！
            </blockquote>
            <div class="quote-person">
              <div class="quote-avatar">🎨</div>
              <div>
                <strong>张宇 · UI/UX 资深设计师</strong>
                <span>注重设计质感与视觉交互体验</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- 常见问题 (FAQ) -->
    <section class="faq" id="faq">
      <div class="wrap">
        <div class="section-head reveal">
          <div>
            <p class="eyebrow">疑难解答速查</p>
            <h2>下载之前，先了解<em>这些细节。</em></h2>
          </div>
        </div>

        <div class="faq-list reveal">
          <div class="faq-item">
            <button class="faq-q" aria-expanded="false">
              <span>为什么天才猫桌面 2.0 不需要提前安装 .NET 或 C++ 运行库？</span>
              <span>+</span>
            </button>
            <div class="faq-a">
              <div>
                <p>
                  天才猫桌面 2.0 编译采用微软官方 <code>win-x64 --self-contained true</code> 独立自包含模式打包，所有 CoreCLR 运行时内核、系统依赖库与模型文件均已完整内嵌在程序包中。在任意一台全新的纯净 Windows 10/11 电脑上，直接双击安装包即可直接启动运行，绝不弹窗报错缺失运行库组件。
                </p>
              </div>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-q" aria-expanded="false">
              <span>C 盘管家的“无损软链接搬迁”安全吗？会损坏微信或游戏数据吗？</span>
              <span>+</span>
            </button>
            <div class="faq-a">
              <div>
                <p>
                  100% 绝对安全。该技术基于 Windows 原生 NTFS Junction 软链接技术（符号链接代理机制）。迁移过程中会自动完成数据完整性校验，在 D 盘建立副本后，在 C 盘原位置建立透明系统符号链接。系统底层和微信等软件访问时完全无感知，就像依然在 C 盘一样，既不会丢失聊天记录，又实打实释放了 C 盘空间。
                </p>
              </div>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-q" aria-expanded="false">
              <span>收纳盒收在侧边，会和系统任务栏或全屏游戏冲突吗？</span>
              <span>+</span>
            </button>
            <div class="faq-a">
              <div>
                <p>
                  完全不会。侧边把手宽度仅 30 像素，支持多个盒子智能计算间距垂直避让排开。当您运行全屏游戏或播放全屏视频时，把手会自动降低层级避让；此外，您还可以按住把手自由上下拖动调整到最顺手的位置。
                </p>
              </div>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-q" aria-expanded="false">
              <span>截图翻译与离线 OCR 识别会消耗流量或泄露隐私吗？</span>
              <span>+</span>
            </button>
            <div class="faq-a">
              <div>
                <p>
                  不会。核心 OCR 提取完全由内嵌的离线神经网络引擎在您的本地电脑 CPU/内存中计算，整个过程不发起任何外部网络请求，保障办公合同、敏感代码与隐私图文零泄露风险。
                </p>
              </div>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-q" aria-expanded="false">
              <span>如果不习惯使用桌宠，可以随时关掉换回经典主页吗？</span>
              <span>+</span>
            </button>
            <div class="faq-a">
              <div>
                <p>
                  完全可以。右键小猫即可选择“切换为主页面板模式”，或在右上角直接点击“喵喵 开关”进行一键切回。软件提供高度自由的个性化设置，桌宠、时钟、待办、顶部 Dock 均可独立按需开关。
                </p>
              </div>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-q" aria-expanded="false">
              <span>后续日常有新版本时，该如何更新升级？</span>
              <span>+</span>
            </button>
            <div class="faq-a">
              <div>
                <p>
                  软件支持增量热更新与覆盖安装升级。您不仅可以在软件设置中心一键检查更新，也可以随时在本官网重新下载最新版安装包直接覆盖安装，您的收纳盒配置与待办数据将完整妥善保留。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Banner -->
    <section class="final">
      <div class="final-panel reveal">
        <h2>今天起，给您的 Windows 桌面<em>换一种从容的打开方式。</em></h2>
        <div>
          <div class="final-actions">
            <a class="btn btn-light" href="#download">免费下载 Windows 官方旗舰版</a>
            <a class="btn btn-outline" href="/novadisk.html" target="_blank" style="border-color:rgba(255,255,255,0.4); color:#fff;">
              体验 NovaDisk C盘管家演示
            </a>
          </div>
          <p class="final-note">
            适用系统：Windows 10 / Windows 11 (64位) · 完全独立内置运行库 · 纯净无广告
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer>
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <div class="footer-name">
              <img src="/app.ico" alt="logo" style="width:22px; height:22px; border-radius:6px;" />
              <span>天才猫桌面 2.0</span>
            </div>
            <p class="footer-note">
              下一代 Windows 灵动桌面中枢与效率管家。以现代科技与艺术质感，重构桌面秩序，释放无限生产力。
            </p>
          </div>

          <div class="footer-col">
            <h4>核心特性</h4>
            <a href="#features">抽屉式侧边收纳</a>
            <a href="#screens">TopPeekDock 顶部速览</a>
            <a href="#novadisk">NovaDisk 2.0 C盘管家</a>
            <a href="#screens">微信离线 OCR 识别</a>
            <a href="#screens">原图覆盖多语翻译</a>
          </div>

          <div class="footer-col">
            <h4>下载与支持</h4>
            <a href="/downloads/天才猫桌面-Setup-v2.0.0.exe" download>Windows 官方安装包</a>
            <a href="/downloads/天才猫桌面-v2.0.0-绿色便携免安装版.rar" download>绿色便携免安装版</a>
            <a href="/novadisk.html" target="_blank">在线体验 C盘管家</a>
            <a href="#faq">常见问题与答疑</a>
            <a href="/articles.html">使用指南与技巧</a>
          </div>

          <div class="footer-col">
            <h4>关于与合规</h4>
            <a href="#">关于天才猫工作室</a>
            <a href="#">隐私权保护政策</a>
            <a href="#">用户许可协议</a>
            <a href="mailto:support@geniuscat.com">联系我们反馈</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>Copyright &copy; 2026 天才猫官方工作室 (GeniusCat Desktop). All Rights Reserved.</span>
          <span>独立自包含部署 · 纯净绿色安全 · 开箱即用</span>
        </div>
      </div>
    </footer>
  </main>

  <!-- Interactive JavaScript Engine -->
  <script>
    (function(){{
      var nav = document.getElementById('nav');
      var menu = document.getElementById('menuBtn');
      var heroVideo = document.getElementById('heroVideo');

      // 1. Navigation Scroll Effect
      function onScroll() {{
        var sc = window.scrollY || document.documentElement.scrollTop;
        if (nav) nav.classList.toggle('scrolled', sc > 24);
        if (heroVideo && window.innerWidth > 700 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
          heroVideo.style.transform = 'translateY(' + (sc * 0.08) + 'px) scale(' + (1.04 + Math.min(sc / 20000, 0.035)) + ')';
        }}
      }}
      window.addEventListener('scroll', onScroll, {{ passive: true }});
      onScroll();

      // 2. Mobile Menu Toggle
      if (menu && nav) {{
        menu.addEventListener('click', function() {{
          var open = nav.classList.toggle('open');
          menu.setAttribute('aria-expanded', String(open));
          menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
        }});
        document.querySelectorAll('.nav-links a').forEach(function(a) {{
          a.addEventListener('click', function() {{
            nav.classList.remove('open');
            menu.setAttribute('aria-expanded', 'false');
          }});
        }});
      }}

      // 3. Reveal Animations on Scroll
      var io = new IntersectionObserver(function(entries) {{
        entries.forEach(function(e) {{
          if (e.isIntersecting) {{
            e.target.classList.add('in');
            io.unobserve(e.target);
          }}
        }});
      }}, {{ threshold: 0.12 }});

      document.querySelectorAll('.reveal').forEach(function(el, i) {{
        el.style.transitionDelay = (i % 4) * 70 + 'ms';
        io.observe(el);
      }});

      // 4. 3D Tilt on Feature Cards
      if (window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {{
        document.querySelectorAll('.feature-card').forEach(function(card) {{
          card.addEventListener('mousemove', function(e) {{
            var r = card.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = 'rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 7) + 'deg) translateY(-3px)';
          }});
          card.addEventListener('mouseleave', function() {{
            card.style.transform = '';
          }});
        }});
      }}

      // 5. Interactive Screen Showcase Switcher
      document.querySelectorAll('[data-screen]').forEach(function(btn) {{
        btn.addEventListener('click', function() {{
          var screenId = btn.dataset.screen;
          document.querySelectorAll('[data-screen]').forEach(function(b) {{
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          }});
          document.querySelectorAll('.screen').forEach(function(s) {{
            s.classList.remove('active');
          }});
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          var targetScreen = document.getElementById('screen-' + screenId);
          if (targetScreen) targetScreen.classList.add('active');
        }});
      }});

      // 6. Testimonial Quote Carousel
      var quotes = [].slice.call(document.querySelectorAll('.quote'));
      var dotsContainer = document.getElementById('dots');
      var qi = 0;
      var timer;

      function showQuote(n) {{
        if (!quotes.length) return;
        qi = (n + quotes.length) % quotes.length;
        quotes.forEach(function(q, i) {{
          q.classList.toggle('active', i === qi);
        }});
        if (dotsContainer) {{
          dotsContainer.querySelectorAll('.dot').forEach(function(d, i) {{
            d.classList.toggle('active', i === qi);
          }});
        }}
        restartCarousel();
      }}

      if (dotsContainer && quotes.length) {{
        quotes.forEach(function(_, i) {{
          var d = document.createElement('button');
          d.className = 'dot' + (i === 0 ? ' active' : '');
          d.setAttribute('aria-label', '查看第 ' + (i + 1) + ' 条评价');
          d.addEventListener('click', function() {{ showQuote(i); }});
          dotsContainer.appendChild(d);
        }});
      }}

      function restartCarousel() {{
        clearInterval(timer);
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && quotes.length > 1) {{
          timer = setInterval(function() {{ showQuote(qi + 1); }}, 6500);
        }}
      }}

      var prevBtn = document.getElementById('prevQuote');
      var nextBtn = document.getElementById('nextQuote');
      if (prevBtn) prevBtn.addEventListener('click', function() {{ showQuote(qi - 1); }});
      if (nextBtn) nextBtn.addEventListener('click', function() {{ showQuote(qi + 1); }});
      restartCarousel();

      // 7. FAQ Accordion Toggle
      document.querySelectorAll('.faq-q').forEach(function(q) {{
        q.addEventListener('click', function() {{
          var item = q.parentElement;
          var open = item.classList.toggle('open');
          q.setAttribute('aria-expanded', String(open));
        }});
      }});
    }})();
  </script>
</body>
</html>
'''

with open(output_path, "w", encoding="utf-8") as f:
    f.write(custom_html)

print(f"Successfully generated GeniusCat Desktop 2.0 homepage to: {output_path}")
print(f"File size: {os.path.getsize(output_path)} bytes")
