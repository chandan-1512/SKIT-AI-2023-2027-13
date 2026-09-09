import os
import sys
import joblib
import pandas as pd

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import preprocessor


# Load trained XGBoost model
model_path = os.path.join(
    os.path.dirname(__file__),
    "xgboost_model.pkl"
)

model = joblib.load(model_path)


def predict_loan(applicant_data):

    # Convert applicant data into DataFrame
    data = pd.DataFrame([applicant_data])

    # Apply same preprocessing used during training
    data_processed = preprocessor.transform(data)

    # Get probability of class 1
    probability = model.predict_proba(data_processed)[0][1]

    # Decision threshold
    threshold = 0.50

    # Prediction
    if probability >= threshold:
        prediction = 1
    else:
        prediction = 0

    return prediction, probability