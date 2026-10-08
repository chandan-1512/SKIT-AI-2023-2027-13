from fastapi import FastAPI, Depends
from pydantic import BaseModel,Field
from typing import Literal
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends, HTTPException

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

    person_age: float = Field(gt=0)

    person_gender: Literal["Male", "Female"]

    person_education: Literal[
        "Bachelor",
        "Doctorate",
        "High School",
        "Master"
    ]

    person_income: float = Field(gt=0)
    person_emp_exp: int = Field(ge=0)

    person_home_ownership: Literal[
        "OTHER",
        "OWN",
        "RENT"
    ]

    loan_amnt: float = Field(gt=0)

    loan_intent: Literal[
        "EDUCATION",
        "HOMEIMPROVEMENT",
        "MEDICAL",
        "PERSONAL",
        "VENTURE"
    ]

    loan_int_rate: float = Field(gt=0)
    loan_percent_income: float = Field(ge=0, le=1)

    cb_person_cred_hist_length: float = Field(ge=0)
    credit_score: int = Field(ge=300, le=850)

    previous_loan_defaults_on_file: Literal["Yes", "No"]


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
@app.get("/loan-status/{application_id}")
def loan_status(
    application_id: int,
    db: Session = Depends(get_db)
):
    application = db.query(LoanApplicationDB).filter(
        LoanApplicationDB.id == application_id
    ).first()

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found"
        )

    return {
        "application_id": application.id,
        "prediction": application.prediction,
        "decision": application.decision,
        "probability": round(float(application.probability), 4)
    }
@app.get("/loan-applications")
def get_all_applications(
    db: Session = Depends(get_db)
):
    applications = db.query(LoanApplicationDB).all()

    return [
        {
            "application_id": application.id,
            "prediction": application.prediction,
            "decision": application.decision,
            "probability": round(float(application.probability), 4)
        }
        for application in applications
    ]