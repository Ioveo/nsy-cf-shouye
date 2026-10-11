#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate uniform 1200x750 (16:10) high-DPI feature showcase graphics
for Genius Cat Desktop (天才猫桌面 2.0).
FULL-BLEED / MACRO-ZOOM: Eliminates empty dark margins so the UI fills 92%~96% of the canvas.
Applies Lanczos upscaling and unsharp-mask sharpening to make every text label razor sharp.
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
            glow_color=(35, 85, 140), glow_center=(600, 375), glow_radius=520, glow_intensity=0.85):
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
    glow_factor = np.power(glow_factor, 1.6)
    
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

def add_border(im, radius=18, border_color=(255, 255, 255, 45), border_width=1):
    w, h = im.size
    border_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(border_layer)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, outline=border_color, width=border_width)
    res = Image.alpha_composite(im, border_layer)
    return res

def add_drop_shadow(im, shadow_radius=25, offset=(0, 12), shadow_color=(0, 0, 0, 190)):
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

def draw_pill(draw, x, y, text, font=None, bg=(16, 22, 38, 240), border=(60, 100, 160, 190),
              text_color=(240, 245, 255), dot_color=(45, 212, 191), pad_x=16, pad_y=8):
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
    
    draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=bg, outline=border, width=1)
    
    if has_dot:
        dot_x = x + pad_x + dot_r
        dot_y = y + h // 2
        draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=dot_color)
    
    text_x = x + pad_x + dot_space
    draw.text((text_x, y + pad_y - bbox[1]), text, font=font, fill=text_color)
    return w, h

