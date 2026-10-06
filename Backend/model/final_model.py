import sys
import os
import joblib

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import (
    X_train_processed,
    y_train
)

from xgboost import XGBClassifier


# Final XGBoost model
model = XGBClassifier(
    n_estimators=100,
    random_state=42,
    eval_metric="logloss"
)

# Train final model
model.fit(
    X_train_processed,
    y_train
)


# Create results folder
os.makedirs("results", exist_ok=True)


# Save final model
model_path = "results/final_xgboost_model.pkl"

joblib.dump(
    model,
    model_path
)


print("\n========================================")
print("FINAL MODEL SAVED")
print("========================================")

print(f"Model: XGBoost")
print(f"Estimators: 100")
print(f"Threshold: 0.50")
print(f"Saved at: {model_path}")