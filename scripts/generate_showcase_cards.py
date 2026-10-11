#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate uniform 1200x750 (16:10) high-DPI feature showcase graphics
for Genius Cat Desktop (天才猫桌面 2.0).
Eliminates raw, mismatched, cluttered screenshots in favor of studio-grade assets.
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = r"f:\AI\cf-down"
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
UPLOADED_DIR = r"C:\Users\miguo\.gemini\antigravity\brain\ca07a2c0-1b1c-4657-bb1a-fa8f11b382c4\.user_uploaded"

FONT_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_REG = r"C:\Windows\Fonts\msyh.ttc"

def get_font(size=16, bold=True):
    path = FONT_BOLD if bold else FONT_REG
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def make_bg(w=1200, h=750, top_color=(10, 15, 26), bot_color=(5, 8, 14),
            glow_color=(35, 85, 140), glow_center=(600, 340), glow_radius=480, glow_intensity=0.75):
    """Creates a studio dark canvas with smooth gradient and radial ambient backlight."""
    arr = np.zeros((h, w, 3), dtype=np.float32)
    for y in range(h):
        t = y / (h - 1)
        r = top_color[0] * (1 - t) + bot_color[0] * t
        g = top_color[1] * (1 - t) + bot_color[1] * t
        b = top_color[2] * (1 - t) + bot_color[2] * t
        arr[y, :, :] = [r, g, b]
    
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - glow_center[0])**2 + (Y - glow_center[1])**2)
    glow_factor = np.clip(1.0 - dist / glow_radius, 0.0, 1.0)
    glow_factor = np.power(glow_factor, 1.7)
    
    for c in range(3):
        arr[:, :, c] += glow_color[c] * glow_factor * glow_intensity
    
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr).convert("RGBA")

def round_corners(im, radius=18):
    im = im.convert("RGBA")
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, w, h], radius=radius, fill=255)
    res = im.copy()
    res.putalpha(mask)
    return res

def add_border(im, radius=18, border_color=(255, 255, 255, 35), border_width=1):
    w, h = im.size
    border_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(border_layer)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, outline=border_color, width=border_width)
    res = Image.alpha_composite(im, border_layer)
    return res

def add_drop_shadow(im, shadow_radius=25, offset=(0, 12), shadow_color=(0, 0, 0, 180)):
    w, h = im.size
    pad = shadow_radius * 2
    canvas_w = w + pad * 2
    canvas_h = h + pad * 2
    
    alpha = im.split()[3]
    shadow_mask = Image.new("L", (canvas_w, canvas_h), 0)
    sx = pad + offset[0]
    sy = pad + offset[1]
    shadow_mask.paste(alpha, (sx, sy))
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(shadow_radius))
    
    shadow_img = Image.new("RGBA", (canvas_w, canvas_h), shadow_color[:3] + (0,))
    shadow_arr = np.array(shadow_img)
    mask_arr = np.array(shadow_mask)
    shadow_arr[:, :, 3] = (mask_arr * (shadow_color[3] / 255.0)).astype(np.uint8)
    shadow = Image.fromarray(shadow_arr)
    
    shadow.paste(im, (pad, pad), im)
    return shadow, pad

def draw_pill(draw, x, y, text, font=None, bg=(18, 25, 42, 235), border=(60, 100, 160, 180),
              text_color=(240, 245, 255), dot_color=(45, 212, 191), pad_x=16, pad_y=8):
    """Draws a pill badge with a colored indicator dot instead of unsupported emoji glyphs."""
    if font is None:
        font = get_font(14, bold=True)
    
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    dot_r = 4
    has_dot = dot_color is not None
    dot_space = (dot_r * 2 + 10) if has_dot else 0
    
    w = tw + pad_x * 2 + dot_space
    h = th + pad_y * 2
    
    # Pill background
    draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=bg, outline=border, width=1)
    
    # Dot
    if has_dot:
        dot_x = x + pad_x + dot_r
        dot_y = y + h // 2
        draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=dot_color)
    
    # Text
    text_x = x + pad_x + dot_space
    draw.text((text_x, y + pad_y - bbox[1]), text, font=font, fill=text_color)
    return w, h

