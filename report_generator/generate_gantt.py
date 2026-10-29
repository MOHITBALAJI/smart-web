import os
from PIL import Image, ImageDraw, ImageFont

def generate_gantt_chart():
    width = 1200
    height = 600
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rectangle([(10, 10), (width - 10, height - 10)], outline=(180, 180, 180), width=2)

    # Title Banner
    draw.rectangle([(10, 10), (width - 10, 60)], fill=(0, 51, 153))
    draw.text((30, 20), "PROJECT IMPLEMENTATION SCHEDULE (GANTT CHART)", fill=(255, 255, 255))

    # Column Headers: Task Name (320px) + Weeks 1 to 10 (80px each = 800px)
    weeks = [f"Week {i}" for i in range(1, 11)]
    draw.rectangle([(20, 75), (340, 115)], fill=(235, 240, 250), outline=(200, 200, 200))
    draw.text((30, 85), "Work Phase / Milestone", fill=(0, 51, 153))

    x_start = 345
    for i, w in enumerate(weeks):
        draw.rectangle([(x_start + i * 82, 75), (x_start + (i + 1) * 82 - 4, 115)], fill=(240, 245, 255), outline=(210, 210, 210))
        draw.text((x_start + i * 82 + 10, 85), f"W{i+1}", fill=(40, 40, 40))

    # Tasks and active weeks
    tasks = [
        ("Phase 1: Literature Survey & Triage Requirements", 0, 2, (59, 130, 246)),
        ("Phase 2: Database Schema & Supabase RLS Policies", 1, 3, (16, 185, 129)),
        ("Phase 3: 1-Click GPS SOS Ingestion & SMS Fallback", 2, 5, (234, 88, 12)),
        ("Phase 4: Interactive GIS Map & Stepper Navigation", 4, 7, (139, 92, 246)),
        ("Phase 5: Relief Camp, Family & Inventory Ledger", 5, 8, (236, 72, 153)),
        ("Phase 6: ReliefAI Gemini Voice & First-Aid Assistant", 6, 9, (14, 165, 233)),
        ("Phase 7: Concurrency Stress Testing & UAT", 8, 10, (245, 158, 11)),
        ("Phase 8: Project Report, Review & Documentation", 8, 10, (16, 149, 106)),
    ]

    y_pos = 130
    for task_name, start_wk, end_wk, color in tasks:
        # Task label
        draw.rectangle([(20, y_pos), (340, y_pos + 42)], fill=(250, 250, 250), outline=(230, 230, 230))
        draw.text((30, y_pos + 12), task_name[:42], fill=(30, 30, 30))

        # Grid lines for all weeks
        for i in range(10):
            draw.rectangle([(x_start + i * 82, y_pos), (x_start + (i + 1) * 82 - 4, y_pos + 42)], outline=(240, 240, 240))

        # Filled bar for active duration
        bar_x1 = x_start + start_wk * 82 + 4
        bar_x2 = x_start + end_wk * 82 - 8
        draw.rounded_rectangle([(bar_x1, y_pos + 8), (bar_x2, y_pos + 34)], radius=6, fill=color)

        y_pos += 52

    out_file = r"d:\sem7\report_figures\gantt_chart.png"
    img.save(out_file)
    print(f"Gantt chart successfully saved to {out_file}")

if __name__ == "__main__":
    generate_gantt_chart()
