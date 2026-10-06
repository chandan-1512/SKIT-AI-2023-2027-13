import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import (
    X_train_processed,
    X_test_processed,
    y_train,
    y_test
)

from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

import pandas as pd


# Baseline XGBoost model
model = XGBClassifier(
    n_estimators=100,
    random_state=42,
    eval_metric="logloss"
)

# Train model
model.fit(X_train_processed, y_train)


# Get probability of class 1
y_probability = model.predict_proba(X_test_processed)[:, 1]


# Thresholds to test
thresholds = [0.30, 0.40, 0.50, 0.60, 0.70]


results = []


for threshold in thresholds:

    # Convert probability into prediction
    y_pred = (y_probability >= threshold).astype(int)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    results.append({
        "Threshold": threshold,
        "Accuracy": accuracy,
        "Precision": precision,
        "Recall": recall,
        "F1 Score": f1
    })


# Create results table
results_df = pd.DataFrame(results)


print("\nThreshold Analysis")
print("-" * 75)
print(results_df.to_string(index=False))


# Best threshold based on F1
best_result = results_df.loc[
    results_df["F1 Score"].idxmax()
]

print("\nBest Threshold Based on F1")
print("-" * 35)
print(f"Threshold: {best_result['Threshold']:.2f}")
print(f"Accuracy:  {best_result['Accuracy']:.4f}")
print(f"Precision: {best_result['Precision']:.4f}")
print(f"Recall:    {best_result['Recall']:.4f}")
print(f"F1 Score:  {best_result['F1 Score']:.4f}")


# Save results
os.makedirs("results", exist_ok=True)

results_df.to_csv(
    "results/xgboost_threshold_analysis.csv",
    index=False
)