# ============================================================
# 1. card-top-dock.png (顶部窗口速览 Top Peek Dock)
# ============================================================
def build_card_top_dock():
    bg = make_bg(1200, 750, top_color=(8, 14, 26), bot_color=(4, 7, 13),
                 glow_color=(35, 115, 195), glow_center=(600, 90), glow_radius=480, glow_intensity=0.85)
    
    # 顶部微弱屏幕边框与阴影
    d_bg = ImageDraw.Draw(bg)
    d_bg.rectangle([0, 0, 1200, 18], fill=(12, 18, 30, 255))
    d_bg.line([(0, 18), (1200, 18)], fill=(255, 255, 255, 25), width=1)
    
    # 裁剪并放大原始Top Dock
    src_dock_path = os.path.join(UPLOADED_DIR, "media_1791700837529_dc0c8619.png")
    src_dock = Image.open(src_dock_path)
    dock_crop = src_dock.crop((205, 0, 705, 45))  # w=500, h=45
    dw, dh = int(500 * 1.35), int(45 * 1.35)
    dock_scaled = dock_crop.resize((dw, dh), Image.Resampling.LANCZOS)
    dock_scaled = round_corners(dock_scaled, radius=12)
    dock_scaled = add_border(dock_scaled, radius=12, border_color=(255, 255, 255, 50), border_width=1)
    
    dock_shadow, dpad = add_drop_shadow(dock_scaled, shadow_radius=18, offset=(0, 6), shadow_color=(0, 0, 0, 200))
    dock_x = (1200 - dw) // 2
    dock_y = 18
    bg.paste(dock_shadow, (dock_x - dpad, dock_y - dpad), dock_shadow)
    
    # 在Dock下方绘制“鼠标悬浮激活的实时窗口速览卡片 (Live Peek Card)”
    peek_w, peek_h = 620, 380
    peek_x = (1200 - peek_w) // 2
    peek_y = dock_y + dh + 48
    
    peek = Image.new("RGBA", (peek_w, peek_h), (16, 24, 40, 245))
    d_peek = ImageDraw.Draw(peek)
    
    # 标题栏
    d_peek.rounded_rectangle([0, 0, peek_w, 38], radius=14, fill=(24, 34, 56, 255))
    d_peek.rectangle([0, 24, peek_w, 38], fill=(24, 34, 56, 255))
    d_peek.line([(0, 38), (peek_w, 38)], fill=(255, 255, 255, 30), width=1)
    d_peek.ellipse([14, 13, 24, 23], fill=(239, 68, 68, 220))
    d_peek.ellipse([30, 13, 40, 23], fill=(245, 158, 11, 220))
    d_peek.ellipse([46, 13, 56, 23], fill=(16, 185, 129, 220))
    
    font_title = get_font(13, bold=True)
    d_peek.text((68, 11), "天才猫桌面 2.0 · 官方主页实时速览 (光标悬浮已激活)", font=font_title, fill=(210, 220, 240))
    
    desktop_full_path = os.path.join(PUBLIC_DIR, "ui-desktop-full.png")
    if os.path.exists(desktop_full_path):
        preview_src = Image.open(desktop_full_path).convert("RGBA")
        pw, ph = peek_w - 16, peek_h - 48
        preview_fitted = preview_src.resize((pw, ph), Image.Resampling.LANCZOS)
        preview_fitted = round_corners(preview_fitted, radius=8)
        peek.paste(preview_fitted, (8, 42), preview_fitted)
    
    peek = round_corners(peek, radius=16)
    peek = add_border(peek, radius=16, border_color=(255, 255, 255, 45), border_width=1)
    peek_shadow, ppad = add_drop_shadow(peek, shadow_radius=32, offset=(0, 16), shadow_color=(0, 0, 0, 220))
    bg.paste(peek_shadow, (peek_x - ppad, peek_y - ppad), peek_shadow)
    
    # 重新获取draw句柄
    d_bg = ImageDraw.Draw(bg)
    tab_center_x = dock_x + 120
    d_bg.line([(tab_center_x, dock_y + dh), (tab_center_x, peek_y - 2)], fill=(45, 212, 191, 160), width=2)
    d_bg.ellipse([tab_center_x - 4, peek_y - 6, tab_center_x + 4, peek_y + 2], fill=(45, 212, 191, 255))
    
    # 模拟鼠标光标
    cur_x, cur_y = tab_center_x - 10, dock_y + 18
    cur_pts = [(cur_x, cur_y), (cur_x, cur_y + 18), (cur_x + 5, cur_y + 14), (cur_x + 10, cur_y + 22),
               (cur_x + 13, cur_y + 20), (cur_x + 8, cur_y + 12), (cur_x + 14, cur_y + 12)]
    d_bg.polygon(cur_pts, fill=(255, 255, 255, 255), outline=(0, 0, 0, 200))
    
    # 功能标签气泡 (Pills)
    draw_pill(d_bg, 80, 570, "光标经过秒切窗口 · 零点击直达", dot_color=(45, 212, 191),
              bg=(16, 28, 48, 240), border=(45, 212, 191, 180), text_color=(230, 255, 250))
    draw_pill(d_bg, 440, 570, "键盘 ← → 方向键 · 极速走马灯轮播", dot_color=(168, 85, 247),
              bg=(28, 22, 44, 240), border=(168, 85, 247, 180), text_color=(250, 235, 255))
    draw_pill(d_bg, 820, 570, "贴顶隐形常驻 · 零挤占工作显示区", dot_color=(59, 130, 246),
              bg=(18, 26, 40, 240), border=(59, 130, 246, 180), text_color=(230, 240, 255))
    
    draw_pill(d_bg, (1200 - 360) // 2, 650, "多任务一键新建 · 媲美专业工作台", dot_color=(245, 200, 110),
              bg=(24, 20, 14, 240), border=(245, 200, 110, 160), text_color=(250, 235, 200))
    
    out_path = os.path.join(PUBLIC_DIR, "card-top-dock.png")
    bg.convert("RGB").save(out_path, quality=95)
    print(f"Generated: {out_path}")

