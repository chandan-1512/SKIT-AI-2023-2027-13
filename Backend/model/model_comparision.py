import sys
import os

# Add the Backend folder so preprocessing.py can be imported
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import (
    X_train_processed,
    X_test_processed,
    y_train,
    y_test
)

import pandas as pd
import matplotlib.pyplot as plt

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier

from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    ConfusionMatrixDisplay
)

# Libraries used for generating the PDF report
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak
)

from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch


# Get the Backend directory
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

# Create a folder to store all generated results
RESULTS_DIR = os.path.join(
    BASE_DIR,
    "results"
)

os.makedirs(
    RESULTS_DIR,
    exist_ok=True
)


# Define all the models we want to compare
models = {

    "Logistic Regression":
        LogisticRegression(
            max_iter=1000,
            random_state=42
        ),

    "Decision Tree":
        DecisionTreeClassifier(
            random_state=42
        ),

    "Random Forest":
        RandomForestClassifier(
            n_estimators=100,
            random_state=42
        ),

    "XGBoost":
        XGBClassifier(
            n_estimators=100,
            random_state=42,
            eval_metric="logloss"
        )

}


# This list will store the performance of each model
results = []


# Train and evaluate every model
for name, model in models.items():

    print("\n" + "=" * 50)
    print(f"Training {name}")
    print("=" * 50)


    # Train the model using the processed training data
    model.fit(
        X_train_processed,
        y_train
    )


    # Make predictions on the test data
    y_pred = model.predict(
        X_test_processed
    )


    # Calculate the evaluation metrics
    accuracy = accuracy_score(
        y_test,
        y_pred
    )

    precision = precision_score(
        y_test,
        y_pred
    )

    recall = recall_score(
        y_test,
        y_pred
    )

    f1 = f1_score(
        y_test,
        y_pred
    )


    # Generate the confusion matrix
    cm = confusion_matrix(
        y_test,
        y_pred
    )


    # Store the results for comparison
    results.append({

        "Model": name,

        "Accuracy": accuracy,

        "Precision": precision,

        "Recall": recall,

        "F1 Score": f1

    })


    # Print the model performance in the terminal
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")


    # Create and save the confusion matrix as an image
    display = ConfusionMatrixDisplay(
        confusion_matrix=cm
    )

    display.plot()

    plt.title(
        f"{name} - Confusion Matrix"
    )


    # Create a file name based on the model name
    filename = (
        name.lower()
        .replace(" ", "_")
        + "_cm.png"
    )


    cm_path = os.path.join(
        RESULTS_DIR,
        filename
    )


    plt.savefig(
        cm_path,
        bbox_inches="tight",
        dpi=300
    )

    plt.close()


# Convert all results into a DataFrame
results_df = pd.DataFrame(
    results
)


# Sort the models according to their F1 score
results_df = results_df.sort_values(
    by="F1 Score",
    ascending=False
).reset_index(drop=True)


# Print the final comparison in the terminal
print("\n")
print("=" * 75)
print("MODEL COMPARISON")
print("=" * 75)

print(
    results_df.to_string(
        index=False
    )
)

print("=" * 75)


# The first model after sorting has the highest F1 score
best_model = results_df.iloc[0]


# Print the best model details
print("\nBEST MODEL")

print(
    f"Model: {best_model['Model']}"
)

print(
    f"Accuracy: "
    f"{best_model['Accuracy']:.4f}"
)

print(
    f"F1 Score: "
    f"{best_model['F1 Score']:.4f}"
)


# Save the comparison table as a CSV file
csv_path = os.path.join(
    RESULTS_DIR,
    "model_comparison.csv"
)

results_df.to_csv(
    csv_path,
    index=False
)


# Create an image of the model comparison table
fig, ax = plt.subplots(
    figsize=(11, 3)
)

ax.axis("off")


table = ax.table(

    cellText=results_df.round(4).values,

    colLabels=results_df.columns,

    loc="center"

)


table.auto_set_font_size(
    False
)

table.set_fontsize(
    10
)

table.scale(
    1.2,
    1.7
)


plt.title(
    "Loan Approval Model Comparison",
    fontsize=15,
    pad=20
)


table_path = os.path.join(
    RESULTS_DIR,
    "model_comparison_table.png"
)


plt.savefig(
    table_path,
    bbox_inches="tight",
    dpi=300
)

plt.close()


# Create the PDF report
pdf_path = os.path.join(
    RESULTS_DIR,
    "model_evaluation_report.pdf"
)


doc = SimpleDocTemplate(

    pdf_path,

    pagesize=A4,

    rightMargin=40,

    leftMargin=40,

    topMargin=40,

    bottomMargin=40

)


# This list contains all the elements that will be added to the PDF
elements = []


styles = getSampleStyleSheet()


# Add the report title
elements.append(

    Paragraph(

        "Loan Approval Model Evaluation Report",

        styles["Title"]

    )

)


elements.append(
    Spacer(1, 15)
)


# Add a short description of the report
elements.append(

    Paragraph(

        "This report presents the performance "
        "evaluation and comparison of different "
        "Machine Learning models used for Loan Approval Prediction.",

        styles["Normal"]

    )

)


elements.append(
    Spacer(1, 20)
)


# Add the best model section
elements.append(

    Paragraph(

        "Best Performing Model",

        styles["Heading1"]

    )

)


elements.append(
    Spacer(1, 10)
)


# Prepare the data for the best model table
best_data = [

    ["Model", best_model["Model"]],

    ["Accuracy",
     f"{best_model['Accuracy']:.4f}"],

    ["Precision",
     f"{best_model['Precision']:.4f}"],

    ["Recall",
     f"{best_model['Recall']:.4f}"],

    ["F1 Score",
     f"{best_model['F1 Score']:.4f}"]

]


