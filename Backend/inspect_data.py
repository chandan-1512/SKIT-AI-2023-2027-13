import pandas as pd

df = pd.read_csv("data/loan_data.csv")

# print("Shape:")
# print(df.shape)

# print("\nFirst 5 rows:")
# print(df.head())

# print("\nDataset Info:")
# df.info()

# print("\nMissing Values:")
# print(df.isnull().sum())

# print("\nDuplicate Rows:")
# print(df.duplicated().sum())

# print("\nLoan Status Distribution:")
# print(df["loan_status"].value_counts())

# print("\nCategorical Columns:")
# print(df.select_dtypes(include=["object", "string"]).columns.tolist())

# print("\nNumerical Columns:")
# print(df.select_dtypes(include=["number"]).columns.tolist())

print("\nCategorical Column Values:")

categorical_cols = [
    "person_gender",
    "person_education",
    "person_home_ownership",
    "loan_intent",
    "previous_loan_defaults_on_file"
]

for col in categorical_cols:
    print(f"\n{col}:")
    print(df[col].value_counts())