# ============================================================
# 2. card-hotkeys.png (快捷键中心 Hotkeys Center)
# ============================================================
def build_card_hotkeys():
    bg = make_bg(1200, 750, top_color=(14, 16, 26), bot_color=(6, 8, 14),
                 glow_color=(195, 140, 45), glow_center=(600, 360), glow_radius=460, glow_intensity=0.7)
    
    src_hotkey_path = os.path.join(UPLOADED_DIR, "media_1791705704276_d3d540c9.png")
    src = Image.open(src_hotkey_path).convert("RGBA")
    
    win = round_corners(src, radius=18)
    win = add_border(win, radius=18, border_color=(255, 255, 255, 45), border_width=1)
    win_shadow, pad = add_drop_shadow(win, shadow_radius=32, offset=(0, 16), shadow_color=(0, 0, 0, 220))
    
    wx = (1200 - 820) // 2
    wy = 135
    bg.paste(win_shadow, (wx - pad, wy - pad), win_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, (1200 - 460) // 2, 55, "Alt + 1 ~ 9 秒开常用软件 · 再按一下立即收起", dot_color=(245, 200, 110),
              bg=(32, 24, 12, 245), border=(245, 200, 110, 220), text_color=(255, 240, 210))
    
    draw_pill(d_bg, 80, 615, "桌面图标拖入卡片 · 瞬间绑定", dot_color=(59, 130, 246),
              bg=(16, 28, 48, 240), border=(59, 130, 246, 180), text_color=(225, 240, 255))
    draw_pill(d_bg, 440, 615, "前 4 个自动映射至桌面主控盒", dot_color=(45, 212, 191),
              bg=(16, 32, 28, 240), border=(45, 212, 191, 180), text_color=(220, 255, 245))
    draw_pill(d_bg, 800, 615, "支持任意组合键 / 常用网址 / 命令", dot_color=(168, 85, 247),
              bg=(26, 20, 36, 240), border=(168, 85, 247, 180), text_color=(245, 230, 255))
    
    out_path = os.path.join(PUBLIC_DIR, "card-hotkeys.png")
    bg.convert("RGB").save(out_path, quality=95)
    print(f"Generated: {out_path}")