best_table = Table(

    best_data,

    colWidths=[
        2 * inch,
        3 * inch
    ]

)


# Apply styling to the best model table
best_table.setStyle(

    TableStyle([

        ("BACKGROUND",
         (0, 0),
         (0, -1),
         colors.lightgrey),

        ("BACKGROUND",
         (1, 0),
         (1, -1),
         colors.lightgreen),

        ("GRID",
         (0, 0),
         (-1, -1),
         1,
         colors.black),

        ("FONTNAME",
         (0, 0),
         (-1, 0),
         "Helvetica-Bold"),

        ("ALIGN",
         (0, 0),
         (-1, -1),
         "CENTER"),

        ("VALIGN",
         (0, 0),
         (-1, -1),
         "MIDDLE"),

        ("TOPPADDING",
         (0, 0),
         (-1, -1),
         8),

        ("BOTTOMPADDING",
         (0, 0),
         (-1, -1),
         8)

    ])

)


elements.append(
    best_table
)

elements.append(
    Spacer(1, 25)
)


# Add the model comparison section
elements.append(

    Paragraph(

        "Model Comparison",

        styles["Heading1"]

    )

)


elements.append(
    Spacer(1, 10)
)


# Prepare data for the comparison table
comparison_data = []


# Add the table headings
comparison_data.append(

    list(
        results_df.columns
    )

)


# Add the results of every model
for _, row in results_df.iterrows():

    comparison_data.append([

        row["Model"],

        f"{row['Accuracy']:.4f}",

        f"{row['Precision']:.4f}",

        f"{row['Recall']:.4f}",

        f"{row['F1 Score']:.4f}"

    ])


comparison_table = Table(

    comparison_data,

    colWidths=[

        1.6 * inch,

        0.9 * inch,

        0.9 * inch,

        0.9 * inch,

        0.9 * inch

    ]

)


# Style the comparison table
comparison_table.setStyle(

    TableStyle([

        ("BACKGROUND",
         (0, 0),
         (-1, 0),
         colors.lightgrey),

        # Highlight the best model
        ("BACKGROUND",
         (0, 1),
         (-1, 1),
         colors.lightgreen),

        ("GRID",
         (0, 0),
         (-1, -1),
         1,
         colors.black),

        ("ALIGN",
         (0, 0),
         (-1, -1),
         "CENTER"),

        ("VALIGN",
         (0, 0),
         (-1, -1),
         "MIDDLE"),

        ("FONTNAME",
         (0, 0),
         (-1, 0),
         "Helvetica-Bold"),

        ("FONTNAME",
         (0, 1),
         (-1, 1),
         "Helvetica-Bold"),

        ("TOPPADDING",
         (0, 0),
         (-1, -1),
         8),

        ("BOTTOMPADDING",
         (0, 0),
         (-1, -1),
         8)

    ])

)


elements.append(
    comparison_table
)


# Start individual model details on a new page
elements.append(
    PageBreak()
)


# Add detailed results for every model
for index, row in results_df.iterrows():

    model_name = row["Model"]


    # Add the model name as a heading
    elements.append(

        Paragraph(

            model_name,

            styles["Heading1"]

        )

    )


    elements.append(
        Spacer(1, 10)
    )


    # Create a table containing the model metrics
    metrics_data = [

        ["Metric", "Score"],

        [
            "Accuracy",
            f"{row['Accuracy']:.4f}"
        ],

        [
            "Precision",
            f"{row['Precision']:.4f}"
        ],

        [
            "Recall",
            f"{row['Recall']:.4f}"
        ],

        [
            "F1 Score",
            f"{row['F1 Score']:.4f}"
        ]

    ]


    metrics_table = Table(

        metrics_data,

        colWidths=[

            2.5 * inch,

            2 * inch

        ]

    )


    # Apply styling to the metrics table
    metrics_table.setStyle(

        TableStyle([

            ("BACKGROUND",
             (0, 0),
             (-1, 0),
             colors.lightgrey),

            ("GRID",
             (0, 0),
             (-1, -1),
             1,
             colors.black),

            ("ALIGN",
             (0, 0),
             (-1, -1),
             "CENTER"),

            ("FONTNAME",
             (0, 0),
             (-1, 0),
             "Helvetica-Bold"),

            ("TOPPADDING",
             (0, 0),
             (-1, -1),
             7),

            ("BOTTOMPADDING",
             (0, 0),
             (-1, -1),
             7)

        ])

    )


    elements.append(
        metrics_table
    )


    elements.append(
        Spacer(1, 15)
    )


    # Add the confusion matrix image
    elements.append(

        Paragraph(

            "Confusion Matrix",

            styles["Heading2"]

        )

    )


    elements.append(
        Spacer(1, 10)
    )


    # Use the same naming format used while saving the CM
    filename = (

        model_name.lower()
        .replace(" ", "_")
        + "_cm.png"

    )


    cm_path = os.path.join(

        RESULTS_DIR,

        filename

    )


    # Add the image only if it exists
    if os.path.exists(cm_path):

        img = Image(

            cm_path,

            width=4.3 * inch,

            height=4.3 * inch

        )


        elements.append(
            img
        )


    # Start the next model on a new page
    if index < len(results_df) - 1:

        elements.append(
            PageBreak()
        )


# Generate the final PDF
doc.build(
    elements
)


# Print the location of generated files
print("\n" + "=" * 70)

print("ALL RESULTS GENERATED SUCCESSFULLY!")

print("=" * 70)

print(
    f"\nResults Folder:\n{RESULTS_DIR}"
)

print(
    f"\nPDF Report:\n{pdf_path}"
)

print("=" * 70)