
import subprocess
from collections import defaultdict
import datetime
import io
import os
import sys
import html

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer,
    Table, TableStyle, Image, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


# -------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------

COLLEGE_NAME = (
    "Swami Keshvanand Institute of Technology,"
    "Management & Gramothan, Jaipur"
)

DEPARTMENT_NAME = (
    "Department of Computer Science & Engineering"
)

TARGET_BRANCH = "main"


# -------------------------------------------------------------
# GET REPOSITORY INFORMATION
# -------------------------------------------------------------

def get_repo_info():

    repo_name = "Project-Repository"

    try:
        root_path = subprocess.check_output(
            ["git", "rev-parse", "--show-toplevel"],
            encoding="utf-8"
        ).strip()

        repo_name = os.path.basename(root_path)

    except Exception:
        repo_name = os.path.basename(os.getcwd())

    return repo_name, TARGET_BRANCH


# -------------------------------------------------------------
# GET GIT METRICS
# -------------------------------------------------------------

def get_git_metrics(interval="all"):

    today = datetime.date.today()

    git_args = [
        "git",
        "log",
        TARGET_BRANCH,
        "--pretty=format:COMMIT|||%h|||%an|||%ad|||%s",
        "--date=short",
        "--numstat"
    ]

    if interval == "weekly":

        since_date = (
            today - datetime.timedelta(days=7)
        ).strftime("%Y-%m-%d")

        git_args.append(f"--since={since_date}")

        scope_title = f"Last 7 Days (Since {since_date})"

    elif interval == "monthly":

        since_date = (
            today - datetime.timedelta(days=30)
        ).strftime("%Y-%m-%d")

        git_args.append(f"--since={since_date}")

        scope_title = f"Last 30 Days (Since {since_date})"

    else:

        scope_title = (
            "Complete Project Lifecycle "
            "(Initial Commit to Latest Commit on main)"
        )

    try:

        raw_output = subprocess.check_output(
            git_args,
            encoding="utf-8",
            errors="replace"
        )

    except subprocess.CalledProcessError as error:

        print("[ERROR] Git command failed.")
        print(error)

        return None, None, None, scope_title

    students = defaultdict(
        lambda: {
            "commits": 0,
            "added": 0,
            "deleted": 0,
            "active_days": set()
        }
    )

    timeline_activity = defaultdict(
        lambda: defaultdict(int)
    )

    student_logs = defaultdict(list)

    current_author = None

    for line in raw_output.splitlines():

        line = line.strip()

        if not line:
            continue

        # New commit record
        if line.startswith("COMMIT|||"):

            parts = line.split("|||", 4)

            if len(parts) < 5:
                current_author = None
                continue

            sha = parts[1].strip()
            author = parts[2].strip()
            date_str = parts[3].strip()
            message = parts[4].strip()

            current_author = author

            students[author]["commits"] += 1

            students[author]["active_days"].add(
                date_str
            )

            student_logs[author].append(
                (date_str, sha, message)
            )

            try:

                dt = datetime.datetime.strptime(
                    date_str,
                    "%Y-%m-%d"
                ).date()

                if interval == "weekly":

                    period_key = dt.strftime("%a (%b %d)")

                elif interval == "monthly":

                    period_key = (
                        f"{dt.isocalendar()[0]}"
                        f"-W{dt.isocalendar()[1]:02d}"
                    )

                else:

                    period_key = dt.strftime("%Y-%m")

                timeline_activity[period_key][author] += 1

            except ValueError:
                pass

        # File change statistics
        elif current_author:

            parts = line.split("\t", 2)

            if len(parts) >= 2:

                added = parts[0]
                deleted = parts[1]

                if added.isdigit():
                    students[current_author]["added"] += int(added)

                if deleted.isdigit():
                    students[current_author]["deleted"] += int(deleted)

    return (
        students,
        timeline_activity,
        student_logs,
        scope_title
    )


# -------------------------------------------------------------
# CREATE CHARTS
# -------------------------------------------------------------

