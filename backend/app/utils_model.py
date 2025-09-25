import os
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, f1_score, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from .config import MODELS_DIR

REGRESSOR_PATH = os.path.join(MODELS_DIR, "rf_regressor.joblib")
CLASSIFIER_PATH = os.path.join(MODELS_DIR, "rf_classifier.joblib")


def _derive_biodiversity_risk(x: float) -> str:
    if x < 40:
        return "high"
    elif x < 60:
        return "medium"
    else:
        return "low"


def prepare_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Feature engineering
    df["eDNA_count"] = df["eDNA_detected_species"].fillna("").apply(lambda s: 0 if s == "" else len(str(s).split(",")))
    df["invasive_flag"] = (df["invasive_species_flag"].astype(str).str.lower() == "yes").astype(int)
    df["biodiversity_risk"] = df["biodiversity_index"].astype(float).apply(_derive_biodiversity_risk)
    return df


def _build_preprocessor(df: pd.DataFrame) -> ColumnTransformer:
    numeric_features = [
        "lat",
        "lon",
        "sea_temperature",
        "salinity",
        "biodiversity_index",
        "eDNA_count",
        "invasive_flag",
    ]
    categorical_features = ["region"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ]
    )
    return preprocessor


def train_models(df: pd.DataFrame) -> Dict[str, float]:
    df = prepare_dataset(df)

    # Regressor: predict fish_stock_index
    features = [
        "lat",
        "lon",
        "region",
        "sea_temperature",
        "salinity",
        "biodiversity_index",
        "eDNA_count",
        "invasive_flag",
    ]

    X_reg = df[features]
    y_reg = df["fish_stock_index"].astype(float)

    Xr_train, Xr_test, yr_train, yr_test = train_test_split(X_reg, y_reg, test_size=0.2, random_state=42)

    preproc_reg = _build_preprocessor(df)
    reg_model = Pipeline(
        steps=[
            ("preprocess", preproc_reg),
            ("model", RandomForestRegressor(n_estimators=200, random_state=42)),
        ]
    )
    reg_model.fit(Xr_train, yr_train)
    yreg_pred = reg_model.predict(Xr_test)
    r2 = r2_score(yr_test, yreg_pred)

    # Classifier: predict biodiversity_risk
    y_cls = df["biodiversity_risk"].astype(str)
    Xc_train, Xc_test, yc_train, yc_test = train_test_split(X_reg, y_cls, test_size=0.2, random_state=42)

    preproc_cls = _build_preprocessor(df)
    cls_model = Pipeline(
        steps=[
            ("preprocess", preproc_cls),
            ("model", RandomForestClassifier(n_estimators=250, random_state=42)),
        ]
    )
    cls_model.fit(Xc_train, yc_train)
    ycls_pred = cls_model.predict(Xc_test)
    acc = accuracy_score(yc_test, ycls_pred)
    f1 = f1_score(yc_test, ycls_pred, average="weighted")

    # Persist models
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(reg_model, REGRESSOR_PATH)
    joblib.dump(cls_model, CLASSIFIER_PATH)

    return {
        "regression_r2": float(r2),
        "classification_accuracy": float(acc),
        "classification_f1": float(f1),
    }


def _load_model(path: str):
    if not os.path.exists(path):
        return None
    return joblib.load(path)


def load_models() -> Tuple[Pipeline, Pipeline]:
    reg_model = _load_model(REGRESSOR_PATH)
    cls_model = _load_model(CLASSIFIER_PATH)
    return reg_model, cls_model


def predict_rows(models: Tuple[Pipeline, Pipeline], rows: List[dict]) -> Tuple[List[float], List[str]]:
    reg_model, cls_model = models
    df = pd.DataFrame(rows)
    # If eDNA_detected_species is list, convert to string
    if "eDNA_detected_species" in df.columns:
        df["eDNA_detected_species"] = df["eDNA_detected_species"].apply(
            lambda v: ",".join(v) if isinstance(v, list) else (v if isinstance(v, str) else "")
        )
    df = prepare_dataset(df)

    features = [
        "lat",
        "lon",
        "region",
        "sea_temperature",
        "salinity",
        "biodiversity_index",
        "eDNA_count",
        "invasive_flag",
    ]

    X = df[features]

    if reg_model is None or cls_model is None:
        raise RuntimeError("Models are not trained yet. Please train models first.")

    fish_pred = reg_model.predict(X)
    risk_pred = cls_model.predict(X)

    return fish_pred.tolist(), risk_pred.tolist()
