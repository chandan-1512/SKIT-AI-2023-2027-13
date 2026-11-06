
import subprocess
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, KeepTogether
)

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PROJECT_NAME = "SKIT-AI-2023-2027-13"
BRANCH = "main"

OUTPUT_DIR = "complete_reports"
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    f"{PROJECT_NAME}_GitHub_Commit_Report_{datetime.now():%Y-%m-%d}.pdf"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


# --------------------------------------------------
# FETCH COMMITS FROM MAIN BRANCH
# --------------------------------------------------

def get_commits():

    command = [
        "git", "log", BRANCH,
        "--date=format:%d-%m-%Y",
        "--pretty=format:%h|%an|%ad|%s"
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )

        commits = []

        for line in result.stdout.splitlines():
            parts = line.split("|", 3)

            if len(parts) == 4:
                commits.append(parts)

        return commits

    except subprocess.CalledProcessError as error:
        print("Git error:", error.stderr)
        return []


# --------------------------------------------------
# GENERATE PDF REPORT
# --------------------------------------------------

def generate_report():

    commits = get_commits()

    if not commits:
        print("No commits found on main branch.")
        return

    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=landscape(A4),
        rightMargin=10 * mm,
        leftMargin=10 * mm,
        topMargin=8 * mm,
        bottomMargin=8 * mm
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=17,
        leading=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#17365D"),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey,
        spaceAfter=8
    )

    cell_style = ParagraphStyle(
        "Cell",
        parent=styles["Normal"],
        fontSize=7,
        leading=8,
        alignment=TA_LEFT,
        wordWrap="CJK"
    )

    header_style = ParagraphStyle(
        "Header",
        parent=cell_style,
        fontSize=7,
        leading=8,
        textColor=colors.white
    )

    elements = []

    # Header
    elements.append(Paragraph(
        "GITHUB COMMIT PROGRESS REPORT",
        title_style
    ))

    elements.append(Paragraph(
        f"{PROJECT_NAME} | Branch: {BRANCH} | "
        f"Generated: {datetime.now():%d-%m-%Y}",
        subtitle_style
    ))

    # Summary
    first_date = commits[-1][2]
    latest_date = commits[0][2]

    summary_data = [
        ["Total Commits", "Branch", "First Commit", "Latest Commit"],
        [str(len(commits)), BRANCH, first_date, latest_date]
    ]

    summary = Table(
        summary_data,
        colWidths=[55 * mm, 45 * mm, 65 * mm, 65 * mm]
    )

    summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#EAF0F7")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    elements.append(summary)
    elements.append(Spacer(1, 7))

    elements.append(Paragraph(
        "Complete Commit History",
        ParagraphStyle(
            "Section",
            parent=styles["Heading2"],
            fontSize=10,
            textColor=colors.HexColor("#17365D"),
            spaceAfter=4
        )
    ))

    # Commit table
    table_data = [[
        Paragraph("<b>S.No.</b>", header_style),
        Paragraph("<b>Commit ID</b>", header_style),
        Paragraph("<b>Author</b>", header_style),
        Paragraph("<b>Date</b>", header_style),
        Paragraph("<b>Commit Message</b>", header_style)
    ]]

    for index, commit in enumerate(commits, start=1):
        commit_id, author, date, message = commit

        table_data.append([
            str(index),
            Paragraph(commit_id, cell_style),
            Paragraph(author.replace("&", "&amp;"), cell_style),
            Paragraph(date, cell_style),
            Paragraph(
                message.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"),
                cell_style
            )
        ])

    commit_table = Table(
        table_data,
        colWidths=[
            12 * mm,
            25 * mm,
            38 * mm,
            28 * mm,
            137 * mm
        ],
        repeatRows=1
    )

    commit_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17365D")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
            colors.white,
            colors.HexColor("#F1F4F8")
        ]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#B7C5D6")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    elements.append(commit_table)

    # Footer
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "Generated from Git commit history | "
        "Project: AI Powered Smart Contracts for Automated Decision Making",
        subtitle_style
    ))

    doc.build(elements)

    print(f"Report generated successfully: {OUTPUT_FILE}")
    print(f"Total commits: {len(commits)}")


if __name__ == "__main__":
    generate_report()
