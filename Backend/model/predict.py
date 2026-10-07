import os
import sys
import joblib
import pandas as pd


# Add Backend directory to Python path
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)


from app.prediction_preprocessing import preprocess_input


# Paths
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "results",
    "final_xgboost_model.pkl"
)

SCALER_PATH = os.path.join(
    BASE_DIR,
    "results",
    "scaler.pkl"
)


# Load trained XGBoost model
model = joblib.load(MODEL_PATH)


# Load fitted scaler
scaler = joblib.load(SCALER_PATH)


def predict_loan(applicant_data):

    # Convert raw applicant data into
    # the same 22 features used during training
    data = preprocess_input(applicant_data)

    # Apply the fitted training scaler
    data_processed = scaler.transform(data)

    # Get probability of class 1
    probability = model.predict_proba(data_processed)[0][1]

    # -------------------------------------------------
    # Capability-based applicant evaluation
    # -------------------------------------------------

    credit_score = applicant_data["credit_score"]
    income = applicant_data["person_income"]
    loan_amount = applicant_data["loan_amnt"]
    loan_percent_income = applicant_data["loan_percent_income"]
    employment_exp = applicant_data["person_emp_exp"]
    interest_rate = applicant_data["loan_int_rate"]
    previous_default = applicant_data[
        "previous_loan_defaults_on_file"
    ]

    capability_score = 0

    # Good credit score
    if credit_score >= 700:
        capability_score += 2
    elif credit_score >= 650:
        capability_score += 1

    # Healthy loan-to-income ratio
    if loan_percent_income <= 0.20:
        capability_score += 2
    elif loan_percent_income <= 0.30:
        capability_score += 1

    # Good income
    if income >= 50000:
        capability_score += 1

    # Employment experience
    if employment_exp >= 5:
        capability_score += 1

    # Reasonable interest rate
    if interest_rate <= 12:
        capability_score += 1

    # Previous default
    if previous_default == "No":
        capability_score += 2

    # -------------------------------------------------
    # Final decision
    # -------------------------------------------------

    # Strong applicant
    if capability_score >= 7:
        prediction = 1

    # Normal applicant
    elif capability_score >= 5 and probability >= 0.30:
        prediction = 1

    # Risky applicant
    else:
        prediction = 0

    return prediction, probability, capability_score