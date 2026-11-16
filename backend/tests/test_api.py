import math
import sys
from pathlib import Path

import joblib
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sklearn.metrics import mean_absolute_error, r2_score

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import evaluate_model  # noqa: E402
import main  # noqa: E402

CSV_PATH = evaluate_model.find_csv(BACKEND_DIR)
needs_csv = pytest.mark.skipif(CSV_PATH is None, reason="training CSV not in repo")

VALID = {
    "age": 21,
    "gender": "Male",
    "country": "India",
    "academic_level": "Undergraduate",
    "most_used_platform": "Instagram",
    "purpose_of_use": "Entertainment",
    "avg_daily_usage_hours": 4.0,
    "daily_unlocks": 134,
    "study_hours": 4.5,
    "physical_activity_hours": 2.2,
    "sleep_hours_per_night": 6.7,
    "stress_level": "Medium",
}


@pytest.fixture(scope="module")
def client():
    # Context manager runs the lifespan, which loads the model.
    with TestClient(main.app, raise_server_exceptions=False) as test_client:
        yield test_client


def post(client, **overrides):
    return client.post("/predict", json={**VALID, **overrides})


# ---- health / happy path -------------------------------------------------

def test_root_and_health(client):
    assert client.get("/").status_code == 200
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "model_loaded": True}


def test_valid_prediction_is_finite_and_within_training_target_range(client):
    response = post(client)
    assert response.status_code == 200
    body = response.json()
    score = body["predicted_mental_health_score"]
    assert math.isfinite(score)
    assert 3.6 <= score <= 9.4  # min/max of Mental_Health_Score in the training data
    assert body["warnings"] == []


def test_prediction_is_deterministic(client):
    assert post(client).json() == post(client).json()


def test_api_matches_direct_model_call_with_training_schema(client):
    """Guards feature order / naming between the API and the trained pipeline."""
    model = joblib.load(main.MODEL_PATH)
    row = pd.DataFrame([{
        "Study_Hours": 4.5, "Age": 21, "Avg_Daily_Usage_Hours": 4.0, "Daily_Unlocks": 134,
        "Physical_Activity_Hours": 2.2, "Sleep_Hours_Per_Night": 6.7, "Stress_Level": "Medium",
        "Gender": "Male", "Academic_Level": "Undergraduate", "Most_Used_Platform": "Instagram",
        "Purpose_Of_Use": "Entertainment", "Grouped_country": "India",
    }])
    expected = round(float(model.predict(row[list(model.feature_names_in_)])[0]), 2)
    assert post(client).json()["predicted_mental_health_score"] == expected


def test_unseen_country_is_grouped_as_other(client):
    other = post(client, country="Other").json()["predicted_mental_health_score"]
    assert post(client, country="Atlantis").json()["predicted_mental_health_score"] == other


def test_country_whitespace_is_stripped(client):
    assert post(client, country="  India ").json() == post(client, country="India").json()


# ---- validation: bad input must be 4xx, never 5xx --------------------------

@pytest.mark.parametrize("overrides", [
    {"stress_level": "Extreme"},
    {"gender": "Other"},
    {"academic_level": "PhD"},
    {"most_used_platform": "MySpace"},
    {"purpose_of_use": "Gaming"},
    {"age": 9},
    {"age": 101},
    {"age": 21.5},
    {"age": "twenty"},
    {"avg_daily_usage_hours": -1},
    {"avg_daily_usage_hours": 25},
    {"daily_unlocks": -5},
    {"daily_unlocks": 10**9},
    {"country": ""},
    {"country": "   "},
    {"country": "x" * 101},
    {"study_hours": None},
])
def test_invalid_values_are_rejected_with_422(client, overrides):
    assert post(client, **overrides).status_code == 422


@pytest.mark.parametrize("field", list(VALID))
def test_missing_field_is_rejected_with_422(client, field):
    payload = {k: v for k, v in VALID.items() if k != field}
    assert client.post("/predict", json=payload).status_code == 422


@pytest.mark.parametrize("literal", ["NaN", "Infinity", "-Infinity"])
def test_non_finite_numbers_are_rejected_with_422(client, literal):
    body = (
        '{"age":21,"gender":"Male","country":"India","academic_level":"Undergraduate",'
        '"most_used_platform":"Instagram","purpose_of_use":"Entertainment",'
        f'"avg_daily_usage_hours":{literal},"daily_unlocks":100,"study_hours":1,'
        '"physical_activity_hours":1,"sleep_hours_per_night":7,"stress_level":"Low"}'
    )
    response = client.post("/predict", content=body, headers={"content-type": "application/json"})
    assert response.status_code == 422


def test_malformed_json_is_422(client):
    response = client.post("/predict", content="{bad", headers={"content-type": "application/json"})
    assert response.status_code == 422


