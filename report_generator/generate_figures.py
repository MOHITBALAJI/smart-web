import os
import shutil
from PIL import Image, ImageDraw, ImageFont

FIGURES_DIR = r"d:\sem7\report_figures"
os.makedirs(FIGURES_DIR, exist_ok=True)

USER_UPLOADED_DIR = r"C:\Users\MOHIT BALAJI\.gemini\antigravity\brain\156ad4e6-8304-40ae-941e-3bf36e936d88\.user_uploaded"
HERO_IMG = r"d:\sem7\frontend\public\relief_hero.png"

def copy_or_process_image(src, dest, max_width=1200):
    if os.path.exists(src):
        try:
            im = Image.open(src)
            # Convert RGBA to RGB if saving as JPEG or preserve PNG
            if im.width > max_width:
                ratio = max_width / float(im.width)
                new_height = int(float(im.height) * ratio)
                im = im.resize((max_width, new_height), Image.Resampling.LANCZOS)
            im.save(dest)
            return True
        except Exception as e:
            print(f"Error processing {src}: {e}")
            return False
    return False

def draw_diagram_base(width=1200, height=750, title="DIAGRAM"):
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Background subtle border
    draw.rectangle([(10, 10), (width - 10, height - 10)], outline=(0, 51, 102), width=3)
    # Header banner
    draw.rectangle([(10, 10), (width - 10, 70)], fill=(0, 51, 102))
    draw.text((30, 25), title, fill=(255, 255, 255))
    return img, draw

def create_system_architecture_diagram():
    out_path = os.path.join(FIGURES_DIR, "fig_3_1_architecture.png")
    img, draw = draw_diagram_base(1200, 750, "FIGURE 3.1: THREE-TIER SYSTEM ARCHITECTURE MODEL")
    
    # Layer 1: Presentation Layer
    draw.rounded_rectangle([(60, 100), (1140, 260)], radius=15, fill=(240, 246, 255), outline=(0, 102, 204), width=2)
    draw.text((90, 115), "TIER 1: PRESENTATION & CLIENT USER INTERFACE LAYER", fill=(0, 51, 102))
    
    components_l1 = [
        ("React 19 & Concurrent DOM", (90, 155), (320, 235)),
        ("TanStack Type-Safe Router", (350, 155), (590, 235)),
        ("Tailwind CSS & Radix UI", (620, 155), (850, 235)),
        ("Google Maps & Leaflet GIS", (880, 155), (1110, 235)),
    ]
    for name, top_left, bot_right in components_l1:
        draw.rounded_rectangle([top_left, bot_right], radius=8, fill=(255, 255, 255), outline=(0, 102, 204), width=1)
        draw.text((top_left[0] + 15, top_left[1] + 30), name, fill=(30, 30, 30))

    # Arrows between Tier 1 & Tier 2
    draw.rectangle([(580, 260), (620, 310)], fill=(0, 102, 204))
    draw.polygon([(560, 310), (640, 310), (600, 330)], fill=(0, 102, 204))
    draw.text((630, 280), "HTTPS REST & WebSocket (WSS)", fill=(0, 51, 102))

    # Layer 2: Application Services Layer
    draw.rounded_rectangle([(60, 340), (1140, 500)], radius=15, fill=(240, 253, 244), outline=(16, 149, 106), width=2)
    draw.text((90, 355), "TIER 2: APPLICATION LOGIC & AI SERVICES LAYER", fill=(4, 120, 87))

    components_l2 = [
        ("Supabase Auth & RBAC Guard", (90, 395), (320, 475)),
        ("Spatial Haversine Engine", (350, 395), (590, 475)),
        ("Mission 5-Stage Stepper", (620, 395), (850, 475)),
        ("Google Gemini AI REST Engine", (880, 395), (1110, 475)),
    ]
    for name, top_left, bot_right in components_l2:
        draw.rounded_rectangle([top_left, bot_right], radius=8, fill=(255, 255, 255), outline=(16, 149, 106), width=1)
        draw.text((top_left[0] + 15, top_left[1] + 30), name, fill=(30, 30, 30))

    # Arrows between Tier 2 & Tier 3
    draw.rectangle([(580, 500), (620, 550)], fill=(16, 149, 106))
    draw.polygon([(560, 550), (640, 550), (600, 570)], fill=(16, 149, 106))
    draw.text((630, 520), "SQL Queries & WAL Logical Replication", fill=(4, 120, 87))

    # Layer 3: Data Layer
    draw.rounded_rectangle([(60, 580), (1140, 710)], radius=15, fill=(254, 242, 242), outline=(220, 38, 38), width=2)
    draw.text((90, 595), "TIER 3: DATA PERSISTENCE & REALTIME STORAGE LAYER", fill=(185, 28, 28))

    components_l3 = [
        ("PostgreSQL Relational 3NF", (90, 630), (320, 690)),
        ("Row-Level Security (RLS)", (350, 630), (590, 690)),
        ("Realtime Pub/Sub Channels", (620, 630), (850, 690)),
        ("Supabase Storage & Vault", (880, 630), (1110, 690)),
    ]
    for name, top_left, bot_right in components_l3:
        draw.rounded_rectangle([top_left, bot_right], radius=8, fill=(255, 255, 255), outline=(220, 38, 38), width=1)
        draw.text((top_left[0] + 15, top_left[1] + 20), name, fill=(30, 30, 30))

    img.save(out_path)