# ============================================================
# 1. card-hotkeys.png (快捷键中心 Hotkeys Center) - 满幅大画幅
# ============================================================
def build_card_hotkeys():
    # 窗口填满 95% 画幅：w=1140, h=606
    bg = make_bg(1200, 750, top_color=(14, 16, 26), bot_color=(6, 8, 14),
                 glow_color=(195, 140, 45), glow_center=(600, 375), glow_radius=520, glow_intensity=0.85)
    
    src_hotkey_path = os.path.join(UPLOADED_DIR, "media_1791705704276_d3d540c9.png")
    src = Image.open(src_hotkey_path).convert("RGBA")  # 820 x 436
    
    # 放大 1.39x -> 1140 x 606，并用锐化滤镜增强文字锐度
    target_w, target_h = 1140, 606
    win_scaled = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    win_sharp = win_scaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=130, threshold=2))
    
    win = round_corners(win_sharp, radius=16)
    win = add_border(win, radius=16, border_color=(255, 255, 255, 60), border_width=1)
    win_shadow, pad = add_drop_shadow(win, shadow_radius=28, offset=(0, 14), shadow_color=(0, 0, 0, 230))
    
    wx = (1200 - target_w) // 2
    wy = (750 - target_h) // 2
    bg.paste(win_shadow, (wx - pad, wy - pad), win_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    # 顶部和底部精巧微型胶囊标，不挤占窗口空间
    draw_pill(d_bg, wx + 16, wy - 38, "Alt + 1 ~ 9 秒开常用软件 · 再按一下立即收起", dot_color=(245, 200, 110),
              font=get_font(13, bold=True), bg=(28, 22, 12, 245), border=(245, 200, 110, 220), text_color=(255, 240, 210))
    
    draw_pill(d_bg, wx + target_w - 410, wy - 38, "从桌面拖入图标秒绑定 · 前 4 个同步主控盒", dot_color=(45, 212, 191),
              font=get_font(13, bold=True), bg=(14, 28, 26, 245), border=(45, 212, 191, 200), text_color=(220, 255, 245))
    
    draw_pill(d_bg, (1200 - 460) // 2, wy + target_h + 10, "支持自定义快捷键 · 任意组合键绑定软件 / 文件夹 / 常用网址 / 命令",
              dot_color=(168, 85, 247), font=get_font(13, bold=True),
              bg=(20, 16, 32, 245), border=(168, 85, 247, 190), text_color=(245, 230, 255))
    
    out_path = os.path.join(PUBLIC_DIR, "card-hotkeys.png")
    bg.convert("RGB").save(out_path, quality=96)
    print(f"Generated: {out_path}")

# ============================================================
# 2. card-top-dock.png (顶部窗口速览 Top Peek Dock) - 大号特写
# ============================================================
def build_card_top_dock():
    # 顶部 Dock 与速览窗占据 95% 画面
    bg = make_bg(1200, 750, top_color=(8, 14, 26), bot_color=(4, 7, 13),
                 glow_color=(35, 115, 195), glow_center=(600, 180), glow_radius=520, glow_intensity=0.85)
    
    # 顶部屏幕边缘
    d_bg = ImageDraw.Draw(bg)
    d_bg.rectangle([0, 0, 1200, 12], fill=(12, 18, 30, 255))
    d_bg.line([(0, 12), (1200, 12)], fill=(255, 255, 255, 30), width=1)
    
    # 裁切原始 Top Dock 并放大 1.8x -> w=900, h=81
    src_dock_path = os.path.join(UPLOADED_DIR, "media_1791700837529_dc0c8619.png")
    src_dock = Image.open(src_dock_path)
    dock_crop = src_dock.crop((205, 0, 705, 45))  # w=500, h=45
    dw, dh = int(500 * 1.8), int(45 * 1.8)
    dock_scaled = dock_crop.resize((dw, dh), Image.Resampling.LANCZOS)
    dock_sharp = dock_scaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))
    dock_sharp = round_corners(dock_sharp, radius=14)
    dock_sharp = add_border(dock_sharp, radius=14, border_color=(255, 255, 255, 65), border_width=1)
    
    dock_shadow, dpad = add_drop_shadow(dock_sharp, shadow_radius=20, offset=(0, 6), shadow_color=(0, 0, 0, 220))
    dock_x = (1200 - dw) // 2
    dock_y = 16
    bg.paste(dock_shadow, (dock_x - dpad, dock_y - dpad), dock_shadow)
    
    # 大号实时速览窗口 (Live Peek Window): w=1040, h=540
    peek_w, peek_h = 1040, 540
    peek_x = (1200 - peek_w) // 2
    peek_y = dock_y + dh + 30
    
    peek = Image.new("RGBA", (peek_w, peek_h), (16, 24, 42, 250))
    d_peek = ImageDraw.Draw(peek)
    
    # 标题栏 (大号)
    tb_h = 42
    d_peek.rounded_rectangle([0, 0, peek_w, tb_h], radius=16, fill=(24, 34, 58, 255))
    d_peek.rectangle([0, tb_h - 14, peek_w, tb_h], fill=(24, 34, 58, 255))
    d_peek.line([(0, tb_h), (peek_w, tb_h)], fill=(255, 255, 255, 35), width=1)
    
    d_peek.ellipse([16, 15, 28, 27], fill=(239, 68, 68, 230))
    d_peek.ellipse([34, 15, 46, 27], fill=(245, 158, 11, 230))
    d_peek.ellipse([52, 15, 64, 27], fill=(16, 185, 129, 230))
    
    font_title = get_font(14, bold=True)
    d_peek.text((78, 12), "天才猫桌面 2.0 · 官方主页多任务实时速览 (光标悬浮已激活 · 零点击切换)", font=font_title, fill=(220, 230, 250))
    
    # 内容区：嵌入清晰界面预览
    desktop_full_path = os.path.join(PUBLIC_DIR, "ui-desktop-full.png")
    if os.path.exists(desktop_full_path):
        preview_src = Image.open(desktop_full_path).convert("RGBA")
        pw, ph = peek_w - 16, peek_h - tb_h - 8
        preview_fitted = preview_src.resize((pw, ph), Image.Resampling.LANCZOS)
        preview_fitted = preview_fitted.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=2))
        preview_fitted = round_corners(preview_fitted, radius=10)
        peek.paste(preview_fitted, (8, tb_h + 4), preview_fitted)
    
    peek = round_corners(peek, radius=18)
    peek = add_border(peek, radius=18, border_color=(255, 255, 255, 55), border_width=1)
    peek_shadow, ppad = add_drop_shadow(peek, shadow_radius=32, offset=(0, 16), shadow_color=(0, 0, 0, 230))
    bg.paste(peek_shadow, (peek_x - ppad, peek_y - ppad), peek_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    # 光标指示与连接线
    tab_center_x = dock_x + 160
    d_bg.line([(tab_center_x, dock_y + dh), (tab_center_x, peek_y - 2)], fill=(45, 212, 191, 200), width=2)
    d_bg.ellipse([tab_center_x - 4, peek_y - 6, tab_center_x + 4, peek_y + 2], fill=(45, 212, 191, 255))
    
    # 模拟鼠标光标 (大号清晰)
    cur_x, cur_y = tab_center_x - 12, dock_y + 24
    cur_pts = [(cur_x, cur_y), (cur_x, cur_y + 22), (cur_x + 6, cur_y + 17), (cur_x + 12, cur_y + 27),
               (cur_x + 16, cur_y + 25), (cur_x + 10, cur_y + 15), (cur_x + 17, cur_y + 15)]
    d_bg.polygon(cur_pts, fill=(255, 255, 255, 255), outline=(0, 0, 0, 220))
    
    # 叠加在速览窗口底部的超清胶囊
    draw_pill(d_bg, peek_x + 24, peek_y + peek_h - 48, "光标经过即切窗口 · 零点击直达目标任务",
              dot_color=(45, 212, 191), font=get_font(13, bold=True),
              bg=(12, 20, 36, 245), border=(45, 212, 191, 200), text_color=(230, 255, 250))
    
    draw_pill(d_bg, peek_x + peek_w - 380, peek_y + peek_h - 48, "键盘 [ ← ] [ → ] 方向键 · 极速走马灯轮播",
              dot_color=(168, 85, 247), font=get_font(13, bold=True),
              bg=(24, 16, 36, 245), border=(168, 85, 247, 200), text_color=(250, 235, 255))
    
    out_path = os.path.join(PUBLIC_DIR, "card-top-dock.png")
    bg.convert("RGB").save(out_path, quality=96)
    print(f"Generated: {out_path}")

# ============================================================
# 3. card-alchemy.png (桌面炼金盒 Desktop Alchemy Box) - 超大特写
# ============================================================
def build_card_alchemy():
    # 菜单填满 88% 高度：每个字巨大清晰
    bg = make_bg(1200, 750, top_color=(10, 15, 28), bot_color=(5, 8, 15),
                 glow_color=(45, 125, 165), glow_center=(500, 375), glow_radius=520, glow_intensity=0.85)
    
    src_path = os.path.join(UPLOADED_DIR, "media_1791705845243_355026e0.png")
    src = Image.open(src_path).convert("RGBA")
    
    # 8 大神技子菜单: 放大 1.55x -> w=380, h=457
    sub = src.crop((45, 235, 290, 530))
    sub_w, sub_h = int(245 * 1.55), int(295 * 1.55)
    sub_scaled = sub.resize((sub_w, sub_h), Image.Resampling.LANCZOS)
    sub_sharp = sub_scaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))
    sub_sharp = round_corners(sub_sharp, radius=18)
    sub_sharp = add_border(sub_sharp, radius=18, border_color=(255, 255, 255, 65), border_width=1)
    
    # 主菜单: 放大 1.55x -> w=380, h=635
    main = src.crop((270, 115, 515, 525))
    main_w, main_h = int(245 * 1.55), int(410 * 1.55)
    main_scaled = main.resize((main_w, main_h), Image.Resampling.LANCZOS)
    main_sharp = main_scaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))
    main_sharp = round_corners(main_sharp, radius=18)
    main_sharp = add_border(main_sharp, radius=18, border_color=(255, 255, 255, 65), border_width=1)
    
    sub_shadow, spad = add_drop_shadow(sub_sharp, shadow_radius=28, offset=(-4, 14), shadow_color=(0, 0, 0, 230))
    main_shadow, mpad = add_drop_shadow(main_sharp, shadow_radius=32, offset=(6, 16), shadow_color=(0, 0, 0, 230))
    
    main_x, main_y = 470, 55
    sub_x, sub_y = 70, 145
    
    bg.paste(main_shadow, (main_x - mpad, main_y - mpad), main_shadow)
    bg.paste(sub_shadow, (sub_x - spad, sub_y - spad), sub_shadow)
    
    # 大号吉祥物 (230 x 230)
    cat_path = os.path.join(PUBLIC_DIR, "desktop-logo.png")
    if os.path.exists(cat_path):
        cat = Image.open(cat_path).convert("RGBA").resize((230, 230), Image.Resampling.LANCZOS)
        cat_shadow, cpad = add_drop_shadow(cat, shadow_radius=26, offset=(0, 12), shadow_color=(0, 0, 0, 210))
        bg.paste(cat_shadow, (900 - cpad, 450 - cpad), cat_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    # 右侧关键功能浮动指示条 (大字号)
    font_tip = get_font(14, bold=True)
    draw_pill(d_bg, 880, 85, "8 大日常文件神技随手即得", dot_color=(45, 212, 191),
              font=font_tip, bg=(16, 32, 40, 245), border=(45, 212, 191, 200), text_color=(230, 255, 250))
    draw_pill(d_bg, 880, 155, "多页 PDF 转图 · 原片瘦身 70%", dot_color=(52, 211, 153),
              font=font_tip, bg=(18, 30, 26, 245), border=(52, 211, 153, 190), text_color=(220, 255, 240))
    draw_pill(d_bg, 880, 225, "OCR 高精文字识别 · 划选翻译", dot_color=(59, 130, 246),
              font=font_tip, bg=(18, 24, 42, 245), border=(59, 130, 246, 190), text_color=(220, 240, 255))
    draw_pill(d_bg, 880, 295, "专注 25 分钟番茄钟 · 桌面待办", dot_color=(244, 63, 94),
              font=font_tip, bg=(28, 18, 30, 245), border=(244, 63, 94, 190), text_color=(255, 230, 235))
    draw_pill(d_bg, 880, 365, "剪贴板历史 Ctrl + ` 随查随粘", dot_color=(168, 85, 247),
              font=font_tip, bg=(22, 18, 36, 245), border=(168, 85, 247, 190), text_color=(245, 230, 255))
    
    draw_pill(d_bg, 70, 645, "日常文件免开大型软件 · 右键小猫一键秒解", dot_color=(245, 200, 110),
              font=font_tip, bg=(24, 20, 14, 245), border=(245, 200, 110, 180), text_color=(255, 240, 210))
    
    out_path = os.path.join(PUBLIC_DIR, "card-alchemy.png")
    bg.convert("RGB").save(out_path, quality=96)
    print(f"Generated: {out_path}")

# ============================================================
# 4. card-screenshot.png (高能截图与贴图 Screenshot & Workflow) - 满幅大画幅
# ============================================================
def build_card_screenshot():
    # 满幅工作台 1120 x 670
    bg = make_bg(1200, 750, top_color=(10, 14, 25), bot_color=(5, 7, 13),
                 glow_color=(35, 115, 150), glow_center=(600, 375), glow_radius=520, glow_intensity=0.85)
    
    sel_w, sel_h = 1120, 670
    sel_x, sel_y = 40, 40
    
    sel_box = Image.new("RGBA", (sel_w, sel_h), (14, 20, 36, 220))
    d_sel = ImageDraw.Draw(sel_box)
    
    # 亮青发光选区边框
    d_sel.rectangle([0, 0, sel_w - 1, sel_h - 1], outline=(45, 212, 191, 230), width=2)
    handles = [(0, 0), (sel_w - 14, 0), (0, sel_h - 14), (sel_w - 14, sel_h - 14)]
    for hx, hy in handles:
        d_sel.rectangle([hx, hy, hx + 14, hy + 14], fill=(45, 212, 191, 255))
    
    # 选区尺寸标注 (大号)
    draw_pill(d_sel, 16, 16, "选区: 1120 × 670  |  当前取色: #2DD4BF", font=get_font(13, bold=True),
              dot_color=(45, 212, 191), bg=(10, 15, 25, 240), border=(45, 212, 191, 200), text_color=(45, 212, 191))
    
    # 区域 1: 大号马赛克隐私打码区 (Mosaic Demo)
    mos_w, mos_h = 490, 170
    mos_x, mos_y = 40, 85
    block_size = 18
    for by in range(0, mos_h, block_size):
        for bx in range(0, mos_w, block_size):
            lum = 45 + int(((bx * 31 + by * 17) % 65))
            d_sel.rectangle([mos_x + bx, mos_y + by, mos_x + bx + block_size - 1, mos_y + by + block_size - 1],
                            fill=(lum - 10, lum + 5, lum + 20, 230), outline=(lum + 12, lum + 28, lum + 44, 200))
    d_sel.rectangle([mos_x, mos_y, mos_x + mos_w, mos_y + mos_h], outline=(245, 158, 11, 220), width=2)
    draw_pill(d_sel, mos_x + 16, mos_y + mos_h + 16, "智能马赛克隐私打码 · 拖选即刻模糊遮蔽隐私信息",
              dot_color=(245, 158, 11), font=get_font(13, bold=True),
              bg=(32, 22, 10, 245), border=(245, 158, 11, 200), text_color=(255, 235, 190))
    
    # 区域 2: 大号划选翻译浮窗 (Alt + CapsLock)
    trans_x, trans_y = 40, 325
    trans_w, trans_h = 510, 170
    d_sel.rounded_rectangle([trans_x, trans_y, trans_x + trans_w, trans_y + trans_h], radius=14,
                            fill=(18, 28, 50, 250), outline=(59, 130, 246, 220), width=1)
    font_lg = get_font(15, bold=True)
    font_md = get_font(14, bold=False)
    font_bold = get_font(16, bold=True)
    d_sel.text((trans_x + 18, trans_y + 16), "划选即时直译 (Alt + CapsLock 快捷键)", font=font_lg, fill=(96, 165, 250))
    d_sel.text((trans_x + 18, trans_y + 54), "原文: Seamless rolling long screenshot & pin to desktop", font=font_md, fill=(190, 205, 230))
    d_sel.text((trans_x + 18, trans_y + 90), "译文: 屏幕任意区域划选即翻 · 滚动截长图 · 桌面置顶贴图", font=font_bold, fill=(245, 250, 255))
    
    # 区域 3: 右侧放大嵌入真实的“截图与翻译”控制卡片
    tool_card_path = os.path.join(UPLOADED_DIR, "media_1791705868859_5ec4c52a.png")
    if os.path.exists(tool_card_path):
        tc = Image.open(tool_card_path).convert("RGBA")
        # 放大 1.45x -> 485 x 217
        tc_w, tc_h = int(335 * 1.45), int(150 * 1.45)
        tc_scaled = tc.resize((tc_w, tc_h), Image.Resampling.LANCZOS)
        tc_sharp = tc_scaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))
        tc_sharp = round_corners(tc_sharp, radius=18)
        tc_sharp = add_border(tc_sharp, radius=18, border_color=(255, 255, 255, 60), border_width=1)
        tc_shadow, tpad = add_drop_shadow(tc_sharp, shadow_radius=26, offset=(0, 12), shadow_color=(0, 0, 0, 220))
        sel_box.paste(tc_shadow, (580 - tpad, 85 - tpad), tc_shadow)
    
    # 右侧浮动特性标
    draw_pill(d_sel, 580, 335, "钉在桌面置顶贴图 · 多屏比对免切屏", dot_color=(59, 130, 246),
              font=get_font(13, bold=True), bg=(20, 26, 42, 240), border=(59, 130, 246, 180), text_color=(220, 240, 255))
    draw_pill(d_sel, 580, 395, "长网页无缝滚动截长图 · 智能拼接", dot_color=(52, 211, 153),
              font=get_font(13, bold=True), bg=(18, 32, 28, 240), border=(52, 211, 153, 180), text_color=(220, 255, 240))
    draw_pill(d_sel, 580, 455, "Ctrl + ` 剪贴板历史 · 代码图片随查随粘", dot_color=(168, 85, 247),
              font=get_font(13, bold=True), bg=(26, 18, 38, 240), border=(168, 85, 247, 180), text_color=(245, 230, 255))
    
    # 区域 4: 底部大号专业截图悬浮工具栏 (w=980, h=64)
    tb_w, tb_h = 980, 64
    tb_x, tb_y = (sel_w - tb_w) // 2, sel_h - 90
    d_sel.rounded_rectangle([tb_x, tb_y, tb_x + tb_w, tb_y + tb_h], radius=tb_h // 2,
                            fill=(12, 16, 28, 255), outline=(255, 255, 255, 60), width=1)
    tools = ["矩形框选", "自由画笔", "智能打码", "滚动截长图", "置顶贴图", "划选翻译", "复制 / 保存"]
    tw_step = tb_w // len(tools)
    font_tool = get_font(15, bold=True)
    for i, t in enumerate(tools):
        tx = tb_x + i * tw_step + (tw_step // 2)
        ty = tb_y + 20
        col = (45, 212, 191) if "打码" in t else (220, 230, 245)
        t_bbox = font_tool.getbbox(t)
        t_w = t_bbox[2] - t_bbox[0]
        d_sel.text((tx - t_w // 2, ty), t, font=font_tool, fill=col)
        if i < len(tools) - 1:
            d_sel.line([(tb_x + (i + 1) * tw_step, tb_y + 14), (tb_x + (i + 1) * tw_step, tb_y + tb_h - 14)],
                       fill=(255, 255, 255, 30), width=1)
    
    sel_box = round_corners(sel_box, radius=18)
    sel_shadow, spad = add_drop_shadow(sel_box, shadow_radius=28, offset=(0, 14), shadow_color=(0, 0, 0, 220))
    bg.paste(sel_shadow, (sel_x - spad, sel_y - spad), sel_shadow)
    
    out_path = os.path.join(PUBLIC_DIR, "card-screenshot.png")
    bg.convert("RGB").save(out_path, quality=96)
    print(f"Generated: {out_path}")

# ============================================================
# 5. card-themes.png (外观与皮肤 Appearance & Themes) - 满幅大画幅
# ============================================================
def build_card_themes():
    bg = make_bg(1200, 750, top_color=(12, 14, 25), bot_color=(6, 7, 14),
                 glow_color=(125, 60, 190), glow_center=(500, 375), glow_radius=520, glow_intensity=0.85)
    
    src_path = os.path.join(PUBLIC_DIR, "preview-appearance-themes.png")
    src = Image.open(src_path).convert("RGBA")
    
    # 裁剪左侧外观设置窗口: (58, 220, 645, 643) -> 放大 1.35x -> 792 x 571
    win = src.crop((58, 220, 645, 643))
    win_w, win_h = int(587 * 1.35), int(423 * 1.35)
    win_scaled = win.resize((win_w, win_h), Image.Resampling.LANCZOS)
    win_sharp = win_scaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))
    win_sharp = round_corners(win_sharp, radius=18)
    win_sharp = add_border(win_sharp, radius=18, border_color=(255, 255, 255, 60), border_width=1)
    win_shadow, wpad = add_drop_shadow(win_sharp, shadow_radius=30, offset=(-4, 14), shadow_color=(0, 0, 0, 220))
    
    # 裁剪右侧桌面小组件群: (695, 220, 930, 630) -> 放大 1.35x -> 317 x 553
    widgets = src.crop((695, 220, 930, 630))
    wid_w, wid_h = int(235 * 1.35), int(410 * 1.35)
    wid_scaled = widgets.resize((wid_w, wid_h), Image.Resampling.LANCZOS)
    wid_sharp = wid_scaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))
    wid_sharp = round_corners(wid_sharp, radius=18)
    wid_sharp = add_border(wid_sharp, radius=18, border_color=(255, 255, 255, 55), border_width=1)
    widgets_shadow, gpad = add_drop_shadow(wid_sharp, shadow_radius=28, offset=(6, 14), shadow_color=(0, 0, 0, 200))
    
    bg.paste(win_shadow, (35 - wpad, 85 - wpad), win_shadow)
    bg.paste(widgets_shadow, (845 - gpad, 95 - gpad), widgets_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, 40, 28, "6 套官方审美皮肤 · 冰川磨砂 / 深空石墨 / 极光幻紫 / 薄荷森林 / 落日暖橙...",
              dot_color=(168, 85, 247), font=get_font(13, bold=True),
              bg=(26, 18, 38, 245), border=(168, 85, 247, 200), text_color=(250, 235, 255))
    
    draw_pill(d_bg, 40, 685, "屏幕边缘呼吸灯提醒 · 玻璃浓度、强调色与小组件自由微调",
              dot_color=(52, 211, 153), font=get_font(13, bold=True),
              bg=(16, 32, 28, 245), border=(52, 211, 153, 190), text_color=(220, 255, 240))
    
    out_path = os.path.join(PUBLIC_DIR, "card-themes.png")
    bg.convert("RGB").save(out_path, quality=96)
    print(f"Generated: {out_path}")

