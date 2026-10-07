import pandas as pd


FEATURE_COLUMNS = [
    "person_age",
    "person_income",
    "person_emp_exp",
    "loan_amnt",
    "loan_int_rate",
    "loan_percent_income",
    "cb_person_cred_hist_length",
    "credit_score",
    "person_gender_male",
    "person_education_Bachelor",
    "person_education_Doctorate",
    "person_education_High School",
    "person_education_Master",
    "person_home_ownership_OTHER",
    "person_home_ownership_OWN",
    "person_home_ownership_RENT",
    "loan_intent_EDUCATION",
    "loan_intent_HOMEIMPROVEMENT",
    "loan_intent_MEDICAL",
    "loan_intent_PERSONAL",
    "loan_intent_VENTURE",
    "previous_loan_defaults_on_file_Yes"
]


def preprocess_input(applicant_data):

    data = pd.DataFrame([applicant_data])

    # Start with numerical features
    processed = pd.DataFrame()

    processed["person_age"] = data["person_age"]
    processed["person_income"] = data["person_income"]
    processed["person_emp_exp"] = data["person_emp_exp"]
    processed["loan_amnt"] = data["loan_amnt"]
    processed["loan_int_rate"] = data["loan_int_rate"]
    processed["loan_percent_income"] = data["loan_percent_income"]
    processed["cb_person_cred_hist_length"] = data[
        "cb_person_cred_hist_length"
    ]
    processed["credit_score"] = data["credit_score"]

    # Gender
    processed["person_gender_male"] = (
        data["person_gender"].str.lower() == "male"
    ).astype(int)

    # Education
    processed["person_education_Bachelor"] = (
        data["person_education"] == "Bachelor"
    ).astype(int)

    processed["person_education_Doctorate"] = (
        data["person_education"] == "Doctorate"
    ).astype(int)

    processed["person_education_High School"] = (
        data["person_education"] == "High School"
    ).astype(int)

    processed["person_education_Master"] = (
        data["person_education"] == "Master"
    ).astype(int)

    # Home ownership
    processed["person_home_ownership_OTHER"] = (
        data["person_home_ownership"] == "OTHER"
    ).astype(int)

    processed["person_home_ownership_OWN"] = (
        data["person_home_ownership"] == "OWN"
    ).astype(int)

    processed["person_home_ownership_RENT"] = (
        data["person_home_ownership"] == "RENT"
    ).astype(int)

    # Loan intent
    processed["loan_intent_EDUCATION"] = (
        data["loan_intent"] == "EDUCATION"
    ).astype(int)

    processed["loan_intent_HOMEIMPROVEMENT"] = (
        data["loan_intent"] == "HOMEIMPROVEMENT"
    ).astype(int)

    processed["loan_intent_MEDICAL"] = (
        data["loan_intent"] == "MEDICAL"
    ).astype(int)

    processed["loan_intent_PERSONAL"] = (
        data["loan_intent"] == "PERSONAL"
    ).astype(int)

    processed["loan_intent_VENTURE"] = (
        data["loan_intent"] == "VENTURE"
    ).astype(int)

    # Previous loan default
    processed["previous_loan_defaults_on_file_Yes"] = (
        data["previous_loan_defaults_on_file"] == "Yes"
    ).astype(int)

    # Ensure exact feature order
    processed = processed[FEATURE_COLUMNS]

    return processed