def create_er_diagram():
    out_path = os.path.join(FIGURES_DIR, "fig_3_2_er_diagram.png")
    img, draw = draw_diagram_base(1200, 750, "FIGURE 3.2: RELATIONAL DATABASE ENTITY-RELATIONSHIP (ER) SCHEMA")

    entities = [
        ("USERS", [(70, 110), (330, 280)], ["id (UUID, PK)", "email (VARCHAR)", "role (ENUM)", "full_name (VARCHAR)", "phone (VARCHAR)"], (0, 51, 102)),
        ("SOS_REQUESTS", [(440, 110), (760, 350)], ["id (UUID, PK)", "reporter_name", "latitude, longitude", "urgency_level (INT)", "battery_level (INT)", "status (VARCHAR)"], (185, 28, 28)),
        ("RELIEF_CAMPS", [(870, 110), (1130, 320)], ["id (UUID, PK)", "name (VARCHAR)", "current_occupancy", "max_capacity", "has_medical_officer"], (4, 120, 87)),
        ("VOLUNTEERS", [(70, 420), (330, 640)], ["id (UUID, PK)", "user_id (FK -> users)", "vehicle_type", "is_available (BOOL)", "current_lat, current_lng"], (0, 102, 204)),
        ("VOLUNTEER_ASSIGNMENTS", [(440, 450), (760, 650)], ["id (UUID, PK)", "sos_id (FK -> sos)", "volunteer_id (FK)", "status (stepper)", "assigned_at"], (147, 51, 234)),
        ("INVENTORY", [(870, 420), (1130, 640)], ["id (UUID, PK)", "camp_id (FK -> camps)", "item_name", "current_stock", "min_threshold"], (217, 119, 6)),
    ]

    for name, rect, fields, color in entities:
        draw.rounded_rectangle(rect, radius=8, fill=(255, 255, 255), outline=color, width=2)
        draw.rectangle([(rect[0][0], rect[0][1]), (rect[1][0], rect[0][1] + 35)], fill=color)
        draw.text((rect[0][0] + 15, rect[0][1] + 10), name, fill=(255, 255, 255))
        y = rect[0][1] + 45
        for field in fields:
            draw.text((rect[0][0] + 15, y), "• " + field, fill=(50, 50, 50))
            y += 24

    # Connectors
    draw.line([(330, 170), (440, 170)], fill=(100, 100, 100), width=2)
    draw.line([(760, 180), (870, 180)], fill=(100, 100, 100), width=2)
    draw.line([(600, 350), (600, 450)], fill=(100, 100, 100), width=2)
    draw.line([(330, 520), (440, 520)], fill=(100, 100, 100), width=2)
    draw.line([(1000, 320), (1000, 420)], fill=(100, 100, 100), width=2)

    img.save(out_path)

def create_operational_flowchart():
    out_path = os.path.join(FIGURES_DIR, "fig_3_3_flowchart.png")
    img, draw = draw_diagram_base(1200, 750, "FIGURE 3.3: END-TO-END OPERATIONAL LIFECYCLE FLOWCHART")

    steps = [
        ("1. Distress Detected", (70, 160), (300, 260), (220, 38, 38), "Victim clicks 1-Click SOS / Web Speech"),
        ("2. Telemetry Ingest", (360, 160), (590, 260), (234, 88, 12), "GPS coords, battery %, water level depth"),
        ("3. Automated Triage", (650, 160), (880, 260), (202, 138, 4), "Ptriage index computed, queue prioritized"),
        ("4. Realtime Broadcast", (940, 160), (1160, 260), (16, 149, 106), "Supabase WebSocket pushes alert to map"),
        
        ("8. Ration Auditing", (70, 470), (300, 570), (4, 120, 87), "Inventory ledger decrements stocks automatically"),
        ("7. Shelter Intake", (360, 470), (590, 570), (13, 148, 136), "Digital PDF pass issued, family clustered"),
        ("6. 5-Stage Mission", (650, 470), (880, 570), (59, 130, 246), "Dispatched -> En Route -> Victim -> Evac -> Safe"),
        ("5. Rescuer Mobilized", (940, 470), (1160, 570), (147, 51, 234), "Dispatcher assigns motorboat via 1-click"),
    ]

    for title, tl, br, col, desc in steps:
        draw.rounded_rectangle([tl, br], radius=10, fill=(255, 255, 255), outline=col, width=2)
        draw.rectangle([(tl[0], tl[1]), (br[0], tl[1] + 30)], fill=col)
        draw.text((tl[0] + 10, tl[1] + 8), title, fill=(255, 255, 255))
        draw.text((tl[0] + 10, tl[1] + 45), desc, fill=(40, 40, 40))

    # Flow arrows
    draw.line([(300, 210), (360, 210)], fill=(0, 51, 102), width=3)
    draw.line([(590, 210), (650, 210)], fill=(0, 51, 102), width=3)
    draw.line([(880, 210), (940, 210)], fill=(0, 51, 102), width=3)
    # Down arrow from 4 to 5
    draw.line([(1050, 260), (1050, 470)], fill=(0, 51, 102), width=3)
    # Left arrows on bottom row
    draw.line([(940, 520), (880, 520)], fill=(0, 51, 102), width=3)
    draw.line([(650, 520), (590, 520)], fill=(0, 51, 102), width=3)
    draw.line([(360, 520), (300, 520)], fill=(0, 51, 102), width=3)

    img.save(out_path)