# ============================================================
# 6. card-novadisk.png (NovaDisk 空间管家) - 满幅大画幅
# ============================================================
def build_card_novadisk():
    bg = make_bg(1200, 750, top_color=(8, 16, 24), bot_color=(4, 7, 13),
                 glow_color=(30, 145, 105), glow_center=(600, 375), glow_radius=520, glow_intensity=0.85)
    
    src_path = os.path.join(PUBLIC_DIR, "preview-novadisk-clean.png")
    src = Image.open(src_path).convert("RGBA")  # 1000 x 700
    
    # 放大至 1140 x 660，填满 95% 画幅
    w_fit, h_fit = 1140, 660
    win = src.resize((w_fit, h_fit), Image.Resampling.LANCZOS)
    win_sharp = win.filter(ImageFilter.UnsharpMask(radius=1.5, percent=140, threshold=2))
    win_sharp = round_corners(win_sharp, radius=18)
    win_sharp = add_border(win_sharp, radius=18, border_color=(255, 255, 255, 55), border_width=1)
    win_shadow, pad = add_drop_shadow(win_sharp, shadow_radius=30, offset=(0, 15), shadow_color=(0, 0, 0, 220))
    
    wx = (1200 - w_fit) // 2
    wy = 45
    bg.paste(win_shadow, (wx - pad, wy - pad), win_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, wx + 20, 12, "NovaDisk 空间管家 · C 盘大文件可视化分布体检", dot_color=(45, 212, 191),
              font=get_font(13, bold=True), bg=(16, 32, 28, 245), border=(45, 212, 191, 200), text_color=(220, 255, 245))
    
    draw_pill(d_bg, wx + 20, wy + h_fit - 38, "微信 / QQ 聊天数据无损迁移至其他盘 · 安全可逆释放数十 GB", dot_color=(59, 130, 246),
              font=get_font(13, bold=True), bg=(16, 28, 48, 245), border=(59, 130, 246, 190), text_color=(220, 240, 255))
    
    out_path = os.path.join(PUBLIC_DIR, "card-novadisk.png")
    bg.convert("RGB").save(out_path, quality=96)
    print(f"Generated: {out_path}")

