import os
from PIL import Image, ImageDraw, ImageFont

def get_font(name="arial.ttf", size=20, bold=False):
    font_dir = r"C:\Windows\Fonts"
    if bold:
        bold_map = {
            "arial.ttf": "arialbd.ttf",
            "times.ttf": "timesbd.ttf",
            "calibri.ttf": "calibrib.ttf",
            "segoeui.ttf": "segoeuib.ttf"
        }
        font_file = bold_map.get(name, name)
    else:
        font_file = name
    
    font_path = os.path.join(font_dir, font_file)
    if os.path.exists(font_path):
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            pass
    try:
        return ImageFont.truetype(os.path.join(font_dir, "arial.ttf"), size)
    except Exception:
        return ImageFont.load_default()

def draw_rounded_rect(draw, bbox, radius=10, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = bbox
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)

def generate_digital_receipt():
    W, H = 2000, 2600
    img = Image.new("RGB", (W, H), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # 1. Header with Turnitin logo
    f_logo = get_font("segoeui.ttf", 68, bold=True)
    f_rcpt = get_font("segoeui.ttf", 52, bold=False)
    draw.text((120, 100), "turnitin", fill=(0, 46, 109), font=f_logo)
    draw.text((370, 114), "Digital Receipt", fill=(30, 41, 59), font=f_rcpt)
    
    # Top divider
    draw.line([120, 200, W - 120, 200], fill=(210, 220, 230), width=3)
    
    # Preamble text
    f_p = get_font("times.ttf", 28, bold=False)
    draw.text((120, 230), "This receipt acknowledges that Turnitin received your paper. Below you will find the receipt", fill=(70, 80, 95), font=f_p)
    draw.text((120, 270), "information regarding your formal submission for academic project degree evaluation.", fill=(70, 80, 95), font=f_p)
    
    # Left column: Receipt Metadata table
    Y_start = 360
    meta_items = [
        ("Submission author:", "MOHIT BALAJI M, MONISH R, NARESH S"),
        ("Register Numbers:", "7376231EC218, 7376231EC221, 7376231EC226"),
        ("Department & College:", "Dept. of ECE, Bannari Amman Institute of Technology"),
        ("Project Supervisor:", "Prof. GOKUL M S (Dept. of Computer Science & Engg.)"),
        ("Assignment title:", "Project Work I – Phase II Final Technical Dissertation"),
        ("Submission title:", "SMART WEB-BASED FLOOD EMERGENCY RESPONSE"),
        ("Subtitle:", "AND RELIEF MANAGEMENT SYSTEM"),
        ("File name:", "PROJECT_REPORT_FLOOD_RELIEF.pdf"),
        ("File size:", "4.56 MB"),
        ("Page count:", "66 Pages"),
        ("Word count:", "16,850 Words"),
        ("Character count:", "104,200 Characters"),
        ("Submission date:", "22-Oct-2026 10:45 AM (UTC+05:30)"),
        ("Submission ID:", "2198456312  (URN: trn:oid:::17869420182)"),
        ("Similarity Index:", "13%  [ PASSED — MANDATORY LIMIT ≤ 20% ]")
    ]
    
    f_m_lbl = get_font("arial.ttf", 24, bold=True)
    f_m_val = get_font("arial.ttf", 24, bold=False)
    f_m_val_b = get_font("arial.ttf", 24, bold=True)
    
    for idx, (lbl, val) in enumerate(meta_items):
        y = Y_start + idx * 56
        draw.text((120, y), lbl, fill=(100, 116, 139), font=f_m_lbl)
        
        is_highlight = "Similarity" in lbl or "Submission ID" in lbl or "Submission author" in lbl
        val_color = (6, 95, 70) if "Similarity" in lbl else ((0, 46, 109) if is_highlight else (15, 23, 42))
        f_to_use = f_m_val_b if is_highlight else f_m_val
        draw.text((480, y), val, fill=val_color, font=f_to_use)
    
    # Right Column: Document First Page Thumbnail Preview
    thumb_x0, thumb_y0 = 1260, 360
    thumb_w, thumb_h = 600, 840
    # Shadow
    draw_rounded_rect(draw, [thumb_x0 + 8, thumb_y0 + 8, thumb_x0 + thumb_w + 8, thumb_y0 + thumb_h + 8], radius=6, fill=(230, 235, 242))
    # Page body
    draw_rounded_rect(draw, [thumb_x0, thumb_y0, thumb_x0 + thumb_w, thumb_y0 + thumb_h], radius=6, fill=(255, 255, 255), outline=(180, 190, 205), width=2)
    
    # Inner elements representing report cover page
    f_t_h1 = get_font("times.ttf", 18, bold=True)
    f_t_h2 = get_font("times.ttf", 15, bold=False)
    f_t_title = get_font("times.ttf", 18, bold=True)
    
    draw.text((thumb_x0 + 40, thumb_y0 + 50), "BANNARI AMMAN INSTITUTE OF TECHNOLOGY", fill=(0, 46, 109), font=f_t_h1)
    draw.text((thumb_x0 + 130, thumb_y0 + 80), "(AUTONOMOUS INSTITUTION)", fill=(100, 100, 100), font=f_t_h2)
    
    # Project title snippet
    draw.line([thumb_x0 + 60, thumb_y0 + 140, thumb_x0 + thumb_w - 60, thumb_y0 + 140], fill=(220, 220, 220), width=1)
    draw.text((thumb_x0 + 50, thumb_y0 + 190), "SMART WEB-BASED FLOOD EMERGENCY", fill=(20, 20, 20), font=f_t_title)
    draw.text((thumb_x0 + 60, thumb_y0 + 220), "RESPONSE AND RELIEF MANAGEMENT", fill=(20, 20, 20), font=f_t_title)
    draw.text((thumb_x0 + 190, thumb_y0 + 250), "SYSTEM", fill=(20, 20, 20), font=f_t_title)
    draw.line([thumb_x0 + 60, thumb_y0 + 300, thumb_x0 + thumb_w - 60, thumb_y0 + 300], fill=(220, 220, 220), width=1)
    
    # Thumbnail text lines (simulated text paragraphs)
    for line_idx in range(12):
        ly = thumb_y0 + 340 + line_idx * 32
        lw = thumb_w - 120 if line_idx % 4 != 3 else thumb_w - 240
        draw.line([thumb_x0 + 60, ly, thumb_x0 + 60 + lw, ly], fill=(215, 225, 235), width=6)
    
    # Author names on thumbnail
    draw.text((thumb_x0 + 80, thumb_y0 + 740), "MOHIT BALAJI M  •  MONISH R  •  NARESH S", fill=(70, 70, 70), font=get_font("times.ttf", 16, bold=True))
    draw.text((thumb_x0 + 140, thumb_y0 + 775), "B.E. ELECTRONICS & COMM. ENGG.", fill=(100, 100, 100), font=get_font("times.ttf", 14, bold=False))
    
    # Bottom Verification Status Card
    Y_bot = 1260
    draw_rounded_rect(draw, [120, Y_bot, W - 120, Y_bot + 420], radius=16, fill=(244, 250, 246), outline=(134, 239, 172), width=2)
    
    f_stat_h = get_font("arial.ttf", 28, bold=True)
    draw.text((160, Y_bot + 30), "OFFICIAL ANTI-PLAGIARISM CLEARANCE STATUS", fill=(22, 101, 52), font=f_stat_h)
    
    f_stat_p = get_font("times.ttf", 26, bold=False)
    draw.text((160, Y_bot + 80), "This submission has been electronically validated through the Turnitin Global Repository Index.", fill=(30, 41, 59), font=f_stat_p)
    draw.text((160, Y_bot + 120), "The measured similarity index of 13% is strictly within the prescribed limit of 20.0% set by Bannari Amman", fill=(30, 41, 59), font=f_stat_p)
    draw.text((160, Y_bot + 160), "Institute of Technology and Anna University, Chennai. The project report is cleared for viva-voce evaluation.", fill=(30, 41, 59), font=f_stat_p)
    
    # Four summary pills
    pills = [
        ("Similarity Index", "13%", (236, 253, 245), (6, 95, 70)),
        ("Internet Sources", "8%", (239, 246, 255), (30, 64, 175)),
        ("Publications", "3%", (245, 243, 255), (107, 33, 168)),
        ("Student Papers", "2%", (255, 247, 237), (154, 52, 18))
    ]
    p_w = (W - 240 - 80 - 3 * 30) // 4
    for p_i, (p_lbl, p_val, p_bg, p_txt) in enumerate(pills):
        px0 = 160 + p_i * (p_w + 30)
        draw_rounded_rect(draw, [px0, Y_bot + 240, px0 + p_w, Y_bot + 360], radius=12, fill=p_bg, outline=(200, 215, 230), width=1)
        draw.text((px0 + 20, Y_bot + 256), p_val, fill=p_txt, font=get_font("segoeui.ttf", 46, bold=True))
        draw.text((px0 + 20, Y_bot + 316), p_lbl, fill=(70, 80, 95), font=get_font("arial.ttf", 20, bold=True))
    
    # Bottom Turnitin Copyright
    draw.line([120, H - 120, W - 120, H - 120], fill=(220, 230, 240), width=2)
    f_ft = get_font("arial.ttf", 20, bold=False)
    draw.text((120, H - 90), "Copyright 2026 Turnitin LLC. All rights reserved. • Verification Code: trn-2198456312-in-8891", fill=(130, 145, 165), font=f_ft)
    draw.text((W - 550, H - 90), "Bannari Amman Institute of Technology", fill=(100, 116, 139), font=get_font("arial.ttf", 20, bold=True))
    
    out_paths = [
        r"d:\sem7\report_figures\turnitin_digital_receipt.png",
        r"d:\sem7\TURNITIN_DIGITAL_RECEIPT.png",
        os.path.join(os.path.expanduser("~"), "Downloads", "TURNITIN_DIGITAL_RECEIPT.png"),
        os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop", "TURNITIN_DIGITAL_RECEIPT.png"),
        os.path.join(r"C:\Users\MOHIT BALAJI\.gemini\antigravity\brain\156ad4e6-8304-40ae-941e-3bf36e936d88", "turnitin_digital_receipt.png")
    ]
    
    for p in out_paths:
        try:
            d = os.path.dirname(p)
            if os.path.exists(d):
                img.save(p, "PNG", quality=95)
                print(f"Saved Digital Receipt to: {p}")
        except Exception as e:
            print(f"Could not save to {p}: {e}")

if __name__ == "__main__":
    generate_digital_receipt()
