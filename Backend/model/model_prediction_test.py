import os
import sys
import joblib
import pandas as pd

from predict import predict_loan


# Load dataset
df = pd.read_csv("data/loan_data.csv")

print("\n===== UNSEEN DATA PREDICTION TEST =====")


# Select 20 random applicants
test_data = df.sample(n=20, random_state=42)

correct = 0
total = len(test_data)


for i, (_, applicant) in enumerate(test_data.iterrows(), start=1):

    actual_status = int(applicant["loan_status"])

    # Remove target column
    applicant_data = applicant.drop("loan_status").to_dict()

    # Prediction
    prediction, probability = predict_loan(applicant_data)

    prediction = int(prediction)

    # Probabilities
    class_0_probability = 1 - probability
    class_1_probability = probability

    print("\n========================================")
    print(f"Applicant {i}")
    print("========================================")

    print(f"Actual Status:     {actual_status}")
    print(f"Predicted Status:  {prediction}")

    if prediction == 1:
        print("Prediction: Loan Approved")
    else:
        print("Prediction: Loan Rejected")

    if actual_status == 1:
        print("Actual:     Loan Approved")
    else:
        print("Actual:     Loan Rejected")

    print("\nModel Confidence:")
    print("-" * 30)
    print(f"Class 0 Probability: {class_0_probability:.4f}")
    print(f"Class 1 Probability: {class_1_probability:.4f}")

    print("\nResult:")
    print("-" * 30)

    if prediction == actual_status:
        print("Correct Prediction")
        correct += 1
    else:
        print("Incorrect Prediction")


# Final result
accuracy = (correct / total) * 100

print("\n========================================")
print("FINAL UNSEEN DATA TEST RESULT")
print("========================================")

print(f"Total Applicants:    {total}")
print(f"Correct Predictions: {correct}")
print(f"Incorrect Predictions: {total - correct}")
print(f"Accuracy:             {accuracy:.2f}%")