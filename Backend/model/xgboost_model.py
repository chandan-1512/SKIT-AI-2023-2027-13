# import sys
# import os
# import joblib

# sys.path.append(
#     os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# )

# from preprocessing import (
#     X_train_processed,
#     X_test_processed,
#     y_train,
#     y_test
# )

# from xgboost import XGBClassifier

# from sklearn.metrics import (
#     accuracy_score,
#     precision_score,
#     recall_score,
#     f1_score,
#     classification_report,
#     confusion_matrix
# )


# # Create final XGBoost model
# model = XGBClassifier(
#     n_estimators=100,
#     random_state=42,
#     eval_metric="logloss"
# )


# # Train model
# model.fit(X_train_processed, y_train)


# # Save trained model
# model_path = os.path.join(
#     os.path.dirname(__file__),
#     "xgboost_model.pkl"
# )

# joblib.dump(model, model_path)

# print(f"\nModel saved at: {model_path}")


# # Predictions
# y_pred = model.predict(X_test_processed)


# # Evaluation
# accuracy = accuracy_score(y_test, y_pred)
# precision = precision_score(y_test, y_pred)
# recall = recall_score(y_test, y_pred)
# f1 = f1_score(y_test, y_pred)


# print("\nXGBoost Results")
# print("-" * 35)

# print(f"Accuracy:  {accuracy:.4f}")
# print(f"Precision: {precision:.4f}")
# print(f"Recall:    {recall:.4f}")
# print(f"F1 Score:  {f1:.4f}")


# print("\nClassification Report:")
# print(classification_report(y_test, y_pred))


# # Confusion Matrix
# cm = confusion_matrix(y_test, y_pred)

# print("\nConfusion Matrix:")
# print(cm)
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
    f1_score,
    classification_report,
    confusion_matrix
)


# Create XGBoost model
model = XGBClassifier(
    n_estimators=100,
    random_state=42,
    eval_metric="logloss"
)


# Train model
model.fit(X_train_processed, y_train)


# Test predictions
y_pred = model.predict(X_test_processed)

# Train predictions for overfitting check
y_train_pred = model.predict(X_train_processed)


# Evaluation
accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    zero_division=0
)

recall = recall_score(
    y_test,
    y_pred,
    zero_division=0
)

f1 = f1_score(
    y_test,
    y_pred,
    zero_division=0
)

train_f1 = f1_score(
    y_train,
    y_train_pred,
    zero_division=0
)

f1_difference = train_f1 - f1


print("XGBoost Results")
print("-" * 35)

print(f"Accuracy:       {accuracy:.4f}")
print(f"Precision:      {precision:.4f}")
print(f"Recall:         {recall:.4f}")
print(f"F1 Score:       {f1:.4f}")


print("\nOverfitting Analysis")
print("-" * 35)

print(f"Train F1 Score: {train_f1:.4f}")
print(f"Test F1 Score:  {f1:.4f}")
print(f"Difference:     {f1_difference:.4f}")


print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)

print("\nConfusion Matrix:")
print(cm)