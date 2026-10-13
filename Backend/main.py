
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from sqlalchemy.orm import Session

from model.predict import predict_loan
from app.database import SessionLocal
from app.models import LoanApplication as LoanApplicationDB


app = FastAPI(
    title="AI Powered Loan Approval API",
    description="Loan prediction and application management API",
    version="1.0.0"
)


# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Health check
@app.get("/")
def home():
    return {
        "message": "Backend is running successfully"
    }


# Loan application request schema
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


# Loan prediction API
@app.post("/predict")
def predict(
    application: LoanApplication,
    db: Session = Depends(get_db)
):
    # Convert API input into dictionary
    applicant_data = application.model_dump()

    # Run trained ML model
    try:
        prediction, probability, capability_score = predict_loan(
            applicant_data
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Loan prediction failed"
        )

    # Generate decision
    if prediction == 1:
        decision = "Loan Approved"
    else:
        decision = "Loan Rejected"

    # Prepare database record
    db_application = LoanApplicationDB(
        **applicant_data,
        prediction=int(prediction),
        decision=decision,
        probability=float(probability)
    )

    # Save record with transaction rollback on failure
    try:
        db.add(db_application)
        db.commit()
        db.refresh(db_application)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to save loan application"
        )

    # Return prediction result
    return {
        "prediction": int(prediction),
        "decision": decision,
        "probability": round(float(probability), 4),
        "capability_score": capability_score
    }


# Retrieve a specific loan application's status
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


# Retrieve all loan applications
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
