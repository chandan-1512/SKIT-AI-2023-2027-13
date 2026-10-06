import sys
import os
import pandas as pd
from xgboost import XGBClassifier

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from preprocessing import (
    X_train_processed,
    X_test_processed,
    y_train,
    y_test
)


# Train baseline XGBoost
model = XGBClassifier(
    n_estimators=100,
    random_state=42,
    eval_metric="logloss"
)

model.fit(
    X_train_processed,
    y_train
)


# Select 20 random unseen applicants
sample = pd.DataFrame(
    X_test_processed,
    index=y_test.index
).sample(
    n=20,
    random_state=42
)

actual_status = y_test.loc[sample.index]

# Predict probability
probabilities = model.predict_proba(sample)[:, 1]

# 0.50 threshold
predictions = (probabilities >= 0.50).astype(int)


print("\n===== 70K UNSEEN DATA PREDICTION TEST =====")

correct = 0
total = len(sample)


for i, (prediction, probability, actual) in enumerate(
    zip(predictions, probabilities, actual_status),
    start=1
):

    prediction = int(prediction)
    actual = int(actual)

    class_0_probability = 1 - probability
    class_1_probability = probability

    print("\n========================================")
    print(f"Applicant {i}")
    print("========================================")

    print(f"Actual Status:     {actual}")
    print(f"Predicted Status:  {prediction}")

    if prediction == 1:
        print("Prediction: Loan Approved")
    else:
        print("Prediction: Loan Rejected")

    if actual == 1:
        print("Actual:     Loan Approved")
    else:
        print("Actual:     Loan Rejected")

    print("\nModel Confidence:")
    print("-" * 30)
    print(f"Class 0 Probability: {class_0_probability:.4f}")
    print(f"Class 1 Probability: {class_1_probability:.4f}")

    print("\nResult:")
    print("-" * 30)

    if prediction == actual:
        print("Correct Prediction")
        correct += 1
    else:
        print("Incorrect Prediction")


accuracy = (correct / total) * 100


print("\n========================================")
print("FINAL UNSEEN DATA TEST RESULT")
print("========================================")

print(f"Total Applicants:      {total}")
print(f"Correct Predictions:   {correct}")
print(f"Incorrect Predictions: {total - correct}")
print(f"Sample Accuracy:       {accuracy:.2f}%")