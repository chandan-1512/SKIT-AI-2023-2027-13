# from unittest.mock import patch, MagicMock
# from fastapi.testclient import TestClient
# from main import app

# client = TestClient(app)


# def test_home():
#     response = client.get("/")
#     assert response.status_code == 200
#     assert response.json()["message"] == "Backend is running successfully"


# def test_invalid_credit_score():
#     payload = {
#         "person_age": 30,
#         "person_gender": "Male",
#         "person_education": "Bachelor",
#         "person_income": 72000,
#         "person_emp_exp": 6,
#         "person_home_ownership": "RENT",
#         "loan_amnt": 12000,
#         "loan_intent": "PERSONAL",
#         "loan_int_rate": 11.5,
#         "loan_percent_income": 0.17,
#         "cb_person_cred_hist_length": 6,
#         "credit_score": 1000,
#         "previous_loan_defaults_on_file": "No"
#     }

#     response = client.post("/predict", json=payload)
#     assert response.status_code == 422


# def test_invalid_loan_intent():
#     payload = {
#         "person_age": 30,
#         "person_gender": "Male",
#         "person_education": "Bachelor",
#         "person_income": 72000,
#         "person_emp_exp": 6,
#         "person_home_ownership": "RENT",
#         "loan_amnt": 12000,
#         "loan_intent": "INVALID",
#         "loan_int_rate": 11.5,
#         "loan_percent_income": 0.17,
#         "cb_person_cred_hist_length": 6,
#         "credit_score": 710,
#         "previous_loan_defaults_on_file": "No"
#     }

#     response = client.post("/predict", json=payload)
#     assert response.status_code == 422

# def test_loan_status_not_found():
#     response = client.get("/loan-status/999999999")
#     assert response.status_code == 404
#     assert response.json()["detail"] == "Loan application not found"


# def test_loan_applications_list():
#     response = client.get("/loan-applications")

#     assert response.status_code == 200
#     assert isinstance(response.json(), list)
# def test_predict_success():
#     payload = {
#         "person_age": 30,
#         "person_gender": "Male",
#         "person_education": "Bachelor",
#         "person_income": 72000,
#         "person_emp_exp": 6,
#         "person_home_ownership": "RENT",
#         "loan_amnt": 12000,
#         "loan_intent": "PERSONAL",
#         "loan_int_rate": 11.5,
#         "loan_percent_income": 0.17,
#         "cb_person_cred_hist_length": 6,
#         "credit_score": 710,
#         "previous_loan_defaults_on_file": "No"
#     }

#     mock_db = MagicMock()

#     def override_get_db():
#         yield mock_db

#     app.dependency_overrides[__import__("main").get_db] = override_get_db

#     try:
#         with patch("main.predict_loan", return_value=(1, 0.95, 8)):
#             response = client.post("/predict", json=payload)
#     finally:
#         app.dependency_overrides.clear()

#     assert response.status_code == 200
#     assert response.json()["prediction"] == 1
#     assert response.json()["decision"] == "Loan Approved"
#     assert response.json()["probability"] == 0.95
#     mock_db.add.assert_called_once()
#     mock_db.commit.assert_called_once()
# def test_loan_status_found():
#     mock_db = MagicMock()
#     mock_application = MagicMock()

#     mock_application.id = 123
#     mock_application.prediction = 1
#     mock_application.decision = "Loan Approved"
#     mock_application.probability = 0.95

#     mock_db.query.return_value.filter.return_value.first.return_value = (
#         mock_application
#     )

#     def override_get_db():
#         yield mock_db

#     from main import get_db
#     app.dependency_overrides[get_db] = override_get_db

#     try:
#         response = client.get("/loan-status/123")
#     finally:
#         app.dependency_overrides.clear()

#     assert response.status_code == 200
#     assert response.json()["application_id"] == 123
#     assert response.json()["decision"] == "Loan Approved"
#     assert response.json()["probability"] == 0.95
# def test_predict_database_failure():
#     payload = {
#         "person_age": 30,
#         "person_gender": "Male",
#         "person_education": "Bachelor",
#         "person_income": 72000,
#         "person_emp_exp": 6,
#         "person_home_ownership": "RENT",
#         "loan_amnt": 12000,
#         "loan_intent": "PERSONAL",
#         "loan_int_rate": 11.5,
#         "loan_percent_income": 0.17,
#         "cb_person_cred_hist_length": 6,
#         "credit_score": 710,
#         "previous_loan_defaults_on_file": "No"
#     }

#     mock_db = MagicMock()

#     def override_get_db():
#         yield mock_db

#     from main import get_db
#     app.dependency_overrides[get_db] = override_get_db

#     mock_db.commit.side_effect = Exception("Database unavailable")

#     try:
#         with patch("main.predict_loan", return_value=(1, 0.95, 8)):
#             response = client.post("/predict", json=payload)
#     finally:
#         app.dependency_overrides.clear()

#     assert response.status_code == 500
#     assert response.json()["detail"] == "Failed to save loan application"
#     mock_db.rollback.assert_called_once()

