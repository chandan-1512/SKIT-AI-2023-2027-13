import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


# Load 70k dataset
df = pd.read_csv("data/Loan_70k.csv")


# Remove duplicate rows
df = df.drop_duplicates()


# Separate features and target
X = df.drop("loan_status", axis=1)
y = df["loan_status"]


# Numerical features
numerical_columns = X.columns.tolist()


# Numerical preprocessing
scaler = StandardScaler()


# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# Fit scaler only on training data
X_train_processed = scaler.fit_transform(X_train)

# Transform test data
X_test_processed = scaler.transform(X_test)


print("Original dataset shape:", df.shape)

print("\nTraining data shape:", X_train.shape)
print("Testing data shape:", X_test.shape)

print("\nProcessed training shape:", X_train_processed.shape)
print("Processed testing shape:", X_test_processed.shape)