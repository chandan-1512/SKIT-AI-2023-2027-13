import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# Load dataset
df = pd.read_csv("data/loan_data.csv")

# Separate features and target
X = df.drop("loan_status", axis=1)
y = df["loan_status"]


# Define columns
categorical_columns = X.select_dtypes(include=["object", "string"]).columns.tolist()

numerical_columns = X.select_dtypes(include=["int64", "float64"]).columns.tolist()


# Numerical preprocessing
numerical_transformer = StandardScaler()


# Categorical preprocessing
categorical_transformer = OneHotEncoder(
    handle_unknown="ignore"
)


# Combine preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        ("num", numerical_transformer, numerical_columns),
        ("cat", categorical_transformer, categorical_columns)
    ]
)


# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# Fit preprocessing on training data
X_train_processed = preprocessor.fit_transform(X_train)

# Transform test data
X_test_processed = preprocessor.transform(X_test)


print("Original dataset shape:", df.shape)

print("\nTraining data shape:", X_train.shape)
print("Testing data shape:", X_test.shape)

print("\nProcessed training shape:", X_train_processed.shape)
print("Processed testing shape:", X_test_processed.shape)