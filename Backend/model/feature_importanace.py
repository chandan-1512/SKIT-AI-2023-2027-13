import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import (
    X_train_processed,
    X_test_processed,
    X_train,
    y_train
)

from xgboost import XGBClassifier
import pandas as pd
import matplotlib.pyplot as plt


# XGBoost model
model = XGBClassifier(
    n_estimators=100,
    random_state=42,
    eval_metric="logloss"
)

# Train model
model.fit(X_train_processed, y_train)


# Get feature names
feature_names = X_train.columns


# Calculate feature importance
importance = pd.DataFrame({
    "Feature": feature_names,
    "Importance": model.feature_importances_
})

importance = importance.sort_values(
    by="Importance",
    ascending=False
)


# Display feature importance
print("\nFeature Importance")
print("-" * 40)
print(importance.to_string(index=False))


# Create results folder if not present
os.makedirs("results", exist_ok=True)


# Save feature importance data
importance.to_csv(
    "results/xgboost_feature_importance.csv",
    index=False
)


# Plot top 15 features
top_features = importance.head(15)

plt.figure(figsize=(10, 8))

plt.barh(
    top_features["Feature"][::-1],
    top_features["Importance"][::-1]
)

plt.xlabel("Importance")
plt.ylabel("Feature")
plt.title("XGBoost Feature Importance - Top 15")

plt.tight_layout()

plt.savefig(
    "results/xgboost_feature_importance.png",
    dpi=300
)

plt.show()