# ============================================================
# 7. card-desktop-full.png (桌面实拍全景) - 满幅大画幅
# ============================================================
def build_card_desktop_full():
    bg = make_bg(1200, 750, top_color=(8, 12, 22), bot_color=(4, 6, 12),
                 glow_color=(45, 95, 160), glow_center=(600, 375), glow_radius=520, glow_intensity=0.85)
    
    src_path = os.path.join(PUBLIC_DIR, "ui-desktop-full.png")
    src = Image.open(src_path).convert("RGBA")
    
    # 放大至 1160 x 670，填满 96% 画幅
    w_fit, h_fit = 1160, 670
    desk = src.resize((w_fit, h_fit), Image.Resampling.LANCZOS)
    desk_sharp = desk.filter(ImageFilter.UnsharpMask(radius=1.3, percent=120, threshold=2))
    desk_sharp = round_corners(desk_sharp, radius=18)
    desk_sharp = add_border(desk_sharp, radius=18, border_color=(255, 255, 255, 55), border_width=1)
    desk_shadow, pad = add_drop_shadow(desk_sharp, shadow_radius=30, offset=(0, 15), shadow_color=(0, 0, 0, 220))
    
    dx = (1200 - w_fit) // 2
    dy = 40
    bg.paste(desk_shadow, (dx - pad, dy - pad), desk_shadow)
    
    d_bg = ImageDraw.Draw(bg)
    draw_pill(d_bg, dx + 20, 12, "天才猫桌面 2.0 运行全景 · 磨砂收纳盒 + 小组件 + 灵动桌宠 + 快捷主控", dot_color=(59, 130, 246),
              font=get_font(13, bold=True), bg=(16, 24, 40, 245), border=(59, 130, 246, 200), text_color=(230, 245, 255))
    
    out_path = os.path.join(PUBLIC_DIR, "card-desktop-full.png")
    bg.convert("RGB").save(out_path, quality=96)
    print(f"Generated: {out_path}")

if __name__ == "__main__":
    build_card_top_dock()
    build_card_hotkeys()
    build_card_alchemy()
    build_card_screenshot()
    build_card_themes()
    build_card_novadisk()
    build_card_desktop_full()
    print("All 7 full-bleed, razor-sharp cards regenerated successfully!")
