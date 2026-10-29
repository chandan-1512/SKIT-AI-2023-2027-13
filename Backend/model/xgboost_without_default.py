import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)
from xgboost import XGBClassifier


# Backend directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Load 70k dataset
data_path = os.path.join(BASE_DIR, "data", "Loan_70k.csv")
df = pd.read_csv(data_path)


# Remove duplicate rows
df = df.drop_duplicates()


# Separate target variable
y = df["loan_status"]


# Remove target and suspicious previous-default feature
X = df.drop(
    ["loan_status", "previous_loan_defaults_on_file_Yes"],
    axis=1
)


print("========================================")
print("XGBOOST WITHOUT PREVIOUS DEFAULT")
print("========================================")
print("Dataset shape:", df.shape)
print("Features used:", X.shape[1])


# Split dataset into training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# Create StandardScaler
scaler = StandardScaler()


# Fit scaler only on training data
X_train_scaled = scaler.fit_transform(X_train)


# Transform test data using the same scaler
X_test_scaled = scaler.transform(X_test)


# Create XGBoost model
model = XGBClassifier(
    n_estimators=100,
    random_state=42,
    eval_metric="logloss"
)


# Train the model
model.fit(X_train_scaled, y_train)


# Generate predictions on test data
y_pred = model.predict(X_test_scaled)


# Calculate evaluation metrics
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)


# Display test results
print("\n========================================")
print("TEST RESULTS")
print("========================================")
print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")


# Calculate training performance
train_pred = model.predict(X_train_scaled)
train_f1 = f1_score(y_train, train_pred)


# Calculate overfitting gap
overfit_gap = train_f1 - f1


print("\n========================================")
print("OVERFITTING ANALYSIS")
print("========================================")
print(f"Train F1   : {train_f1:.4f}")
print(f"Test F1    : {f1:.4f}")
print(f"F1 Gap     : {overfit_gap:.4f}")


# Calculate feature importance
importance = pd.DataFrame({
    "feature": X.columns,
    "importance": model.feature_importances_
}).sort_values(
    by="importance",
    ascending=False
)


# Display top features
print("\n========================================")
print("TOP 10 FEATURE IMPORTANCE")
print("========================================")
print(importance.head(10).to_string(index=False))


# Create results directory if it does not exist
results_dir = os.path.join(BASE_DIR, "results")
os.makedirs(results_dir, exist_ok=True)


# Save the new model separately
model_path = os.path.join(
    results_dir,
    "xgboost_without_default.pkl"
)

joblib.dump(model, model_path)


# Save the new scaler separately
scaler_path = os.path.join(
    results_dir,
    "scaler_without_default.pkl"
)

joblib.dump(scaler, scaler_path)


# Save feature importance
importance_path = os.path.join(
    results_dir,
    "xgboost_without_default_feature_importance.csv"
)

importance.to_csv(
    importance_path,
    index=False
)


print("\n========================================")
print("FILES SAVED")
print("========================================")
print("Model           :", model_path)
print("Scaler          :", scaler_path)
print("Feature Results :", importance_path)