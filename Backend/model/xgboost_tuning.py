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

from sklearn.model_selection import GridSearchCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)


# Base model
model = XGBClassifier(
    random_state=42,
    eval_metric="logloss"
)


# Parameters to test
param_grid = {
    "n_estimators": [100, 200],
    "max_depth": [3, 5],
    "learning_rate": [0.05, 0.1]
}


# Find the best parameters
grid_search = GridSearchCV(
    estimator=model,
    param_grid=param_grid,
    cv=5,
    scoring="f1",
    n_jobs=-1,
    verbose=1
)


grid_search.fit(
    X_train_processed,
    y_train
)


print("\nBest Parameters:")
print(grid_search.best_params_)

print(
    f"\nBest CV F1 Score: "
    f"{grid_search.best_score_:.4f}"
)


# Best model
best_model = grid_search.best_estimator_


# Predictions
y_train_pred = best_model.predict(
    X_train_processed
)

y_test_pred = best_model.predict(
    X_test_processed
)


# Metrics
train_f1 = f1_score(
    y_train,
    y_train_pred
)

accuracy = accuracy_score(
    y_test,
    y_test_pred
)

precision = precision_score(
    y_test,
    y_test_pred
)

recall = recall_score(
    y_test,
    y_test_pred
)

test_f1 = f1_score(
    y_test,
    y_test_pred
)

gap = train_f1 - test_f1


print("\nTuned XGBoost Results")
print("-" * 35)

print(f"Accuracy:        {accuracy:.4f}")
print(f"Precision:       {precision:.4f}")
print(f"Recall:          {recall:.4f}")
print(f"Test F1:         {test_f1:.4f}")

print("\nOverfitting Analysis")
print("-" * 35)

print(f"Train F1:        {train_f1:.4f}")
print(f"Test F1:         {test_f1:.4f}")
print(f"Difference:      {gap:.4f}")