import pytest

from model import predict


class MockScaler:
    def transform(self, data):
        return data


class MockModel:
    def __init__(self, probability):
        self.probability = probability

    def predict_proba(self, data):
        return [[1 - self.probability, self.probability]]

    def predict(self, data):
        return [0]


def create_applicant(
    credit_score=720,
    income=60000,
    loan_percent_income=0.15,
    employment_exp=5,
    interest_rate=10,
    previous_default="No"
):
    return {
        "credit_score": credit_score,
        "person_income": income,
        "loan_percent_income": loan_percent_income,
        "person_emp_exp": employment_exp,
        "loan_int_rate": interest_rate,
        "previous_loan_defaults_on_file": previous_default
    }


@pytest.mark.parametrize(
    "probability, applicant, expected_prediction, expected_score",
    [
        # Probability below 20%
        (0.19, create_applicant(), 0, 9),

        # Exact probability threshold: 20%
        (0.20, create_applicant(), 1, 9),

        # Capability score below 5
        (
            0.50,
            create_applicant(
                credit_score=700,
                income=50000,
                loan_percent_income=0.25,
                employment_exp=0,
                interest_rate=15,
                previous_default="Yes"
            ),
            0,
            4
        ),

        # Exact capability score threshold: 5
        (
            0.50,
            create_applicant(
                credit_score=650,
                income=50000,
                loan_percent_income=0.20,
                employment_exp=5,
                interest_rate=15,
                previous_default="Yes"
            ),
            1,
            5
        )
    ]
)
def test_loan_decision_thresholds(
    monkeypatch,
    probability,
    applicant,
    expected_prediction,
    expected_score
):
    monkeypatch.setattr(
        predict,
        "preprocess_input",
        lambda data: [[0]]
    )

    monkeypatch.setattr(predict, "scaler", MockScaler())
    monkeypatch.setattr(predict, "model", MockModel(probability))

    prediction, actual_probability, capability_score = (
        predict.predict_loan(applicant)
    )

    assert prediction == expected_prediction
    assert actual_probability == probability
    assert capability_score == expected_score