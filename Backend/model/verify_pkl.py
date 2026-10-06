import sys
import os
import joblib

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import (
    X_test_processed,
    y_test
)

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# Load saved final model
model_path = "results/final_xgboost_model.pkl"

model = joblib.load(model_path)


# Prediction
y_pred = model.predict(X_test_processed)


# Evaluation
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)


print("\n========================================")
print("FINAL MODEL VERIFICATION")
print("========================================")

print(f"Model: XGBoost")
print(f"Model Path: {model_path}")

print("\nFinal Test Results")
print("-" * 35)

print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1 Score:  {f1:.4f}")