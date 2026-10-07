from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from model.predict import predict_loan
from app.database import SessionLocal
from app.models import LoanApplication as LoanApplicationDB


app = FastAPI()


# Database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
def predict(
    application: LoanApplication,
    db: Session = Depends(get_db)
):

    # Convert API input into dictionary
    applicant_data = application.model_dump()

    # Predict using trained XGBoost model
    prediction, probability, capability_score = predict_loan(
        applicant_data
    )

    # Generate decision
    if prediction == 1:
        decision = "Loan Approved"
    else:
        decision = "Loan Rejected"

    # Create database record
    db_application = LoanApplicationDB(
        **applicant_data,
        prediction=int(prediction),
        decision=decision,
        probability=float(probability)
    )

    # Save prediction result to PostgreSQL
    db.add(db_application)
    db.commit()
    db.refresh(db_application)

    # Return API response
    return {
        "prediction": int(prediction),
        "decision": decision,
        "probability": round(float(probability), 4),
        "capability_score": capability_score
    }