def create_mission_stepper_diagram():
    out_path = os.path.join(FIGURES_DIR, "fig_4_4_stepper.png")
    img, draw = draw_diagram_base(1200, 750, "FIGURE 4.4: 5-STAGE RESCUER MISSION PROGRESS STEPPER")

    stages = [
        ("STAGE 1", "Dispatched (20%)", "Vessel notified & prepped", (90, 200), (280, 400), (220, 38, 38)),
        ("STAGE 2", "En Route (40%)", "Active waterway navigation", (310, 200), (500, 400), (234, 88, 12)),
        ("STAGE 3", "At Victim (60%)", "Physical contact established", (530, 200), (720, 400), (202, 138, 4)),
        ("STAGE 4", "Evacuating (80%)", "Transporting to relief camp", (750, 200), (940, 400), (16, 149, 106)),
        ("STAGE 5", "Safe (100%)", "Disembarked at shelter", (970, 200), (1160, 400), (4, 120, 87)),
    ]

    for stg, title, desc, tl, br, col in stages:
        draw.rounded_rectangle([tl, br], radius=12, fill=(255, 255, 255), outline=col, width=3)
        draw.rectangle([(tl[0], tl[1]), (br[0], tl[1] + 40)], fill=col)
        draw.text((tl[0] + 20, tl[1] + 12), stg, fill=(255, 255, 255))
        draw.text((tl[0] + 15, tl[1] + 60), title, fill=(30, 30, 30))
        draw.text((tl[0] + 15, tl[1] + 100), desc, fill=(100, 100, 100))
        # Draw status circle
        draw.ellipse([(tl[0] + 60, tl[1] + 130), (tl[0] + 110, tl[1] + 180)], fill=col)

    # Connecting progress line
    draw.rectangle([(90, 500), (1160, 520)], fill=(220, 220, 220))
    draw.rectangle([(90, 500), (950, 520)], fill=(16, 149, 106))
    draw.text((90, 540), "Real-Time ETA Clock: Active Dynamic Countdown Timer (Format MM:SS)", fill=(0, 51, 102))

    img.save(out_path)

def create_all_figures():
    print("Preparing project figures and screenshots...")
    # 1. Project Hero Banner
    copy_or_process_image(HERO_IMG, os.path.join(FIGURES_DIR, "fig_1_1_hero.png"))
    
    # 2. Architecture Diagram
    create_system_architecture_diagram()
    
    # 3. ER Diagram
    create_er_diagram()
    
    # 4. Operational Flowchart
    create_operational_flowchart()
    
    # 5. Mission Stepper Diagram
    create_mission_stepper_diagram()
    
    # 6. Real project screenshots from .user_uploaded:
    copy_or_process_image(os.path.join(USER_UPLOADED_DIR, "media_1786355855446.png"), os.path.join(FIGURES_DIR, "fig_4_3_live_map.png"))
    copy_or_process_image(os.path.join(USER_UPLOADED_DIR, "media_1786420975521.png"), os.path.join(FIGURES_DIR, "fig_4_8_relief_ai.png"))
    copy_or_process_image(os.path.join(USER_UPLOADED_DIR, "media_1786421366931.png"), os.path.join(FIGURES_DIR, "fig_5_1_ai_chat.png"))
    copy_or_process_image(os.path.join(USER_UPLOADED_DIR, "media_1786420879630.png"), os.path.join(FIGURES_DIR, "fig_4_2_sos_ui.png"))
    copy_or_process_image(os.path.join(USER_UPLOADED_DIR, "media_1786421113356.png"), os.path.join(FIGURES_DIR, "fig_5_2_route_finder.png"))

    print("All 10+ project figures created and organized in:", FIGURES_DIR)

if __name__ == "__main__":
    create_all_figures()
