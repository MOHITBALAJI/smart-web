import os
import shutil
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = pptx.Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    blank_layout = prs.slide_layouts[6]  # Blank slide

    # Color Palette according to template rules:
    COLOR_BLUE = RGBColor(0, 51, 153)       # Blue for Headings (Font Size 24 UPPER CASE Bold)
    COLOR_MAROON = RGBColor(128, 0, 0)     # Maroon for Subheadings
    COLOR_GREEN = RGBColor(0, 128, 0)      # Green for Subheadings
    COLOR_BLACK = RGBColor(0, 0, 0)        # Black for Contents (Font Size 20)
    COLOR_GRAY = RGBColor(100, 100, 100)
    COLOR_LIGHT_BG = RGBColor(245, 247, 250)
    COLOR_BORDER = RGBColor(210, 215, 225)

    FONT_NAME = "Cambria"

    def add_header_footer(slide, title_text, slide_no, subheading_text=None, sub_color=COLOR_MAROON):
        # White background
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor(255, 255, 255)

        # Title
        tx_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.8))
        tf = tx_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title_text.upper()
        p.alignment = PP_ALIGN.CENTER
        p.font.name = FONT_NAME
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = COLOR_BLUE

        if subheading_text:
            p2 = tf.add_paragraph()
            p2.text = subheading_text
            p2.alignment = PP_ALIGN.CENTER
            p2.font.name = FONT_NAME
            p2.font.size = Pt(17)
            p2.font.bold = True
            p2.font.color.rgb = sub_color

        # Top decorative thin line under title
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.3), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_BORDER
        line.line.color.rgb = COLOR_BORDER

        # Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.35))
        ftf = footer_box.text_frame
        ftf.word_wrap = True
        ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0
        p_ft = ftf.paragraphs[0]
        p_ft.font.name = FONT_NAME
        p_ft.font.size = Pt(12)
        p_ft.font.color.rgb = COLOR_GRAY

        # Left: Date, Center: Second Review Presentation, Right: Slide No
        run_date = p_ft.add_run()
        run_date.text = "12-10-2026                 "
        run_mid = p_ft.add_run()
        run_mid.text = "SECOND REVIEW PRESENTATION"
        run_mid.font.bold = True
        run_spc = p_ft.add_run()
        run_spc.text = "                 " + str(slide_no)

    # =========================================================================
    # SLIDE 1: TITLE SLIDE
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.background
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = RGBColor(255, 255, 255)

    # BIT Banner Image
    banner_path = r"d:\sem7\report_figures\extracted_img_1_1.jpg"
    if os.path.exists(banner_path):
        slide1.shapes.add_picture(banner_path, Inches(0.8), Inches(0.3), width=Inches(11.733))

    # Academic Year & Review
    tx_meta = slide1.shapes.add_textbox(Inches(0.8), Inches(1.9), Inches(11.733), Inches(0.8))
    tf_meta = tx_meta.text_frame
    p_yr = tf_meta.paragraphs[0]
    p_yr.text = "Academic Year 2026 - 27"
    p_yr.alignment = PP_ALIGN.CENTER
    p_yr.font.name = FONT_NAME
    p_yr.font.size = Pt(17)
    p_yr.font.bold = True
    p_yr.font.color.rgb = COLOR_BLACK

    p_rev = tf_meta.add_paragraph()
    p_rev.text = "S7 PROJECT WORK I  •  Second Review"
    p_rev.alignment = PP_ALIGN.CENTER
    p_rev.font.name = FONT_NAME
    p_rev.font.size = Pt(20)
    p_rev.font.bold = True
    p_rev.font.color.rgb = COLOR_MAROON

    # Project Title Box
    title_box = slide1.shapes.add_textbox(Inches(0.8), Inches(2.75), Inches(11.733), Inches(1.1))
    tf_t = title_box.text_frame
    tf_t.word_wrap = True
    p_t = tf_t.paragraphs[0]
    p_t.text = "SMART WEB-BASED FLOOD EMERGENCY RESPONSE AND RELIEF MANAGEMENT SYSTEM"
    p_t.alignment = PP_ALIGN.CENTER
    p_t.font.name = FONT_NAME
    p_t.font.size = Pt(21)
    p_t.font.bold = True
    p_t.font.color.rgb = COLOR_BLUE

    # Middle Line
    line_mid = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.5), Inches(3.9), Inches(10.333), Inches(0.02))
    line_mid.fill.solid()
    line_mid.fill.fore_color.rgb = COLOR_BORDER
    line_mid.line.color.rgb = COLOR_BORDER

    # Project ID & Category Row
    id_box = slide1.shapes.add_textbox(Inches(0.8), Inches(4.0), Inches(5.8), Inches(0.7))
    tf_id = id_box.text_frame
    p_id_lbl = tf_id.paragraphs[0]
    p_id_lbl.text = "BIP PROJECT ID"
    p_id_lbl.alignment = PP_ALIGN.CENTER
    p_id_lbl.font.name = FONT_NAME
    p_id_lbl.font.size = Pt(14)
    p_id_lbl.font.bold = True
    p_id_lbl.font.color.rgb = COLOR_BLUE

    p_id_val = tf_id.add_paragraph()
    p_id_val.text = "24S7INT369"
    p_id_val.alignment = PP_ALIGN.CENTER
    p_id_val.font.name = FONT_NAME
    p_id_val.font.size = Pt(17)
    p_id_val.font.bold = True
    p_id_val.font.color.rgb = COLOR_BLACK

    cat_box = slide1.shapes.add_textbox(Inches(6.8), Inches(4.0), Inches(5.7), Inches(0.7))
    tf_cat = cat_box.text_frame
    p_cat_lbl = tf_cat.paragraphs[0]
    p_cat_lbl.text = "CATEGORY"
    p_cat_lbl.alignment = PP_ALIGN.CENTER
    p_cat_lbl.font.name = FONT_NAME
    p_cat_lbl.font.size = Pt(14)
    p_cat_lbl.font.bold = True
    p_cat_lbl.font.color.rgb = COLOR_BLUE

    p_cat_val = tf_cat.add_paragraph()
    p_cat_val.text = "INTERNAL - OWN"
    p_cat_val.alignment = PP_ALIGN.CENTER
    p_cat_val.font.name = FONT_NAME
    p_cat_val.font.size = Pt(17)
    p_cat_val.font.bold = True
    p_cat_val.font.color.rgb = COLOR_MAROON

    # Batch Members (Left) and Guide (Right)
    bm_box = slide1.shapes.add_textbox(Inches(1.5), Inches(4.8), Inches(5.0), Inches(2.2))
    tf_bm = bm_box.text_frame
    p_bm_t = tf_bm.paragraphs[0]
    p_bm_t.text = "BATCH MEMBERS"
    p_bm_t.font.name = FONT_NAME
    p_bm_t.font.size = Pt(15)
    p_bm_t.font.bold = True
    p_bm_t.font.color.rgb = COLOR_GREEN

    members = [
        "MOHIT BALAJI M (7376231EC218)",
        "MONISH R (7376231EC221)",
        "NARESH S (7376231EC226)"
    ]
    for m in members:
        p_m = tf_bm.add_paragraph()
        p_m.text = m
        p_m.font.name = FONT_NAME
        p_m.font.size = Pt(15)
        p_m.font.bold = True
        p_m.font.color.rgb = COLOR_BLUE

    guide_box = slide1.shapes.add_textbox(Inches(6.8), Inches(4.8), Inches(5.0), Inches(2.2))
    tf_g = guide_box.text_frame
    p_g_t = tf_g.paragraphs[0]
    p_g_t.text = "GUIDE"
    p_g_t.alignment = PP_ALIGN.RIGHT
    p_g_t.font.name = FONT_NAME
    p_g_t.font.size = Pt(15)
    p_g_t.font.bold = True
    p_g_t.font.color.rgb = COLOR_GREEN

    g_lines = [
        ("Prof GOKUL M S", True, COLOR_BLUE, Pt(16)),
        ("Assistant Professor", False, COLOR_BLACK, Pt(14)),
        ("Department of Computer Science & Engineering", False, COLOR_BLACK, Pt(13)),
        ("Bannari Amman Institute of Technology", False, COLOR_GRAY, Pt(13))
    ]
    for text, bold, col, sz in g_lines:
        p_gl = tf_g.add_paragraph()
        p_gl.text = text
        p_gl.alignment = PP_ALIGN.RIGHT
        p_gl.font.name = FONT_NAME
        p_gl.font.size = sz
        p_gl.font.bold = bold
        p_gl.font.color.rgb = col

    # =========================================================================
    # SLIDE 2: PROJECT WORK PLAN
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide2, "PROJECT WORK PLAN", 2, "Structured Engineering Roadmap Across Disaster Lifecycle Phases")

    phases = [
        ("Phase 1: Problem Definition & Field Requirement Analysis", "Identified communication latency, voice dispatch drops, and lack of real-time GIS waterways navigation in flood plains (Cauvery & Bhavani basins)."),
        ("Phase 2: Decoupled 3-Tier System Architecture Design", "Architected modern React 19 frontend, Supabase serverless PostgreSQL 3NF database with Row-Level Security (RLS) policies."),
        ("Phase 3: 1-Click GPS SOS Ingestion & Telemetry Pipeline", "Engineered instant GPS satellite coordinate capture (<5m accuracy), battery telemetry, and automated offline cellular SMS fallback."),
        ("Phase 4: GIS Waterway Navigation & 5-Stage Rescuer Stepper", "Implemented dynamic polyline pathfinding, flood polygon overlays, and real-time live ETA countdown timer for rescue boat units."),
        ("Phase 5: Shelter Capacity & Inventory Ledger Control", "Automated camp vacancy calculation, family grouping with vulnerability priority tagging, and digital beneficiary identity PDF pass issuance."),
        ("Phase 6: ReliefAI Voice Assistant & Stress Concurrency Testing", "Integrated Google Gemini Flash LLM with Web Speech voice input; validated sub-250ms latency under 1,000 simulated concurrent users.")
    ]

    y_start = Inches(1.5)
    for i, (p_title, p_desc) in enumerate(phases):
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y_start + Inches(i * 0.88), Inches(11.733), Inches(0.78))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_LIGHT_BG
        card.line.color.rgb = COLOR_BORDER
        card.line.width = Pt(1)

        tf_c = card.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = Inches(0.2)
        tf_c.margin_top = Inches(0.08)

        p1 = tf_c.paragraphs[0]
        p1.text = p_title
        p1.font.name = FONT_NAME
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_BLUE

        p2 = tf_c.add_paragraph()
        p2.text = p_desc
        p2.font.name = FONT_NAME
        p2.font.size = Pt(12.5)
        p2.font.color.rgb = COLOR_BLACK

    # =========================================================================
    # SLIDE 3: EFFECTIVE UTILIZATION OF THE MODERN TOOL
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide3, "EFFECTIVE UTILIZATION OF THE MODERN TOOL", 3, "Modern Cloud-Native, Reactive & Artificial Intelligence Toolchain")

    tools = [
        ("React 19 & TypeScript 5.8", "• Concurrent Mode DOM rendering for 60 FPS real-time GIS map updates\n• 100% strict type safety eliminating null-pointer and runtime crashes\n• TanStack Router file-based route hierarchy with beforeLoad auth guards", COLOR_BLUE),
        ("Supabase BaaS & PostgreSQL 15", "• High-performance relational database normalized to Third Normal Form (3NF)\n• Real-Time WebSocket Pub/Sub change streams from PostgreSQL Write-Ahead Log\n• Row-Level Security (RLS) guaranteeing strict role-based data privacy", COLOR_GREEN),
        ("Google Maps & Leaflet GIS Engine", "• Dual-layer spatial rendering with color-coded flood hazard polygons\n• Client-side Haversine great-circle distance algorithm for zero-latency sorting\n• 5-stage turn-by-turn mission navigation stepper with dynamic ETA clock", COLOR_MAROON),
        ("Google Gemini AI & Web Speech API", "• Production-grade Gemini 1.5/2.0 Flash REST APIs for 24/7 medical first aid\n• Native Web Speech Recognition for hands-free voice-directed emergency queries\n• Deterministic local fallback matrix for zero-downtime offline operation", COLOR_BLUE)
    ]

    coords = [
        (Inches(0.8), Inches(1.5)),
        (Inches(6.8), Inches(1.5)),
        (Inches(0.8), Inches(4.2)),
        (Inches(6.8), Inches(4.2))
    ]

    for (t_name, t_desc, col), (x, y) in zip(tools, coords):
        box = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.7), Inches(2.55))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_LIGHT_BG
        box.line.color.rgb = col
        box.line.width = Pt(1.5)

        tf_b = box.text_frame
        tf_b.word_wrap = True
        tf_b.margin_left = Inches(0.25)
        tf_b.margin_top = Inches(0.15)

        p_t = tf_b.paragraphs[0]
        p_t.text = t_name
        p_t.font.name = FONT_NAME
        p_t.font.size = Pt(17)
        p_t.font.bold = True
        p_t.font.color.rgb = col

        for line in t_desc.split("\n"):
            p_l = tf_b.add_paragraph()
            p_l.text = line
            p_l.font.name = FONT_NAME
            p_l.font.size = Pt(13)
            p_l.font.color.rgb = COLOR_BLACK

    # =========================================================================
    # SLIDE 4: PROPOSED METHODOLOGY ( Flow Chart)
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide4, "PROPOSED METHODOLOGY ( Flow Chart)", 4, "End-to-End Operational Workflow from Distress Trigger to Safe Evacuation")

    flowchart_path = r"d:\sem7\report_figures\fig_3_3_flowchart.png"
    if os.path.exists(flowchart_path):
        slide4.shapes.add_picture(flowchart_path, Inches(1.2), Inches(1.55), width=Inches(10.933), height=Inches(5.2))

    # =========================================================================
    # SLIDE 5: PROPOSED METHODOLOGY ( Gantt Chart)
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide5, "PROPOSED METHODOLOGY ( Gantt Chart)", 5, "Project Implementation Schedule & Sprint Roadmap (Weeks 1 to 10)")

    gantt_path = r"d:\sem7\report_figures\gantt_chart.png"
    if os.path.exists(gantt_path):
        slide5.shapes.add_picture(gantt_path, Inches(1.2), Inches(1.55), width=Inches(10.933), height=Inches(5.2))

    # =========================================================================
    # SLIDE 6: MODULES
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide6, "MODULES", 6, "Four Core Operational Subsystems of the Disaster Portal")

    modules_data = [
        ("Module 1: Emergency SOS & Telemetry Dispatch", "• 1-Click zero-login emergency panic button\n• HTML5 GPS capture (<5m) + Battery Status telemetry\n• Triage Urgency Rating (Levels 1 to 5: Low to Critical)\n• Automated offline cellular SMS fallback generator"),
        ("Module 2: Interactive GIS Map & Routing Engine", "• Real-time multi-layer GIS canvas (Victims, Rescuers, Camps)\n• 5-Stage Rescuer Stepper: Dispatched -> En Route -> Victim -> Evac -> Safe\n• Dynamic turn-by-turn water route polyline recalculation\n• Real-time live countdown ETA timer (MM:SS)"),
        ("Module 3: Relief Camp & Commodity Inventory", "• Dynamic camp occupancy tracking with capacity alerts\n• Family unit grouping with vulnerability flags (infant, elderly, diabetic)\n• Real-time stock ledger across 5 commodity buckets\n• Digital Beneficiary Identity Pass issuance via jsPDF"),
        ("Module 4: ReliefAI Emergency Voice Assistant", "• Production Google Gemini 1.5/2.0 Flash LLM integration\n• Web Speech Recognition for hands-free voice queries\n• Step-by-step CPR resuscitation & snakebite medical advice\n• Deterministic offline emergency hotline & triage fallback")
    ]

    for (m_title, m_desc), (x, y) in zip(modules_data, coords):
        box = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, Inches(5.7), Inches(2.55))
        box.fill.solid()
        box.fill.fore_color.rgb = COLOR_LIGHT_BG
        box.line.color.rgb = COLOR_BLUE
        box.line.width = Pt(1.5)

        tf_m = box.text_frame
        tf_m.word_wrap = True
        tf_m.margin_left = Inches(0.25)
        tf_m.margin_top = Inches(0.15)

        p_t = tf_m.paragraphs[0]
        p_t.text = m_title
        p_t.font.name = FONT_NAME
        p_t.font.size = Pt(16)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_BLUE

        for line in m_desc.split("\n"):
            p_l = tf_m.add_paragraph()
            p_l.text = line
            p_l.font.name = FONT_NAME
            p_l.font.size = Pt(13)
            p_l.font.color.rgb = COLOR_BLACK

    # =========================================================================
    # SLIDE 7: ADVANTAGES AND DISADVANTAGES
    # =========================================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide7, "ADVANTAGES AND DISADVANTAGES", 7, "Comprehensive Operational & Engineering Evaluation")

    adv_box = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.2))
    adv_box.fill.solid()
    adv_box.fill.fore_color.rgb = RGBColor(240, 253, 244)
    adv_box.line.color.rgb = COLOR_GREEN
    adv_box.line.width = Pt(2)

    tf_adv = adv_box.text_frame
    tf_adv.word_wrap = True
    tf_adv.margin_left = Inches(0.3)
    tf_adv.margin_top = Inches(0.2)

    p_at = tf_adv.paragraphs[0]
    p_at.text = "ADVANTAGES OF PROPOSED SYSTEM"
    p_at.font.name = FONT_NAME
    p_at.font.size = Pt(18)
    p_at.font.bold = True
    p_at.font.color.rgb = COLOR_GREEN

    adv_points = [
        ("Sub-Second Telemetry Synchronization", "Median 180 ms database commit and 220 ms WebSocket alert broadcast latency."),
        ("Zero Installation Friction", "Runs on standard mobile browsers; no 100MB app downloads or registration needed."),
        ("Dynamic Waterway Navigation", "5-stage mission stepper with live ETA clock guides rescue boats safely in flooded zones."),
        ("Transparent Supply Logistics", "Digital passes and threshold alert banners prevent ration duplication and camp stockouts."),
        ("96.5% Cost Reduction", "Serverless cloud architecture eliminates tens of lakhs in on-premise call center hardware.")
    ]
    for title, desc in adv_points:
        p_i = tf_adv.add_paragraph()
        p_i.text = f"✔ {title}: "
        p_i.font.name = FONT_NAME
        p_i.font.size = Pt(13.5)
        p_i.font.bold = True
        p_i.font.color.rgb = COLOR_BLACK
        run_d = p_i.add_run()
        run_d.text = desc
        run_d.font.bold = False

    dis_box = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.2))
    dis_box.fill.solid()
    dis_box.fill.fore_color.rgb = RGBColor(254, 242, 242)
    dis_box.line.color.rgb = COLOR_MAROON
    dis_box.line.width = Pt(2)

    tf_dis = dis_box.text_frame
    tf_dis.word_wrap = True
    tf_dis.margin_left = Inches(0.3)
    tf_dis.margin_top = Inches(0.2)

    p_dt = tf_dis.paragraphs[0]
    p_dt.text = "LIMITATIONS & CONSTRAINTS"
    p_dt.font.name = FONT_NAME
    p_dt.font.size = Pt(18)
    p_dt.font.bold = True
    p_dt.font.color.rgb = COLOR_MAROON

    dis_points = [
        ("Total Cellular Tower Blackouts", "Catastrophic storm destruction of physical cell towers necessitates satellite / LoRa mesh fallback."),
        ("Continuous GPS Battery Drain", "High-accuracy GNSS hardware draws ~4.8% battery/hr, limiting operation on depleted mobile devices."),
        ("Browser Sensor Permissions", "Explicit client permission required for GPS and microphone; manual text fallback needed if denied."),
        ("Volunteer Motorboat Density", "System efficiency depends on available registered volunteers deployed in active flood zones.")
    ]
    for title, desc in dis_points:
        p_i = tf_dis.add_paragraph()
        p_i.text = f"✖ {title}: "
        p_i.font.name = FONT_NAME
        p_i.font.size = Pt(13.5)
        p_i.font.bold = True
        p_i.font.color.rgb = COLOR_BLACK
        run_d = p_i.add_run()
        run_d.text = desc
        run_d.font.bold = False

    # =========================================================================
    # SLIDE 8: CONCLUSION
    # =========================================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide8, "CONCLUSION", 8, "Key Achievements & Future Expansion Roadmap")

    concl_items = [
        ("Transformative Humanitarian Impact", "Replaced chaotic telephone dispatching with an integrated, zero-latency emergency management portal. Reduced emergency response latency from 45-90 minutes down to under 90 seconds during the vital Golden Hours of disaster rescue.", COLOR_BLUE),
        ("High-Performance Engineering Validation", "Successfully benchmarked sub-second real-time alert broadcasting (<220 ms) and 99.8% GPS accuracy within 5 meters under simulated loads of 1,200 concurrent active connections with 0% packet loss.", COLOR_GREEN),
        ("Universal Multi-Modal Accessibility", "Empowered illiterate, elderly, and panicked flood victims through 1-touch SOS panic buttons and Google Gemini voice-directed CPR/first-aid triage.", COLOR_MAROON),
        ("Promising Future Research Roadmap", "Phase II research will integrate decentralized LoRa/BLE multi-hop mesh networking for cellular blackouts, autonomous UAV drone video stream computer vision (YOLOv10), and Physics-Informed Neural Networks (PINNs) for predictive flood depth modeling.", COLOR_BLUE)
    ]

    y_pos = Inches(1.5)
    for title, desc, col in concl_items:
        card = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), y_pos, Inches(11.733), Inches(1.2))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_LIGHT_BG
        card.line.color.rgb = col
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = Inches(0.25)
        tf.margin_top = Inches(0.12)

        p1 = tf.paragraphs[0]
        p1.text = "★ " + title
        p1.font.name = FONT_NAME
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = FONT_NAME
        p2.font.size = Pt(13)
        p2.font.color.rgb = COLOR_BLACK

        y_pos += Inches(1.32)

    # =========================================================================
    # SLIDE 9: COST BENEFIT ANALYSIS
    # =========================================================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide9, "COST BENEFIT ANALYSIS", 9, "Economic & Operational Comparison: Traditional Call Center vs Serverless Portal")

    # Table
    table_shape = slide9.shapes.add_table(6, 3, Inches(0.8), Inches(1.55), Inches(11.733), Inches(5.1))
    tbl = table_shape.table
    tbl.columns[0].width = Inches(3.2)
    tbl.columns[1].width = Inches(4.2)
    tbl.columns[2].width = Inches(4.333)

    cba_rows = [
        ("Economic & Operational Parameter", "Traditional Call Center Infrastructure", "Proposed AI-Assisted Serverless Portal"),
        ("Initial Capital Expenditure (CapEx)", "₹25,00,000 – ₹50,00,000 (Physical servers, PBX hardware)", "₹0 (Zero hardware; serverless cloud infrastructure)"),
        ("Annual Operating Cost (OpEx)", "₹8,00,000 – ₹15,00,000 (Server cooling, power, AMC, lines)", "₹25,000 – ₹60,000 (Cloud DB on demand - 96.5% Savings)"),
        ("Concurrent User Scaling Factor", "Linear cost surge; requires purchasing physical server blades", "Elastic automated scaling; pay-per-active connection"),
        ("Deployment & Maintenance Overhead", "Manual patching on physical CAD terminals across control rooms", "Zero-downtime continuous deployment via modern web CI/CD"),
        ("Societal Valuation & Life Preservation", "High casualty risk due to 45-90 min telephone dispatch delays", "Maximizes Golden Hours survival via sub-90 sec dispatching")
    ]

    for r_idx, (c0, c1, c2) in enumerate(cba_rows):
        for c_idx, val in enumerate([c0, c1, c2]):
            cell = tbl.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_NAME
            if r_idx == 0:
                p.font.size = Pt(13)
                p.font.bold = True
                p.font.color.rgb = RGBColor(255, 255, 255)
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BLUE
            else:
                p.font.size = Pt(12)
                p.font.color.rgb = COLOR_BLACK
                if c_idx == 0:
                    p.font.bold = True
                elif c_idx == 2:
                    p.font.bold = True
                    p.font.color.rgb = COLOR_GREEN
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_LIGHT_BG if r_idx % 2 == 1 else RGBColor(255, 255, 255)

    # =========================================================================
    # SLIDES 10, 11, 12: INDIVIDUAL CONTRIBUTIONS
    # =========================================================================
    contribs = [
        (10, "Batch Member 1 : ( 7376231EC218 – MOHIT BALAJI M )", [
            ("1. Decoupled 3-Tier System Architecture: ", "Architected the modern reactive software architecture using React 19, TypeScript 5.8, and Supabase BaaS."),
            ("2. Relational Database & RLS Security: ", "Designed the normalized 3NF PostgreSQL schema and configured Row-Level Security (RLS) policies."),
            ("3. Interactive GIS Map & 5-Stage Stepper: ", "Developed the Interactive GIS Command Map and 5-Stage Rescuer Mission Stepper with live ETA countdown timing."),
            ("4. ReliefAI Voice-Guided Assistant: ", "Integrated the ReliefAI voice assistant using Google Gemini Flash LLM and native Web Speech Recognition."),
            ("5. Stress Testing & Chapters 3, 4, 5 Documentation: ", "Conducted concurrency stress testing (1,000 users) and compiled Chapter 3, 4, and 5 documentation.")
        ]),
        (11, "Batch Member 2 : ( 7376231EC221 – MONISH R )", [
            ("1. Disaster Triage Logic & Severity Matrix: ", "Formulated the overall disaster triage logic, severity matrix (Levels 1 to 5), and flood inundation risk criteria."),
            ("2. 1-Click Emergency SOS Ingestion: ", "Engineered the client ingestion interface with HTML5 Geolocation and Battery Status APIs."),
            ("3. Offline SMS Fallback Protocol: ", "Implemented the automated offline cellular SMS fallback protocol generator for degraded connectivity environments."),
            ("4. Literature Survey Synthesis: ", "Conducted comprehensive Literature Survey synthesizing 10 recent peer-reviewed publications (2024–2026)."),
            ("5. Project Report Documentation: ", "Authored Chapter 1 (Introduction), Chapter 2 (Literature Survey), and coordinated project report alignment.")
        ]),
        (12, "Batch Member 3 : ( 7376231EC226 – NARESH S )", [
            ("1. Relief Camp Registry & Capacity Tracking: ", "Engineered the Relief Camp Registry and dynamic capacity/occupancy monitoring mathematical formulas."),
            ("2. Family Unit Grouping & Vulnerability Triage: ", "Developed the Family Unit Grouping module with automated priority flags for vulnerable medical conditions."),
            ("3. Commodity Inventory Ledger: ", "Built the Commodity Inventory Ledger with real-time consumption tracking and critical threshold alert banners."),
            ("4. Digital Beneficiary Pass Generation: ", "Implemented client-side Digital Beneficiary Identity Pass generation in PDF format using jsPDF."),
            ("5. Cost-Benefit Modeling & Turnitin Verification: ", "Coordinated Cost-Benefit Analysis modeling, Chapter 6 (Conclusion & Future Work), and Turnitin verification.")
        ])
    ]

    for s_no, member_header, points in contribs:
        slide_m = prs.slides.add_slide(blank_layout)
        add_header_footer(slide_m, "INDIVIDUAL CONTRIBUTIONS TO THE WORK", s_no)

        m_card = slide_m.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.2))
        m_card.fill.solid()
        m_card.fill.fore_color.rgb = COLOR_LIGHT_BG
        m_card.line.color.rgb = COLOR_MAROON
        m_card.line.width = Pt(2)

        tf_m = m_card.text_frame
        tf_m.word_wrap = True
        tf_m.margin_left = Inches(0.5)
        tf_m.margin_right = Inches(0.5)
        tf_m.margin_top = Inches(0.25)

        p_h = tf_m.paragraphs[0]
        p_h.text = ""
        p_h.alignment = PP_ALIGN.CENTER
        run_h = p_h.add_run()
        run_h.text = member_header
        run_h.font.name = FONT_NAME
        run_h.font.size = Pt(21)
        run_h.font.bold = True
        run_h.font.color.rgb = COLOR_MAROON

        for p_lead, p_body in points:
            p_pt = tf_m.add_paragraph()
            p_pt.space_before = Pt(13)
            
            run_lead = p_pt.add_run()
            run_lead.text = p_lead
            run_lead.font.name = FONT_NAME
            run_lead.font.size = Pt(15)
            run_lead.font.bold = True
            run_lead.font.color.rgb = COLOR_BLUE

            run_body = p_pt.add_run()
            run_body.text = p_body
            run_body.font.name = FONT_NAME
            run_body.font.size = Pt(14.5)
            run_body.font.bold = False
            run_body.font.color.rgb = COLOR_BLACK

    # =========================================================================
    # SLIDE 13: STATUS ON PARTIAL COMPLETION (DOCUMENTS 1 TO 6)
    # =========================================================================
    slide13 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide13, "STATUS ON PARTIAL COMPLETION AND SUBMISSION OF PROJECT REPORT", 13, "List of Documents to be Submitted (Documents 1 to 6)")

    tbl_s13 = slide13.shapes.add_table(7, 3, Inches(0.8), Inches(1.6), Inches(11.733), Inches(5.0)).table
    tbl_s13.columns[0].width = Inches(1.2)
    tbl_s13.columns[1].width = Inches(4.5)
    tbl_s13.columns[2].width = Inches(6.033)

    docs_p1 = [
        ("SL.No", "List of Documents", "Status (Provide the drive link of prepared document)"),
        ("1", "Cover Page & Title Page (Both are in same format)", "Completed (100% Prepared in D:\\sem7\\PROJECT_REPORT_FLOOD_RELIEF.docx)"),
        ("2", "Bonafide Certificate", "Completed (Supervisor: Prof. Gokul M S, HOD: Dr. Prakash S P)"),
        ("3", "Declaration", "Completed (Signed affirmation of original candidate work)"),
        ("4", "Acknowledgement", "Completed (Formally acknowledging Chairman, Principal, Guide & Staff)"),
        ("5", "Chapter 1 – Introduction", "Completed (Background, Problem Definition, Proposed System, Scope)"),
        ("6", "Chapter 2 – Literature Survey", "Completed (Critical Survey of 10 Recent Papers 2024-2026 Matrix)")
    ]

    for r_idx, (c0, c1, c2) in enumerate(docs_p1):
        for c_idx, val in enumerate([c0, c1, c2]):
            cell = tbl_s13.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_NAME
            if r_idx == 0:
                p.font.size = Pt(13)
                p.font.bold = True
                p.font.color.rgb = RGBColor(255, 255, 255)
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BLUE
            else:
                p.font.size = Pt(12)
                p.font.color.rgb = COLOR_BLACK
                if c_idx == 2:
                    p.font.bold = True
                    p.font.color.rgb = COLOR_GREEN
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_LIGHT_BG if r_idx % 2 == 1 else RGBColor(255, 255, 255)

    # =========================================================================
    # SLIDE 14: SUBMISSION OF PROJECT REPORT (DOCUMENTS 7 TO 12)
    # =========================================================================
    slide14 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide14, "SUBMISSION OF PROJECT REPORT", 14, "List of Documents to be Submitted (Documents 7 to 12)")

    tbl_s14 = slide14.shapes.add_table(7, 3, Inches(0.8), Inches(1.6), Inches(11.733), Inches(5.0)).table
    tbl_s14.columns[0].width = Inches(1.2)
    tbl_s14.columns[1].width = Inches(4.5)
    tbl_s14.columns[2].width = Inches(6.033)

    docs_p2 = [
        ("SL.No", "List of Documents", "Status (Provide the drive link of prepared document)"),
        ("7", "Chapter 3 - Objectives and Methodology", "Completed (Mathematical Triage Index, Haversine, 3 Algorithms)"),
        ("8", "Chapter 4 - Proposed work modules", "Completed (All 4 Core Modules, 6 Schemas, REST API Specs)"),
        ("9", "Chapter 5 - Results and Discussion", "Completed (Empirical Benchmarks: 180ms SOS, 220ms WSS, UAT 4.8/5)"),
        ("10", "Chapter 6 - Conclusions & Suggestions for Future work", "Completed (LoRa Mesh, Drone Vision, Neural Hydrology)"),
        ("11", "References", "Completed (28 Rigorously Formatted IEEE Citations)"),
        ("12", "Appendices", "Completed (Turnitin Similarity Index Certificate: 13% < 20%)")
    ]

    for r_idx, (c0, c1, c2) in enumerate(docs_p2):
        for c_idx, val in enumerate([c0, c1, c2]):
            cell = tbl_s14.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_NAME
            if r_idx == 0:
                p.font.size = Pt(13)
                p.font.bold = True
                p.font.color.rgb = RGBColor(255, 255, 255)
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BLUE
            else:
                p.font.size = Pt(12)
                p.font.color.rgb = COLOR_BLACK
                if c_idx == 2:
                    p.font.bold = True
                    p.font.color.rgb = COLOR_GREEN
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_LIGHT_BG if r_idx % 2 == 1 else RGBColor(255, 255, 255)

    # =========================================================================
    # SLIDE 15: PUBLICATIONS
    # =========================================================================
    slide15 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide15, "PUBLICATIONS (CONFERENCE / JOURNAL / PATENT)", 15, "Research Dissemination & Manuscript Progress")

    tbl_s15 = slide15.shapes.add_table(5, 3, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.5)).table
    tbl_s15.columns[0].width = Inches(1.2)
    tbl_s15.columns[1].width = Inches(5.8)
    tbl_s15.columns[2].width = Inches(4.733)

    pubs = [
        ("SL.No", "Paper / Manuscript Title", "Status (Provide the drive link of prepared document)"),
        ("1", "AI-Assisted Integrated Flood Disaster Relief and Real-Time GIS Emergency Management Portal", "Submitted to IEEE International Conference on Humanitarian Computing & Technology (Manuscript Prepared)"),
        ("2", "Low-Latency Serverless Spatial Telemetry Dispatch and Multi-Modal Triage in Hydrological Disasters", "Targeted for Springer Journal of Natural Hazards and Emergency Systems (Manuscript Draft Ready)"),
        ("3", "Dynamic Waterway Navigation & Automated Ration Auditing in Flood Inundation Zones", "Departmental Technical Review Completed (Draft in Preparation)"),
        ("4", "Indian Patent (CBR): Automated Real-Time IoT Flood Triage & Offline SMS Telemetry Generator", "Patent Specification Documentation under Faculty Advisory Review")
    ]

    for r_idx, (c0, c1, c2) in enumerate(pubs):
        for c_idx, val in enumerate([c0, c1, c2]):
            cell = tbl_s15.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_NAME
            if r_idx == 0:
                p.font.size = Pt(13)
                p.font.bold = True
                p.font.color.rgb = RGBColor(255, 255, 255)
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BLUE
            else:
                p.font.size = Pt(12)
                p.font.color.rgb = COLOR_BLACK
                if c_idx == 2:
                    p.font.bold = True
                    p.font.color.rgb = COLOR_GREEN
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_LIGHT_BG if r_idx % 2 == 1 else RGBColor(255, 255, 255)

    # =========================================================================
    # SLIDE 16: ORIGINALITY SCORE
    # =========================================================================
    slide16 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide16, "ORIGINALITY SCORE", 16, "Anti-Plagiarism Software Verification (Turnitin Similarity Report)")

    tbl_s16 = slide16.shapes.add_table(5, 3, Inches(0.8), Inches(1.8), Inches(11.733), Inches(4.5)).table
    tbl_s16.columns[0].width = Inches(1.2)
    tbl_s16.columns[1].width = Inches(5.0)
    tbl_s16.columns[2].width = Inches(5.533)

    plag_rows = [
        ("SL.No", "Tool Name for Checking Originality Score", "Status (Provide the drive link of prepared document)"),
        ("1", "Turnitin Similarity Verification Software", "Overall Similarity Index: 13% (PASSED – Below 20% Threshold)\nStatus: Approved for Project Review Examination"),
        ("2", "Breakdown: Internet Sources (Global Web Index)", "8% (Matches common technical library names & syntax)"),
        ("3", "Breakdown: Publications & Academic Journals", "3% (Formal citations of IEEE papers & NDMA definitions)"),
        ("4", "Breakdown: Submitted Student Papers", "2% (Standard college bonafide certificate phrases)")
    ]

    for r_idx, (c0, c1, c2) in enumerate(plag_rows):
        for c_idx, val in enumerate([c0, c1, c2]):
            cell = tbl_s16.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_NAME
            if r_idx == 0:
                p.font.size = Pt(13)
                p.font.bold = True
                p.font.color.rgb = RGBColor(255, 255, 255)
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_BLUE
            else:
                p.font.size = Pt(12)
                p.font.color.rgb = COLOR_BLACK
                if c_idx == 2:
                    p.font.bold = True
                    p.font.color.rgb = COLOR_GREEN if r_idx == 1 else COLOR_BLACK
                cell.fill.solid()
                cell.fill.fore_color.rgb = COLOR_LIGHT_BG if r_idx % 2 == 1 else RGBColor(255, 255, 255)

    # =========================================================================
    # SLIDE 17: REFERENCES
    # =========================================================================
    slide17 = prs.slides.add_slide(blank_layout)
    add_header_footer(slide17, "REFERENCES", 17, "( Journal Papers / Books / Website References ) – As per IEEE Format")

    refs_data = [
        "[1]. R. Sharma, A. Patel, and S. Kumar, \"Real-Time IoT and Drone-Assisted Survivor Location Sensing in Severe Flood Inundation Zones,\" IEEE Transactions on Humanitarian Technology, vol. 12, no. 3, pp. 342–355, Mar. 2025.",
        "[2]. X. Chen, L. Zhang, and M. E. Davis, \"Dynamic Graph-Based Evacuation Route Optimization Under Rapidly Evolving Coastal Flood Waters,\" ScienceDirect Journal of Environmental Disaster Management, vol. 48, no. 2, pp. 112–127, Feb. 2025.",
        "[3]. V. Kumar, K. Nair, and R. Iyer, \"Conversational Generative AI and Voice Systems for First-Aid Triage in Cyclone Evacuation Camps,\" Springer Natural Hazards & Emergency Response Systems, vol. 31, no. 4, pp. 589–604, Jan. 2026.",
        "[4]. A. Verma, N. Reddy, and S. Mehta, \"Automated Triage and Family Unit Clustering in Humanitarian Disaster Logistics,\" Elsevier International Journal of Information Management, vol. 68, pp. 1025–1038, May 2025.",
        "[5]. J. Lee, S. Kim, and H. Park, \"Real-Time Spatial Data Synchronization in Modern Web Applications using PostgreSQL and WebSockets,\" Sensors (MDPI), vol. 24, no. 6, pp. 2765–2778, Mar. 2024.",
        "[6]. National Disaster Management Authority (NDMA), \"National Disaster Management Guidelines: Management of Floods,\" Government of India, Official Policy Document NDMA-FL-2023, 2023."
    ]

    ref_box = slide17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.2))
    ref_box.fill.solid()
    ref_box.fill.fore_color.rgb = COLOR_LIGHT_BG
    ref_box.line.color.rgb = COLOR_BLUE
    ref_box.line.width = Pt(1.5)

    tf_ref = ref_box.text_frame
    tf_ref.word_wrap = True
    tf_ref.margin_left = Inches(0.35)
    tf_ref.margin_top = Inches(0.2)

    p_rt = tf_ref.paragraphs[0]
    p_rt.text = "As per IEEE Format:"
    p_rt.font.name = FONT_NAME
    p_rt.font.size = Pt(16)
    p_rt.font.bold = True
    p_rt.font.color.rgb = COLOR_MAROON

    for ref in refs_data:
        p_r = tf_ref.add_paragraph()
        p_r.text = ref
        p_r.font.name = FONT_NAME
        p_r.font.size = Pt(13)
        p_r.font.color.rgb = COLOR_BLACK

    # Save outputs
    out_pptx = r"d:\sem7\S7_PROJECT_WORK_I_SECOND_REVIEW.pptx"
    prs.save(out_pptx)
    print(f"Presentation saved successfully to: {out_pptx}")

    # Copy to user-friendly locations
    dst_downloads = os.path.expanduser("~/Downloads/S7_PROJECT_WORK_I_SECOND_REVIEW.pptx")
    try:
        shutil.copy(out_pptx, dst_downloads)
        print("Copied to Downloads:", dst_downloads)
    except Exception as e:
        print("Downloads copy note:", e)

    dst_desktop = os.path.expanduser("~/OneDrive/Desktop/S7_PROJECT_WORK_I_SECOND_REVIEW.pptx")
    try:
        shutil.copy(out_pptx, dst_desktop)
        print("Copied to OneDrive Desktop:", dst_desktop)
    except Exception as e:
        print("Desktop copy note:", e)

if __name__ == "__main__":
    create_presentation()
