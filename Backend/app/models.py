from sqlalchemy import Column, Integer, Float, String
from app.database import Base


class LoanApplication(Base):

    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    person_age = Column(Float)
    person_gender = Column(String)
    person_education = Column(String)
    person_income = Column(Float)
    person_emp_exp = Column(Integer)
    person_home_ownership = Column(String)
    loan_amnt = Column(Float)
    loan_intent = Column(String)
    loan_int_rate = Column(Float)
    loan_percent_income = Column(Float)
    cb_person_cred_hist_length = Column(Float)
    credit_score = Column(Integer)
    previous_loan_defaults_on_file = Column(String)

    prediction = Column(Integer)
    decision = Column(String)
    probability = Column(Float)