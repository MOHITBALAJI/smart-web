import docx
import os
import shutil
from docx.enum.section import WD_SECTION_START
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
from docx.enum.text import WD_ALIGN_PARAGRAPH

from report_generator.styles import setup_document_styles, apply_section_margins
from report_generator.preliminaries import build_front_matter, build_preliminaries_with_roman
from report_generator.chapter1 import build_chapter1
from report_generator.chapter2 import build_chapter2
from report_generator.chapter3 import build_chapter3
from report_generator.chapter4 import build_chapter4
from report_generator.chapter5 import build_chapter5
from report_generator.chapter6_8 import (
    build_chapter6,
    build_chapter7,
    build_chapter8,
    build_chapter9,
    build_outcome_certification
)

def clear_section_numbering(section):
    for child in section._sectPr.findall(qn('w:pgNumType')):
        section._sectPr.remove(child)

def set_section_numbering(section, fmt="decimal", start=1):
    clear_section_numbering(section)
    pg_num = parse_xml(f'<w:pgNumType {nsdecls("w")} w:start="{start}" w:fmt="{fmt}"/>')
    section._sectPr.append(pg_num)

def add_centered_page_number_field(footer):
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0]
    p.text = ""
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fldSimple = OxmlElement('w:fldSimple')
    fldSimple.set(qn('w:instr'), 'PAGE')
    p._p.append(fldSimple)

def generate_docx():
    print("Initializing document creation...")
    doc = docx.Document()
    
    # -------------------------------------------------------------
    # SECTION 1: FRONT MATTER (Cover, Bonafide, Declaration, Ack)
    # NO page numbers in footer.
    # -------------------------------------------------------------
    sec1 = doc.sections[0]
    apply_section_margins(sec1)
    clear_section_numbering(sec1)
    sec1.footer.is_linked_to_previous = False
    sec1.footer.paragraphs[0].text = ""

    print("Generating Front Matter (Cover, Bonafide, Declaration, Ack - No Page Numbers)...")
    build_front_matter(doc)

    # -------------------------------------------------------------
    # SECTION 2: PRELIMINARIES (Abstract, TOC, LOF, LOT)
    # Numbered with lowercase Roman numerals (i, ii, iii, iv, v, vi)
    # Starts at 'i' on Abstract!
    # -------------------------------------------------------------
    sec2 = doc.add_section(WD_SECTION_START.NEW_PAGE)
    apply_section_margins(sec2)
    set_section_numbering(sec2, fmt="lowerRoman", start=1)
    add_centered_page_number_field(sec2.footer)

    print("Generating Preliminaries (Abstract to List of Figures - Roman Numerals i, ii, iii)...")
    build_preliminaries_with_roman(doc)

    # -------------------------------------------------------------
    # SECTION 3: CHAPTERS 1 TO 8 (Main Report Body)
    # Numbered with Arabic numerals (1, 2, 3...) starting at 1 on Chapter 1!
    # -------------------------------------------------------------
    sec3 = doc.add_section(WD_SECTION_START.NEW_PAGE)
    apply_section_margins(sec3)
    set_section_numbering(sec3, fmt="decimal", start=1)
    add_centered_page_number_field(sec3.footer)

    print("Generating Chapter 1: Introduction (Starts at page 1)...")
    build_chapter1(doc)
    doc.add_page_break()
    
    print("Generating Chapter 2: Literature Survey...")
    build_chapter2(doc)
    doc.add_page_break()
    
    print("Generating Chapter 3: Objectives and Methodology...")
    build_chapter3(doc)
    doc.add_page_break()
    
    print("Generating Chapter 4: Proposed Work Modules...")
    build_chapter4(doc)
    doc.add_page_break()
    
    print("Generating Chapter 5: Result and Discussion...")
    build_chapter5(doc)
    doc.add_page_break()
    
    print("Generating Chapter 6: Conclusion & Suggestions for Future Work...")
    build_chapter6(doc)
    doc.add_page_break()
    
    print("Generating Chapter 7: Individual Contributions (Before References)...")
    build_chapter7(doc)
    doc.add_page_break()
    
    print("Generating Chapter 8: References...")
    build_chapter8(doc)
    doc.add_page_break()
    
    print("Generating Chapter 9: Plagiarism Report...")
    build_chapter9(doc)
    doc.add_page_break()
    
    print("Generating Outcome Certification (with 2 empty pages)...")
    build_outcome_certification(doc)

    # Re-verify margins across all 3 sections
    for s in doc.sections:
        apply_section_margins(s)

    output_docx = os.path.join("d:\\sem7", "PROJECT_REPORT_FLOOD_RELIEF.docx")
    doc.save(output_docx)
    print(f"Successfully generated DOCX report at: {output_docx}")

    # Copy to Desktop and Downloads (with both names so locked files won't prevent updating)
    dst_desktop = os.path.expanduser("~/OneDrive/Desktop/PROJECT_REPORT_FLOOD_RELIEF.docx")
    try:
        shutil.copy(output_docx, dst_desktop)
        print("Copied updated DOCX to OneDrive Desktop:", dst_desktop)
    except Exception as e:
        print("Desktop copy note:", e)

    dst_downloads_final = os.path.expanduser("~/Downloads/PROJECT_REPORT_FLOOD_RELIEF_FINAL.docx")
    try:
        shutil.copy(output_docx, dst_downloads_final)
        print("Copied fresh updated DOCX to Downloads as PROJECT_REPORT_FLOOD_RELIEF_FINAL.docx")
    except Exception as e:
        print("Downloads FINAL copy note:", e)

    dst_downloads = os.path.expanduser("~/Downloads/PROJECT_REPORT_FLOOD_RELIEF.docx")
    try:
        shutil.copy(output_docx, dst_downloads)
        print("Copied updated DOCX to Downloads:", dst_downloads)
    except Exception as e:
        print("Downloads copy note (may be currently open in Word):", e)

if __name__ == "__main__":
    generate_docx()
