from fastapi import FastAPI
from pydantic import BaseModel

from model.predict import predict_loan


app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Backend is running successfully"
    }


class LoanApplication(BaseModel):

    person_age: float
    person_gender: str
    person_education: str
    person_income: float
    person_emp_exp: int
    person_home_ownership: str
    loan_amnt: float
    loan_intent: str
    loan_int_rate: float
    loan_percent_income: float
    cb_person_cred_hist_length: float
    credit_score: int
    previous_loan_defaults_on_file: str


@app.post("/predict")
def predict(application: LoanApplication):

    applicant_data = application.model_dump()

    prediction, probability = predict_loan(applicant_data)

    if prediction == 1:
        decision = "Loan Approved"
    else:
        decision = "Loan Rejected"

    return {
        "prediction": int(prediction),
        "decision": decision,
        "probability": round(float(probability), 4)
    }