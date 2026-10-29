
import os
import sys
import joblib

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


# Load trained model and fitted scaler
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)


def predict_loan(applicant_data):

    # Preprocess applicant input
    data = preprocess_input(applicant_data)

    # Apply fitted scaler
    data_processed = scaler.transform(data)

    # ML model prediction and probability
    probabilities = model.predict_proba(data_processed)[0]
    model_prediction = int(model.predict(data_processed)[0])
    probability = float(probabilities[1])

    # Applicant details
    credit_score = applicant_data["credit_score"]
    income = applicant_data["person_income"]
    loan_percent_income = applicant_data["loan_percent_income"]
    employment_exp = applicant_data["person_emp_exp"]
    interest_rate = applicant_data["loan_int_rate"]
    previous_default = applicant_data[
        "previous_loan_defaults_on_file"
    ]

    # Capability score (maximum 9)
    capability_score = 0

    if credit_score >= 700:
        capability_score += 2
    elif credit_score >= 650:
        capability_score += 1

    if loan_percent_income <= 0.20:
        capability_score += 2
    elif loan_percent_income <= 0.30:
        capability_score += 1

    if income >= 50000:
        capability_score += 1

    if employment_exp >= 5:
        capability_score += 1

    if interest_rate <= 12:
        capability_score += 1

    if previous_default == "No":
        capability_score += 2

    # Final decision policy
    # Approval requires both score and model probability
    if capability_score >= 5 and probability >= 0.20:
        prediction = 1
    else:
        prediction = 0

    print("Model probabilities:", probabilities)
    print("Model prediction:", model_prediction)
    print("Capability score:", capability_score)
    print("Approval probability:", round(probability, 4))
    print("Final prediction:", prediction)

    return prediction, probability, capability_score