# ============================================================
# 3. card-alchemy.png (桌面炼金盒 Desktop Alchemy Box)
# ============================================================
def build_card_alchemy():
    bg = make_bg(1200, 750, top_color=(10, 15, 28), bot_color=(5, 8, 15),
                 glow_color=(45, 125, 165), glow_center=(560, 360), glow_radius=480, glow_intensity=0.8)
    
    src_path = os.path.join(UPLOADED_DIR, "media_1791705845243_355026e0.png")
    src = Image.open(src_path).convert("RGBA")
    
    # 裁剪 8 大神技子菜单
    sub = src.crop((45, 235, 290, 530))
    sub_w, sub_h = int(245 * 1.15), int(295 * 1.15)
    sub_scaled = sub.resize((sub_w, sub_h), Image.Resampling.LANCZOS)
    sub_scaled = round_corners(sub_scaled, radius=18)
    sub_scaled = add_border(sub_scaled, radius=18, border_color=(255, 255, 255, 55), border_width=1)
    
    # 裁剪主菜单
    main = src.crop((270, 115, 515, 525))
    main_w, main_h = int(245 * 1.15), int(410 * 1.15)
    main_scaled = main.resize((main_w, main_h), Image.Resampling.LANCZOS)
    main_scaled = round_corners(main_scaled, radius=18)
    main_scaled = add_border(main_scaled, radius=18, border_color=(255, 255, 255, 55), border_width=1)
    
    sub_shadow, spad = add_drop_shadow(sub_scaled, shadow_radius=28, offset=(-4, 14), shadow_color=(0, 0, 0, 220))
    main_shadow, mpad = add_drop_shadow(main_scaled, shadow_radius=32, offset=(6, 16), shadow_color=(0, 0, 0, 220))
    
    main_x, main_y = 530, 130
    sub_x, sub_y = 230, 190
    
    bg.paste(main_shadow, (main_x - mpad, main_y - mpad), main_shadow)
    bg.paste(sub_shadow, (sub_x - spad, sub_y - spad), sub_shadow)
    
    cat_path = os.path.join(PUBLIC_DIR, "desktop-logo.png")
    if os.path.exists(cat_path):
        cat = Image.open(cat_path).convert("RGBA").resize((170, 170), Image.Resampling.LANCZOS)
        cat_shadow, cpad = add_drop_shadow(cat, shadow_radius=22, offset=(0, 10), shadow_color=(0, 0, 0, 190))
        bg.paste(cat_shadow, (840 - cpad, 440 - cpad), cat_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, (1200 - 450) // 2, 50, "桌面炼金盒 · 8 大文件神技随手即得", dot_color=(45, 212, 191),
              bg=(16, 32, 40, 245), border=(45, 212, 191, 200), text_color=(230, 255, 250))
    
    draw_pill(d_bg, 35, 140, "多页 PDF 文档 → 每页超清图片", dot_color=(59, 130, 246),
              bg=(18, 24, 38, 235), border=(59, 130, 246, 170), text_color=(220, 240, 255))
    draw_pill(d_bg, 35, 350, "相机大原片 → 智能瘦身 70%", dot_color=(52, 211, 153),
              bg=(18, 30, 26, 235), border=(52, 211, 153, 170), text_color=(220, 255, 240))
    draw_pill(d_bg, 35, 550, "截图扫描件 → OCR 高精提取文字", dot_color=(245, 200, 110),
              bg=(30, 24, 14, 235), border=(245, 200, 110, 170), text_color=(255, 240, 210))
    
    draw_pill(d_bg, 840, 170, "专注 25 分钟番茄时钟", dot_color=(244, 63, 94),
              bg=(28, 18, 30, 235), border=(244, 63, 94, 170), text_color=(255, 230, 235))
    draw_pill(d_bg, 840, 270, "剪贴板历史 Ctrl + `", dot_color=(168, 85, 247),
              bg=(22, 18, 36, 235), border=(168, 85, 247, 170), text_color=(245, 230, 255))
    draw_pill(d_bg, 840, 370, "随手记录桌面待办", dot_color=(14, 165, 233),
              bg=(16, 26, 38, 235), border=(14, 165, 233, 170), text_color=(230, 245, 255))
    
    draw_pill(d_bg, (1200 - 420) // 2, 650, "日常文件免开大型软件 · 右键一键秒解", dot_color=(245, 200, 110),
              bg=(15, 20, 32, 230), border=(255, 255, 255, 60), text_color=(240, 240, 240))
    
    out_path = os.path.join(PUBLIC_DIR, "card-alchemy.png")
    bg.convert("RGB").save(out_path, quality=95)
    print(f"Generated: {out_path}")

