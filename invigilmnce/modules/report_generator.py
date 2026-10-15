"""
Generates a post-exam PDF summary report using ReportLab: session overview,
violation counts table, and a timeline of every flagged event.
"""
import os
import time
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
)

from modules import config


def generate_report(student_id: str, events: list, session_start: float, session_end: float) -> str:
    ts = time.strftime("%Y%m%d_%H%M%S")
    out_path = os.path.join(config.REPORTS_DIR, f"{student_id}_report_{ts}.pdf")

    doc = SimpleDocTemplate(out_path, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleBig", parent=styles["Title"], fontSize=20)
    elements = []

    elements.append(Paragraph("InvigiLMNce — Exam Proctoring Report", title_style))
    elements.append(Spacer(1, 0.4 * cm))

    duration_min = max(0, (session_end - session_start) / 60.0)
    meta_data = [
        ["Student ID", student_id],
        ["Session Start", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(session_start))],
        ["Session End", time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(session_end))],
        ["Duration (minutes)", f"{duration_min:.1f}"],
        ["Total Flagged Events", str(len(events))],
    ]
    meta_table = Table(meta_data, colWidths=[6 * cm, 9 * cm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#1f2933")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 0.8 * cm))

    # Violation-type summary
    counts = {}
    for e in events:
        counts[e["violation_type"]] = counts.get(e["violation_type"], 0) + 1

    elements.append(Paragraph("Violation Summary", styles["Heading2"]))
    if counts:
        summary_rows = [["Violation Type", "Count"]] + [
            [v_type, str(c)] for v_type, c in sorted(counts.items(), key=lambda x: -x[1])
        ]
        summary_table = Table(summary_rows, colWidths=[9 * cm, 6 * cm])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ]))
        elements.append(summary_table)
    else:
        elements.append(Paragraph("No violations were recorded during this session.", styles["Normal"]))
    elements.append(Spacer(1, 0.8 * cm))

    # Detailed timeline
    elements.append(Paragraph("Event Timeline", styles["Heading2"]))
    if events:
        timeline_rows = [["Time", "Type", "Detail"]]
        for e in events:
            timeline_rows.append([e["timestamp"], e["violation_type"], e["detail"]])
        timeline_table = Table(timeline_rows, colWidths=[4 * cm, 4.5 * cm, 6.5 * cm], repeatRows=1)
        timeline_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.append(timeline_table)
    else:
        elements.append(Paragraph("No events to display.", styles["Normal"]))

    # Attach up to 6 sample screenshots as evidence
    screenshots = [e.get("screenshot_path") for e in events if e.get("screenshot_path")]
    screenshots = [p for p in screenshots if os.path.exists(p)][:6]
    if screenshots:
        elements.append(Spacer(1, 0.8 * cm))
        elements.append(Paragraph("Sample Evidence Screenshots", styles["Heading2"]))
        for p in screenshots:
            elements.append(Spacer(1, 0.3 * cm))
            elements.append(RLImage(p, width=10 * cm, height=7.5 * cm))
            elements.append(Paragraph(os.path.basename(p), styles["Normal"]))

    doc.build(elements)
    return out_path