def create_charts(students, timeline_activity, interval):

    fig, (ax1, ax2) = plt.subplots(
        1,
        2,
        figsize=(11, 3.8)
    )

    authors = list(students.keys())

    periods = sorted(timeline_activity.keys())

    # Commit Timeline
    if periods and authors:

        for author in authors:

            counts = [
                timeline_activity[period].get(author, 0)
                for period in periods
            ]

            ax1.plot(
                periods,
                counts,
                marker="o",
                linewidth=2,
                label=author
            )

        ax1.set_title(
            f"Commit Timeline ({interval.capitalize()})",
            fontsize=10,
            fontweight="bold"
        )

        ax1.set_ylabel("Commits")

        ax1.tick_params(
            axis="x",
            rotation=30
        )

        ax1.grid(
            True,
            linestyle="--",
            alpha=0.5
        )

        ax1.legend(fontsize=7)

    else:

        ax1.text(
            0.5,
            0.5,
            "No commits found",
            ha="center",
            va="center"
        )

    # Net Lines of Code
    if authors:

        net_loc = [
            students[author]["added"]
            - students[author]["deleted"]
            for author in authors
        ]

        ax2.bar(
            authors,
            net_loc,
            width=0.45
        )

        ax2.set_title(
            "Net Lines of Code Written",
            fontsize=10,
            fontweight="bold"
        )

        ax2.set_ylabel("LOC (Added - Deleted)")

        ax2.tick_params(
            axis="x",
            rotation=20
        )

        ax2.grid(
            axis="y",
            linestyle="--",
            alpha=0.5
        )

    else:

        ax2.text(
            0.5,
            0.5,
            "No LOC changes recorded",
            ha="center",
            va="center"
        )

    plt.tight_layout()

    img_buffer = io.BytesIO()

    plt.savefig(
        img_buffer,
        format="png",
        dpi=200,
        bbox_inches="tight"
    )

    plt.close()

    img_buffer.seek(0)

    return Image(
        img_buffer,
        width=500,
        height=170
    )


# -------------------------------------------------------------
# GENERATE PDF REPORT
# -------------------------------------------------------------