# ============================================================
# 4. card-screenshot.png (高能截图与贴图 Screenshot & Workflow)
# ============================================================
def build_card_screenshot():
    bg = make_bg(1200, 750, top_color=(10, 14, 25), bot_color=(5, 7, 13),
                 glow_color=(35, 115, 150), glow_center=(560, 350), glow_radius=480, glow_intensity=0.8)
    
    sel_w, sel_h = 760, 420
    sel_x, sel_y = 60, 125
    
    sel_box = Image.new("RGBA", (sel_w, sel_h), (14, 20, 35, 180))
    d_sel = ImageDraw.Draw(sel_box)
    
    d_sel.rectangle([0, 0, sel_w - 1, sel_h - 1], outline=(45, 212, 191, 230), width=2)
    handles = [(0, 0), (sel_w - 10, 0), (0, sel_h - 10), (sel_w - 10, sel_h - 10)]
    for hx, hy in handles:
        d_sel.rectangle([hx, hy, hx + 10, hy + 10], fill=(45, 212, 191, 255))
    
    draw_pill(d_sel, 12, 12, "880 × 520  |  RGB: #2DD4BF", font=get_font(12, bold=True),
              dot_color=(45, 212, 191), bg=(10, 15, 25, 230), border=(45, 212, 191, 180), text_color=(45, 212, 191))
    
    # 马赛克打码区域
    mos_w, mos_h = 320, 95
    mos_x, mos_y = 35, 75
    block_size = 12
    for by in range(0, mos_h, block_size):
        for bx in range(0, mos_w, block_size):
            lum = 40 + int(((bx * 31 + by * 17) % 70))
            d_sel.rectangle([mos_x + bx, mos_y + by, mos_x + bx + block_size - 1, mos_y + by + block_size - 1],
                            fill=(lum - 10, lum + 5, lum + 20, 220), outline=(lum + 10, lum + 25, lum + 40, 180))
    d_sel.rectangle([mos_x, mos_y, mos_x + mos_w, mos_y + mos_h], outline=(245, 158, 11, 220), width=1)
    draw_pill(d_sel, mos_x + 10, mos_y + mos_h + 12, "智能马赛克隐私打码 · 拖选即掩盖", dot_color=(245, 158, 11),
              font=get_font(12, bold=True), bg=(32, 22, 10, 240), border=(245, 158, 11, 200), text_color=(255, 235, 190))
    
    # 划选翻译气泡
    trans_x, trans_y = 35, 230
    trans_w, trans_h = 430, 95
    d_sel.rounded_rectangle([trans_x, trans_y, trans_x + trans_w, trans_y + trans_h], radius=12,
                            fill=(18, 26, 46, 245), outline=(59, 130, 246, 200), width=1)
    font_sm = get_font(12, bold=True)
    font_bold = get_font(13, bold=True)
    d_sel.text((trans_x + 14, trans_y + 10), "划选即时直译 (Alt + CapsLock)", font=font_sm, fill=(96, 165, 250))
    d_sel.text((trans_x + 14, trans_y + 36), "原: Seamless rolling long screenshot & pin to desktop", font=font_sm, fill=(180, 195, 220))
    d_sel.text((trans_x + 14, trans_y + 60), "译: 无缝滚动截长图与桌面置顶贴图比对", font=font_bold, fill=(240, 245, 255))
    
    # 底部悬浮截图工具栏 (无emoji，纯正专业排版)
    tb_w, tb_h = 600, 48
    tb_x, tb_y = (sel_w - tb_w) // 2, sel_h - 58
    d_sel.rounded_rectangle([tb_x, tb_y, tb_x + tb_w, tb_y + tb_h], radius=tb_h // 2,
                            fill=(12, 16, 28, 250), outline=(255, 255, 255, 50), width=1)
    tools = ["矩形", "画笔", "打码 [马赛克]", "长截图", "置顶贴图", "划选翻译", "复制 / 保存"]
    tw_step = tb_w // len(tools)
    for i, t in enumerate(tools):
        tx = tb_x + i * tw_step + (tw_step // 2)
        ty = tb_y + 14
        col = (45, 212, 191) if "打码" in t else (200, 210, 230)
        t_bbox = font_sm.getbbox(t)
        t_w = t_bbox[2] - t_bbox[0]
        d_sel.text((tx - t_w // 2, ty), t, font=font_sm, fill=col)
        if i < len(tools) - 1:
            d_sel.line([(tb_x + (i + 1) * tw_step, tb_y + 10), (tb_x + (i + 1) * tw_step, tb_y + tb_h - 10)],
                       fill=(255, 255, 255, 20), width=1)
    
    sel_box = round_corners(sel_box, radius=16)
    sel_shadow, spad = add_drop_shadow(sel_box, shadow_radius=28, offset=(0, 14), shadow_color=(0, 0, 0, 220))
    bg.paste(sel_shadow, (sel_x - spad, sel_y - spad), sel_shadow)
    
    # 右侧：嵌入真实的“截图与翻译”控制卡片
    tool_card_path = os.path.join(UPLOADED_DIR, "media_1791705868859_5ec4c52a.png")
    if os.path.exists(tool_card_path):
        tc = Image.open(tool_card_path).convert("RGBA")
        tc_w, tc_h = int(335 * 1.05), int(150 * 1.05)
        tc_scaled = tc.resize((tc_w, tc_h), Image.Resampling.LANCZOS)
        tc_scaled = round_corners(tc_scaled, radius=16)
        tc_scaled = add_border(tc_scaled, radius=16, border_color=(255, 255, 255, 50), border_width=1)
        tc_shadow, tpad = add_drop_shadow(tc_scaled, shadow_radius=24, offset=(0, 12), shadow_color=(0, 0, 0, 200))
        bg.paste(tc_shadow, (850 - tpad, 135 - tpad), tc_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, (1200 - 450) // 2, 45, "Ctrl + Alt + A 专业截图 · 打码 / 长截屏 / 贴图全能", dot_color=(244, 63, 94),
              bg=(28, 18, 22, 245), border=(244, 63, 94, 200), text_color=(255, 230, 235))
    
    draw_pill(d_bg, 850, 340, "钉在桌面置顶贴图比对", dot_color=(59, 130, 246),
              bg=(20, 24, 38, 235), border=(59, 130, 246, 170), text_color=(220, 240, 255))
    draw_pill(d_bg, 850, 420, "长网页无缝滚动截长图", dot_color=(52, 211, 153),
              bg=(18, 30, 26, 235), border=(52, 211, 153, 170), text_color=(220, 255, 240))
    draw_pill(d_bg, 850, 500, "Ctrl + ` 剪贴板历史找回", dot_color=(168, 85, 247),
              bg=(26, 18, 36, 235), border=(168, 85, 247, 170), text_color=(245, 230, 255))
    
    draw_pill(d_bg, (1200 - 440) // 2, 650, "截取 / 批注 / 翻译 / 贴图 · 一气呵成的高效心流", dot_color=(45, 212, 191),
              bg=(15, 20, 32, 230), border=(255, 255, 255, 60), text_color=(240, 240, 240))
    
    out_path = os.path.join(PUBLIC_DIR, "card-screenshot.png")
    bg.convert("RGB").save(out_path, quality=95)
    print(f"Generated: {out_path}")

# ============================================================
# 5. card-themes.png (外观与皮肤 Appearance & Themes)
# ============================================================
def build_card_themes():
    bg = make_bg(1200, 750, top_color=(12, 14, 25), bot_color=(6, 7, 14),
                 glow_color=(125, 60, 190), glow_center=(500, 360), glow_radius=480, glow_intensity=0.75)
    
    src_path = os.path.join(PUBLIC_DIR, "preview-appearance-themes.png")
    src = Image.open(src_path).convert("RGBA")
    
    # 裁剪左侧外观设置窗口: (58, 220, 645, 643) -> w=587, h=423
    win = src.crop((58, 220, 645, 643))
    win = round_corners(win, radius=18)
    win = add_border(win, radius=18, border_color=(255, 255, 255, 50), border_width=1)
    win_shadow, wpad = add_drop_shadow(win, shadow_radius=30, offset=(-4, 14), shadow_color=(0, 0, 0, 220))
    
    # 裁剪右侧桌面小组件群: (695, 220, 930, 630) -> w=235, h=410
    widgets = src.crop((695, 220, 930, 630))
    widgets = round_corners(widgets, radius=18)
    widgets = add_border(widgets, radius=18, border_color=(255, 255, 255, 45), border_width=1)
    widgets_shadow, gpad = add_drop_shadow(widgets, shadow_radius=28, offset=(6, 14), shadow_color=(0, 0, 0, 200))
    
    bg.paste(win_shadow, (90 - wpad, 140 - wpad), win_shadow)
    bg.paste(widgets_shadow, (760 - gpad, 140 - gpad), widgets_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, (1200 - 450) // 2, 55, "6 套官方审美皮肤 · 冰川磨砂 / 极光幻紫 / 落日暖橙...", dot_color=(168, 85, 247),
              bg=(26, 18, 38, 245), border=(168, 85, 247, 200), text_color=(250, 235, 255))
    
    draw_pill(d_bg, 140, 620, "边缘呼吸灯提醒 · 提示待办与日程", dot_color=(59, 130, 246),
              bg=(16, 28, 48, 235), border=(59, 130, 246, 170), text_color=(220, 240, 255))
    draw_pill(d_bg, 550, 620, "玻璃浓度、强调色自由微调 · 纯净通透", dot_color=(52, 211, 153),
              bg=(16, 32, 28, 235), border=(52, 211, 153, 170), text_color=(220, 255, 240))
    
    out_path = os.path.join(PUBLIC_DIR, "card-themes.png")
    bg.convert("RGB").save(out_path, quality=95)
    print(f"Generated: {out_path}")

# ============================================================
# 6. card-novadisk.png (NovaDisk 空间管家)
# ============================================================
def build_card_novadisk():
    bg = make_bg(1200, 750, top_color=(8, 16, 24), bot_color=(4, 7, 13),
                 glow_color=(30, 145, 105), glow_center=(600, 360), glow_radius=480, glow_intensity=0.8)
    
    src_path = os.path.join(PUBLIC_DIR, "preview-novadisk-clean.png")
    src = Image.open(src_path).convert("RGBA")
    
    w_fit, h_fit = 960, 580
    win = src.resize((w_fit, h_fit), Image.Resampling.LANCZOS)
    win = round_corners(win, radius=18)
    win = add_border(win, radius=18, border_color=(255, 255, 255, 45), border_width=1)
    win_shadow, pad = add_drop_shadow(win, shadow_radius=32, offset=(0, 16), shadow_color=(0, 0, 0, 220))
    
    wx = (1200 - w_fit) // 2
    wy = 95
    bg.paste(win_shadow, (wx - pad, wy - pad), win_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, (1200 - 450) // 2, 38, "NovaDisk 空间管家 · C 盘大文件可视化分布体检", dot_color=(45, 212, 191),
              bg=(16, 32, 28, 245), border=(45, 212, 191, 200), text_color=(220, 255, 245))
    
    draw_pill(d_bg, 140, 640, "微信 / QQ 聊天数据无损迁移至其他盘 · 安全可逆", dot_color=(59, 130, 246),
              bg=(16, 28, 48, 240), border=(59, 130, 246, 180), text_color=(220, 240, 255))
    draw_pill(d_bg, 680, 640, "系统瘦身 · 一键深度清理临时缓存与更新残留", dot_color=(245, 200, 110),
              bg=(32, 24, 12, 240), border=(245, 200, 110, 180), text_color=(255, 240, 210))
    
    out_path = os.path.join(PUBLIC_DIR, "card-novadisk.png")
    bg.convert("RGB").save(out_path, quality=95)
    print(f"Generated: {out_path}")

# ============================================================
# 7. card-desktop-full.png (桌面实拍全景 Desktop Overview)
# ============================================================
def build_card_desktop_full():
    bg = make_bg(1200, 750, top_color=(8, 12, 22), bot_color=(4, 6, 12),
                 glow_color=(45, 95, 160), glow_center=(600, 360), glow_radius=500, glow_intensity=0.8)
    
    src_path = os.path.join(PUBLIC_DIR, "ui-desktop-full.png")
    src = Image.open(src_path).convert("RGBA")
    
    w_fit, h_fit = 1050, 563
    desk = src.resize((w_fit, h_fit), Image.Resampling.LANCZOS)
    desk = round_corners(desk, radius=18)
    desk = add_border(desk, radius=18, border_color=(255, 255, 255, 45), border_width=1)
    desk_shadow, pad = add_drop_shadow(desk, shadow_radius=32, offset=(0, 16), shadow_color=(0, 0, 0, 220))
    
    dx = (1200 - w_fit) // 2
    dy = 105
    bg.paste(desk_shadow, (dx - pad, dy - pad), desk_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, (1200 - 520) // 2, 42, "天才猫桌面 2.0 运行全景 · 磨砂收纳盒 + 小组件 + 灵动桌宠 + 快捷主控", dot_color=(59, 130, 246),
              bg=(16, 24, 40, 245), border=(59, 130, 246, 200), text_color=(230, 245, 255))
    
    draw_pill(d_bg, (1200 - 450) // 2, 655, "原生级流畅轻巧 · 资源占用极低 · Windows 10/11 深度优化", dot_color=(245, 200, 110),
              bg=(15, 20, 32, 230), border=(255, 255, 255, 60), text_color=(240, 240, 240))
    
    out_path = os.path.join(PUBLIC_DIR, "card-desktop-full.png")
    bg.convert("RGB").save(out_path, quality=95)
    print(f"Generated: {out_path}")

if __name__ == "__main__":
    build_card_top_dock()
    build_card_hotkeys()
    build_card_alchemy()
    build_card_screenshot()
    build_card_themes()
    build_card_novadisk()
    build_card_desktop_full()
    print("All 7 cards regenerated with zero tofu boxes!")