# def test_predict_model_failure():
#     payload = {
#         "person_age": 30,
#         "person_gender": "Male",
#         "person_education": "Bachelor",
#         "person_income": 72000,
#         "person_emp_exp": 6,
#         "person_home_ownership": "RENT",
#         "loan_amnt": 12000,
#         "loan_intent": "PERSONAL",
#         "loan_int_rate": 11.5,
#         "loan_percent_income": 0.17,
#         "cb_person_cred_hist_length": 6,
#         "credit_score": 710,
#         "previous_loan_defaults_on_file": "No"
#     }

#     with patch(
#         "main.predict_loan",
#         side_effect=Exception("Model unavailable")
#     ):
#         response = client.post("/predict", json=payload)

#     assert response.status_code == 500
#     assert response.json()["detail"] == "Loan prediction failed"
# def test_predict_missing_required_fields():
#     response = client.post("/predict", json={})

#     assert response.status_code == 422

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app, get_db

client = TestClient(app)


def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Backend is running successfully"


def test_invalid_credit_score():
    payload = {
        "person_age": 30,
        "person_gender": "Male",
        "person_education": "Bachelor",
        "person_income": 72000,
        "person_emp_exp": 6,
        "person_home_ownership": "RENT",
        "loan_amnt": 12000,
        "loan_intent": "PERSONAL",
        "loan_int_rate": 11.5,
        "loan_percent_income": 0.17,
        "cb_person_cred_hist_length": 6,
        "credit_score": 1000,
        "previous_loan_defaults_on_file": "No"
    }

    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_invalid_loan_intent():
    payload = {
        "person_age": 30,
        "person_gender": "Male",
        "person_education": "Bachelor",
        "person_income": 72000,
        "person_emp_exp": 6,
        "person_home_ownership": "RENT",
        "loan_amnt": 12000,
        "loan_intent": "INVALID",
        "loan_int_rate": 11.5,
        "loan_percent_income": 0.17,
        "cb_person_cred_hist_length": 6,
        "credit_score": 710,
        "previous_loan_defaults_on_file": "No"
    }

    response = client.post("/predict", json=payload)
    assert response.status_code == 422


def test_loan_status_not_found():
    response = client.get("/loan-status/999999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Loan application not found"



def test_loan_applications_list():
    response = client.get("/loan-applications")

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)

    if data:
        assert "application_id" in data[0]
        assert "prediction" in data[0]
        assert "decision" in data[0]
        assert "probability" in data[0]



def test_predict_success():
    payload = {
        "person_age": 30,
        "person_gender": "Male",
        "person_education": "Bachelor",
        "person_income": 72000,
        "person_emp_exp": 6,
        "person_home_ownership": "RENT",
        "loan_amnt": 12000,
        "loan_intent": "PERSONAL",
        "loan_int_rate": 11.5,
        "loan_percent_income": 0.17,
        "cb_person_cred_hist_length": 6,
        "credit_score": 710,
        "previous_loan_defaults_on_file": "No"
    }

    mock_db = MagicMock()

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("main.predict_loan", return_value=(1, 0.95, 8)):
            response = client.post("/predict", json=payload)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["prediction"] == 1
    assert response.json()["decision"] == "Loan Approved"
    assert response.json()["probability"] == 0.95
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


def test_loan_status_found():
    mock_db = MagicMock()
    mock_application = MagicMock()

    mock_application.id = 123
    mock_application.prediction = 1
    mock_application.decision = "Loan Approved"
    mock_application.probability = 0.95

    mock_db.query.return_value.filter.return_value.first.return_value = (
        mock_application
    )

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        response = client.get("/loan-status/123")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["application_id"] == 123
    assert response.json()["decision"] == "Loan Approved"
    assert response.json()["probability"] == 0.95


def test_predict_database_failure():
    payload = {
        "person_age": 30,
        "person_gender": "Male",
        "person_education": "Bachelor",
        "person_income": 72000,
        "person_emp_exp": 6,
        "person_home_ownership": "RENT",
        "loan_amnt": 12000,
        "loan_intent": "PERSONAL",
        "loan_int_rate": 11.5,
        "loan_percent_income": 0.17,
        "cb_person_cred_hist_length": 6,
        "credit_score": 710,
        "previous_loan_defaults_on_file": "No"
    }

    mock_db = MagicMock()

    def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    mock_db.commit.side_effect = Exception("Database unavailable")

    try:
        with patch("main.predict_loan", return_value=(1, 0.95, 8)):
            response = client.post("/predict", json=payload)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to save loan application"
    mock_db.rollback.assert_called_once()


def test_predict_model_failure():
    payload = {
        "person_age": 30,
        "person_gender": "Male",
        "person_education": "Bachelor",
        "person_income": 72000,
        "person_emp_exp": 6,
        "person_home_ownership": "RENT",
        "loan_amnt": 12000,
        "loan_intent": "PERSONAL",
        "loan_int_rate": 11.5,
        "loan_percent_income": 0.17,
        "cb_person_cred_hist_length": 6,
        "credit_score": 710,
        "previous_loan_defaults_on_file": "No"
    }

    with patch(
        "main.predict_loan",
        side_effect=Exception("Model unavailable")
    ):
        response = client.post("/predict", json=payload)

    assert response.status_code == 500
    assert response.json()["detail"] == "Loan prediction failed"


def test_predict_missing_required_fields():
    response = client.post("/predict", json={})
    assert response.status_code == 422