def generate_pdf(interval="all"):

    repo_name, branch_name = get_repo_info()

    (
        students,
        timeline_activity,
        student_logs,
        scope_title
    ) = get_git_metrics(interval)

    if students is None:
        return

    date_stamp = datetime.date.today().strftime(
        "%Y-%m-%d"
    )

    # Report names
    if interval == "weekly":

        report_title = "Weekly Progress Report (Form-3)"

        doc_name = (
            f"{repo_name}_Weekly_Progress_Report_Form-3_"
            f"{date_stamp}.pdf"
        )

    elif interval == "monthly":

        report_title = "Monthly Progress Report (Form-3)"

        doc_name = (
            f"{repo_name}_Monthly_Progress_Report_Form-3_"
            f"{date_stamp}.pdf"
        )

    else:

        report_title = "Complete Project Progress Report"

        doc_name = (
            f"{repo_name}_Complete_Progress_Report_"
            f"{date_stamp}.pdf"
        )

    # Output folder
    os.makedirs("complete_reports", exist_ok=True)

    if interval == "all":
        doc_name = os.path.join("complete_reports", doc_name)

    # PDF document
    doc = SimpleDocTemplate(
        doc_name,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=30,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()

    college_style = ParagraphStyle(
        "CollegeStyle",
        parent=styles["Heading1"],
        fontSize=13.5,
        leading=17,
        textColor=colors.HexColor("#0F172A"),
        alignment=1,
        spaceAfter=2
    )

    dept_style = ParagraphStyle(
        "DeptStyle",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#475569"),
        alignment=1,
        spaceAfter=6
    )

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading2"],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1A365D"),
        alignment=1,
        spaceAfter=5
    )

    repo_style = ParagraphStyle(
        "RepoStyle",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=3
    )

    meta_style = ParagraphStyle(
        "MetaStyle",
        parent=styles["Normal"],
        fontSize=8.5,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=8
    )

    section_style = ParagraphStyle(
        "SectionStyle",
        parent=styles["Heading2"],
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=7,
        spaceAfter=4
    )

    sub_section_style = ParagraphStyle(
        "SubSectionStyle",
        parent=styles["Heading3"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2563EB"),
        spaceBefore=5,
        spaceAfter=2
    )

    msg_style = ParagraphStyle(
        "MsgStyle",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1E293B")
    )

    meta_cell_style = ParagraphStyle(
        "MetaCellStyle",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#475569"),
        alignment=1
    )

    sig_block_style = ParagraphStyle(
        "SigBlockStyle",
        parent=styles["Normal"],
        fontSize=9,
        leading=15,
        textColor=colors.HexColor("#0F172A")
    )

    story = []

    # ---------------------------------------------------------
    # HEADER
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            f"<b>{html.escape(COLLEGE_NAME)}</b>",
            college_style
        )
    )

    story.append(
        Paragraph(
            f"<b>{html.escape(DEPARTMENT_NAME)}</b>",
            dept_style
        )
    )

    story.append(
        Paragraph(
            f"<u><b>{report_title}</b></u>",
            title_style
        )
    )

    story.append(Spacer(1, 3))

    # Repository details
    story.append(
        Paragraph(
            f"<b>Project Repository:</b> "
            f"<font color='#2563EB'>"
            f"<b>{html.escape(repo_name)}</b>"
            f"</font>"
            f"&nbsp; | &nbsp;"
            f"<b>Branch:</b> "
            f"<code>{html.escape(branch_name)}</code>",
            repo_style
        )
    )

    story.append(
        Paragraph(
            f"<b>Evaluation Window:</b> {scope_title}"
            f"&nbsp; | &nbsp;"
            f"<b>Generated On:</b> "
            f"{datetime.date.today().strftime('%B %d, %Y')}",
            meta_style
        )
    )

    # ---------------------------------------------------------
    # CONTRIBUTION TABLE
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "1. Individual Contribution Breakdown",
            section_style
        )
    )

    total_commits = sum(
        data["commits"]
        for data in students.values()
    )

    table_data = [[
        "Student Name",
        "Commits (%)",
        "Lines Added",
        "Lines Deleted",
        "Net LOC",
        "Active Days"
    ]]

    for name, data in students.items():

        percentage = (
            data["commits"] / total_commits * 100
            if total_commits > 0 else 0
        )

        net = data["added"] - data["deleted"]

        table_data.append([
            Paragraph(html.escape(name), msg_style),
            f"{data['commits']} ({percentage:.1f}%)",
            f"+{data['added']:,}",
            f"-{data['deleted']:,}",
            f"{net:,}",
            f"{len(data['active_days'])} days"
        ])

    if not students:

        table_data.append([
            "No commits found.",
            "-", "-", "-", "-", "-"
        ])

    table = Table(
        table_data,
        colWidths=[120, 80, 80, 80, 80, 100]
    )

    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0),
             colors.HexColor("#1E293B")),

            ("TEXTCOLOR", (0, 0), (-1, 0),
             colors.whitesmoke),

            ("ALIGN", (0, 0), (-1, -1), "CENTER"),

            ("ALIGN", (0, 1), (0, -1), "LEFT"),

            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),

            ("FONTSIZE", (0, 0), (-1, -1), 8),

            ("GRID", (0, 0), (-1, -1),
             0.5, colors.HexColor("#CBD5E1")),

            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#F1F5F9")]),

            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

            ("TOPPADDING", (0, 0), (-1, -1), 5),

            ("BOTTOMPADDING", (0, 0), (-1, -1), 5)
        ])
    )

    story.append(table)
    story.append(Spacer(1, 6))

    # ---------------------------------------------------------
    # CHARTS
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "2. Visual Trends & Volume",
            section_style
        )
    )

    chart_image = create_charts(
        students,
        timeline_activity,
        interval
    )

    story.append(chart_image)
    story.append(Spacer(1, 6))

    # ---------------------------------------------------------
    # DETAILED COMMIT LOGS
    # ---------------------------------------------------------

    story.append(
        Paragraph(
            "3. Detailed Commit Logs & Mentor Evaluation",
            section_style
        )
    )

    if not student_logs:

        story.append(
            Paragraph(
                "<i>No commit logs found.</i>",
                styles["Normal"]
            )
        )

    else:

        for student_name, logs in student_logs.items():

            student_section = []

            student_section.append(
                Paragraph(
                    f"<b>Student:</b> "
                    f"{html.escape(student_name)} "
                    f"— <i>{len(logs)} commit(s)</i>",
                    sub_section_style
                )
            )

            log_table_data = [[
                "Date",
                "Hash",
                "Commit Message",
                "Mentor Marks (/10)"
            ]]

            for date_val, sha_val, msg_val in logs:

                safe_msg = html.escape(
                    msg_val if msg_val else "(No commit message)"
                )

                log_table_data.append([
                    Paragraph(date_val, meta_cell_style),

                    Paragraph(
                        f"<code>{html.escape(sha_val)}</code>",
                        meta_cell_style
                    ),

                    Paragraph(safe_msg, msg_style),

                    ""
                ])

            log_table = Table(
                log_table_data,
                colWidths=[65, 50, 335, 90],
                repeatRows=1
            )

            log_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0),
                     colors.HexColor("#475569")),

                    ("TEXTCOLOR", (0, 0), (-1, 0),
                     colors.whitesmoke),

                    ("FONTNAME", (0, 0), (-1, 0),
                     "Helvetica-Bold"),

                    ("FONTSIZE", (0, 0), (-1, -1), 8),

                    ("GRID", (0, 0), (-1, -1),
                     0.5, colors.HexColor("#CBD5E1")),

                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),

                    ("TOPPADDING", (0, 0), (-1, -1), 4),

                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4)
                ])
            )

            student_section.append(log_table)
            student_section.append(Spacer(1, 5))

            story.append(
                KeepTogether(student_section)
            )

    # ---------------------------------------------------------
    # SIGNATURES
    # ---------------------------------------------------------

    story.append(Spacer(1, 16))

    mentor_cell = [

        Paragraph(
            "<b>Name:</b> __________________________",
            sig_block_style
        ),

        Paragraph(
            "<b>Designation:</b> Project Mentor",
            sig_block_style
        ),

        Spacer(1, 6),

        Paragraph(
            "<b>Signature:</b> ____________________",
            sig_block_style
        )
    ]

    coordinator_cell = [

        Paragraph(
            "<b>Name:</b> __________________________",
            sig_block_style
        ),

        Paragraph(
            "<b>Designation:</b> Lab Coordinator",
            sig_block_style
        ),

        Spacer(1, 6),

        Paragraph(
            "<b>Signature:</b> ____________________",
            sig_block_style
        )
    ]

    sig_table = Table(
        [[mentor_cell, coordinator_cell]],
        colWidths=[270, 270]
    )

    story.append(
        KeepTogether(sig_table)
    )

    # ---------------------------------------------------------
    # BUILD PDF
    # ---------------------------------------------------------

    doc.build(story)

    print("\n[SUCCESS] Report generated:", doc_name)

    print(
        f"Total students: {len(students)}"
    )

    print(
        f"Total commits: {total_commits}"
    )


# -------------------------------------------------------------
# MAIN
# -------------------------------------------------------------

if __name__ == "__main__":

    chosen_interval = (
        sys.argv[1].lower()
        if len(sys.argv) > 1
        else "all"
    )

    if chosen_interval not in ["weekly", "monthly", "all"]:

        print("Invalid option.")
        print("Use: weekly, monthly, or all")
        sys.exit(1)

    generate_pdf(chosen_interval)
