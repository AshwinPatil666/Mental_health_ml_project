"""Reproduce the notebook's training pipeline and evaluate the shipped model.

Usage (from this folder):
    python evaluate_model.py                 # fast: linear baseline, default RF, shipped .pkl
    python evaluate_model.py --with-tuning   # also re-runs the notebook's RandomizedSearchCV

Everything mirrors Project1.ipynb: de-duplicate, clip negative physical activity
to 0, group countries, 70/30 split with random_state=42. Metrics are computed on
the held-out 30% test split only.
"""

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import RandomizedSearchCV, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, OrdinalEncoder, StandardScaler

HERE = Path(__file__).resolve().parent
DEFAULT_MODEL = HERE / "mental_health_model.pkl"
CSV_NAMES = (
    "Student Social Media And Mental Health Impact.csv",  # name used in the notebook
    "Student_Social_Media_And_Mental_Health_Impact.csv",
)


def find_csv(folder: Path = HERE) -> Path | None:
    """Return the training CSV in `folder` (either filename spelling), or None."""
    return next((folder / name for name in CSV_NAMES if (folder / name).is_file()), None)


DEFAULT_CSV = find_csv() or HERE / CSV_NAMES[0]

SKEWED = ["Study_Hours"]
NUMERIC = ["Age", "Avg_Daily_Usage_Hours", "Daily_Unlocks", "Physical_Activity_Hours", "Sleep_Hours_Per_Night"]
ORDINAL = ["Stress_Level"]
NOMINAL = ["Gender", "Academic_Level", "Most_Used_Platform", "Purpose_Of_Use", "Grouped_country"]
FEATURES = SKEWED + NUMERIC + ORDINAL + NOMINAL
TARGET = "Mental_Health_Score"


def load_data(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path).drop_duplicates()
    df["Physical_Activity_Hours"] = df["Physical_Activity_Hours"].clip(lower=0)
    top = df["Country"].value_counts().index[:10].tolist()
    df["Grouped_country"] = df["Country"].where(df["Country"].isin(top), "Other")
    return df


def make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer([
        ("Skewd_Pipeline", Pipeline([("log_transform", FunctionTransformer(np.log1p)), ("scale", StandardScaler())]), SKEWED),
        ("Plain_Pipeline", Pipeline([("scale", StandardScaler())]), NUMERIC),
        ("Ordinal_Pipeline", Pipeline([("Encode", OrdinalEncoder(categories=[["Low", "Medium", "High", "Very High"]]))]), ORDINAL),
        ("Normal_Pipeline", Pipeline([("Encode", OneHotEncoder(handle_unknown="ignore"))]), NOMINAL),
    ])


def split(df: pd.DataFrame):
    return train_test_split(df[FEATURES], df[TARGET], test_size=0.30, random_state=42)


def score(name, model, x_train, x_test, y_train, y_test) -> dict:
    pred = model.predict(x_test)
    return {
        "model": name,
        "test_R2": r2_score(y_test, pred),
        "train_R2": r2_score(y_train, model.predict(x_train)),
        "test_MAE": mean_absolute_error(y_test, pred),
        "test_RMSE": float(np.sqrt(mean_squared_error(y_test, pred))),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--with-tuning", action="store_true")
    args = parser.parse_args()

    df = load_data(args.csv)
    x_train, x_test, y_train, y_test = split(df)
    print(f"rows after de-duplication: {len(df)} (train {len(x_train)}, test {len(x_test)})")

    linear = Pipeline([("preprocessor", make_preprocessor()), ("regressor", LinearRegression())]).fit(x_train, y_train)
    forest = Pipeline([("preprocessor", make_preprocessor()), ("random forest", RandomForestRegressor(random_state=42))]).fit(x_train, y_train)
    shipped = joblib.load(args.model)

    rows = [
        score("Linear regression", linear, x_train, x_test, y_train, y_test),
        score("Random forest (default)", forest, x_train, x_test, y_train, y_test),
        score(f"Shipped model ({args.model.name})", shipped, x_train, x_test, y_train, y_test),
    ]

    if args.with_tuning:
        grid = {
            "random forest__n_estimators": [100, 200, 300],
            "random forest__max_depth": [5, 10, 15],
            "random forest__min_samples_split": [2, 5, 10],
            "random forest__min_samples_leaf": [1, 2, 4],
        }
        search = RandomizedSearchCV(forest, grid, n_iter=15, cv=5, scoring="r2", random_state=42, n_jobs=-1).fit(x_train, y_train)
        print("best params:", search.best_params_, "| CV R2:", round(search.best_score_, 4))
        rows.append(score("Random forest (tuned)", search.best_estimator_, x_train, x_test, y_train, y_test))

    print(pd.DataFrame(rows).round(4).to_string(index=False))

    baseline = np.full(len(y_test), y_train.mean())
    print(f"\nMean-predictor baseline: test R2 {r2_score(y_test, baseline):.4f}, MAE {mean_absolute_error(y_test, baseline):.4f}")
    print("5-fold CV R2 on training split (default RF):", cross_val_score(forest, x_train, y_train, cv=5, scoring="r2").round(4))

    result = permutation_importance(shipped, x_test, y_test, n_repeats=5, random_state=0, scoring="r2")
    importance = pd.Series(result.importances_mean, index=FEATURES).sort_values(ascending=False)
    print("\nPermutation importance of the shipped model (drop in test R2):")
    print(importance.round(4).to_string())


if __name__ == "__main__":
    main()