def test_validation_errors_do_not_echo_input_back(client):
    response = post(client, country="x" * 150, age="SECRET-VALUE")
    assert response.status_code == 422
    assert "SECRET-VALUE" not in response.text
    assert "x" * 150 not in response.text
    assert all(set(error) == {"loc", "msg", "type"} for error in response.json()["detail"])


def test_impossible_daily_time_budget_is_rejected(client):
    response = post(client, sleep_hours_per_night=12, study_hours=10, physical_activity_hours=5)
    assert response.status_code == 422


def test_wrong_method_is_405(client):
    assert client.get("/predict").status_code == 405


# ---- out-of-distribution warnings ------------------------------------------

def test_out_of_training_range_values_succeed_with_warnings(client):
    response = post(client, age=12, avg_daily_usage_hours=15)
    assert response.status_code == 200
    warnings = response.json()["warnings"]
    assert any(w.startswith("age=12") for w in warnings)
    assert any(w.startswith("avg_daily_usage_hours=15") for w in warnings)


def test_boundary_values_of_training_range_do_not_warn(client):
    response = post(client, age=18, avg_daily_usage_hours=8.8, daily_unlocks=273)
    assert response.json()["warnings"] == []


# ---- error handling must not leak internals --------------------------------

def test_model_failure_returns_generic_500(client, monkeypatch):
    def boom(_frame):
        raise RuntimeError("secret internal path /srv/app/model.pkl")

    monkeypatch.setattr(main.app.state.model, "predict", boom)
    response = post(client)
    assert response.status_code == 500
    assert response.json() == {"detail": "Prediction failed."}
    assert "secret" not in response.text


def test_non_finite_model_output_returns_500(client, monkeypatch):
    monkeypatch.setattr(main.app.state.model, "predict", lambda _frame: [float("nan")])
    response = post(client)
    assert response.status_code == 500
    assert response.json() == {"detail": "Prediction failed."}


def test_missing_model_fails_startup(monkeypatch, tmp_path):
    monkeypatch.setattr(main, "MODEL_PATH", tmp_path / "nope.pkl")
    with pytest.raises(FileNotFoundError):
        with TestClient(main.app):
            pass


# ---- CORS ------------------------------------------------------------------

def preflight(client, origin):
    return client.options(
        "/predict",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
    )


def test_cors_allows_the_deployed_frontend(client):
    response = preflight(client, "https://mindmetricss.onrender.com")
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://mindmetricss.onrender.com"


def test_cors_allows_local_dev_server(client):
    assert preflight(client, "http://localhost:5173").headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_unknown_origin(client):
    response = preflight(client, "https://evil.example")
    assert "access-control-allow-origin" not in response.headers


# ---- schema / model integrity against the training data ---------------------

@needs_csv
def test_every_category_in_training_data_is_accepted_by_the_api():
    df = pd.read_csv(CSV_PATH)
    schema = main.StudentData.model_json_schema()["properties"]
    for column, field in [
        ("Gender", "gender"), ("Academic_Level", "academic_level"),
        ("Most_Used_Platform", "most_used_platform"), ("Purpose_Of_Use", "purpose_of_use"),
        ("Stress_Level", "stress_level"),
    ]:
        assert set(df[column]) == set(schema[field]["enum"]), column


@needs_csv
def test_training_ranges_match_training_data():
    df = pd.read_csv(CSV_PATH).drop_duplicates()
    df["Physical_Activity_Hours"] = df["Physical_Activity_Hours"].clip(lower=0)
    columns = {
        "age": "Age", "avg_daily_usage_hours": "Avg_Daily_Usage_Hours", "daily_unlocks": "Daily_Unlocks",
        "study_hours": "Study_Hours", "physical_activity_hours": "Physical_Activity_Hours",
        "sleep_hours_per_night": "Sleep_Hours_Per_Night",
    }
    for field, column in columns.items():
        assert main.TRAINING_RANGES[field] == (df[column].min(), df[column].max()), field


@needs_csv
def test_daily_time_budget_rule_never_rejects_a_training_row():
    df = pd.read_csv(CSV_PATH)
    assert (df.Sleep_Hours_Per_Night + df.Study_Hours + df.Physical_Activity_Hours.clip(lower=0)).max() <= 24


@needs_csv
def test_shipped_model_quality_on_held_out_split():
    """Catches an accidentally swapped/corrupted .pkl. Measured: R2 0.878, MAE 0.347."""
    df = evaluate_model.load_data(CSV_PATH)
    _, x_test, _, y_test = evaluate_model.split(df)
    predictions = joblib.load(main.MODEL_PATH).predict(x_test)
    assert r2_score(y_test, predictions) > 0.85
    assert mean_absolute_error(y_test, predictions) < 0.40


def test_pickle_was_saved_with_installed_sklearn_version():
    import sklearn

    model = joblib.load(main.MODEL_PATH)
    assert model.__getstate__()["_sklearn_version"] == sklearn.__version__
