import os
import sys
import joblib

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

# Add Backend path
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import X_test_processed, y_test


# Load saved XGBoost model
model_path = os.path.join(
    os.path.dirname(__file__),
    "xgboost_model.pkl"
)

model = joblib.load(model_path)


# Get probability of class 1
y_probability = model.predict_proba(X_test_processed)[:, 1]


print("\n===== THRESHOLD ANALYSIS =====")
print("-" * 70)

print(
    f"{'Threshold':<12}"
    f"{'Accuracy':<12}"
    f"{'Precision':<12}"
    f"{'Recall':<12}"
    f"{'F1 Score':<12}"
)

print("-" * 70)


# Test different thresholds
thresholds = [0.30, 0.40, 0.50, 0.60, 0.70]


for threshold in thresholds:

    # Convert probability into class prediction
    y_pred = (y_probability >= threshold).astype(int)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    print(
        f"{threshold:<12.2f}"
        f"{accuracy:<12.4f}"
        f"{precision:<12.4f}"
        f"{recall:<12.4f}"
        f"{f1:<12.4f}"
    )