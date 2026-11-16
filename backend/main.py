"""Mindmetrics API.

Educational ML project: predicts a numeric "mental health score" from daily
habits using a scikit-learn pipeline. This is NOT a clinical or diagnostic tool.
"""

import logging
import math
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("mindmetrics")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "mental_health_model.pkl"))

# Browser origins allowed to call the API (comma-separated). Override in
# production with the ALLOWED_ORIGINS environment variable.
DEFAULT_ORIGINS = (
    "https://mindmetricss.onrender.com,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",")
    if origin.strip()
]

# Must match the notebook's `top_countries` (ten most frequent values in the
# training data, including the literal value "Other"). Anything else is
# grouped as "Other", exactly as during training.
TOP_COUNTRIES = frozenset(
    ["Other", "India", "USA", "Canada", "Australia", "UK", "Germany", "Mexico", "Turkey", "France"]
)

# Value ranges present in the training data (after de-duplication). A random
# forest cannot extrapolate: outside these ranges its output is flat and not
# meaningful, so such requests succeed but carry a warning.
# tests/test_api.py verifies these against the training CSV.
TRAINING_RANGES: dict[str, tuple[float, float]] = {
    "age": (18, 24),
    "avg_daily_usage_hours": (1.0, 8.8),
    "daily_unlocks": (62, 273),
    "study_hours": (0.3, 8.3),
    "physical_activity_hours": (0.0, 4.1),
    "sleep_hours_per_night": (3.6, 9.9),
}

# API field -> column name used when the model was trained.
FIELD_TO_COLUMN = {
    "age": "Age",
    "gender": "Gender",
    "academic_level": "Academic_Level",
    "most_used_platform": "Most_Used_Platform",
    "purpose_of_use": "Purpose_Of_Use",
    "avg_daily_usage_hours": "Avg_Daily_Usage_Hours",
    "daily_unlocks": "Daily_Unlocks",
    "study_hours": "Study_Hours",
    "physical_activity_hours": "Physical_Activity_Hours",
    "sleep_hours_per_night": "Sleep_Hours_Per_Night",
    "stress_level": "Stress_Level",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast at startup if the model is missing or unreadable.
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH.name}")
    app.state.model = joblib.load(MODEL_PATH)
    logger.info("Model loaded from %s", MODEL_PATH.name)
    yield


app = FastAPI(
    title="Mental Health Prediction API",
    description="Educational student mental wellness prediction (not a diagnostic tool)",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError):
    # FastAPI's default 422 body echoes the rejected input back. For values such as
    # NaN/Infinity that cannot be serialized to JSON, so the error response itself
    # crashed with a 500. Return only where/what went wrong, never the raw input.
    errors = [{"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


class StudentData(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    age: int = Field(..., ge=10, le=100)
    gender: Literal["Male", "Female"]
    country: str = Field(..., min_length=1, max_length=100)
    academic_level: Literal["Undergraduate", "Graduate", "High School"]
    most_used_platform: Literal[
        "Facebook", "LinkedIn", "Instagram", "Snapchat", "Twitter", "YouTube",
        "TikTok", "LINE", "KakaoTalk", "VKontakte", "WhatsApp", "WeChat",
    ]
    purpose_of_use: Literal["Networking", "Education", "Entertainment", "News"]
    avg_daily_usage_hours: float = Field(..., ge=0, le=24, allow_inf_nan=False)
    daily_unlocks: int = Field(..., ge=0, le=1000)
    study_hours: float = Field(..., ge=0, le=24, allow_inf_nan=False)
    physical_activity_hours: float = Field(..., ge=0, le=24, allow_inf_nan=False)
    sleep_hours_per_night: float = Field(..., ge=0, le=24, allow_inf_nan=False)
    stress_level: Literal["Low", "Medium", "High", "Very High"]

    @model_validator(mode="after")
    def check_daily_time_budget(self) -> "StudentData":
        total = self.sleep_hours_per_night + self.study_hours + self.physical_activity_hours
        if total > 24:
            raise ValueError("sleep, study and physical activity hours cannot add up to more than 24 per day")
        return self


class PredictionResponse(BaseModel):
    predicted_mental_health_score: float
    warnings: list[str] = []


def out_of_range_warnings(data: StudentData) -> list[str]:
    warnings = []
    for field, (low, high) in TRAINING_RANGES.items():
        value = getattr(data, field)
        if not low <= value <= high:
            warnings.append(
                f"{field}={value} is outside the range seen in the training data "
                f"({low}-{high}); the model cannot extrapolate, so this prediction is unreliable."
            )
    return warnings


@app.get("/")
def root():
    return {"message": "Mental Health Prediction API is running"}


@app.get("/health")
def health_check():
    loaded = getattr(app.state, "model", None) is not None
    if not loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy", "model_loaded": True}


@app.post("/predict", response_model=PredictionResponse)
def predict(data: StudentData):
    model = getattr(app.state, "model", None)
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    row = {FIELD_TO_COLUMN[field]: getattr(data, field) for field in FIELD_TO_COLUMN}
    row["Grouped_country"] = data.country if data.country in TOP_COUNTRIES else "Other"

    try:
        # Use the exact columns and order the model was trained on.
        frame = pd.DataFrame([row])[list(model.feature_names_in_)]
        prediction = float(model.predict(frame)[0])
        if not math.isfinite(prediction):
            raise ValueError("model returned a non-finite value")
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed.") from exc

    return PredictionResponse(
        predicted_mental_health_score=round(prediction, 2),
        warnings=out_of_range_warnings(data),
    )
