"""
Crop Yield Prediction - Model Training Script
------------------------------------------------
Trains an XGBoost regressor to predict Crop_Yield from soil + weather + nutrient
features. Mirrors the artifact naming convention already used in the repo
(backend/microservices/models/): xgb_crop_model.joblib + label_encoder.joblib
so the outputs can be dropped straight into that folder.

Usage:
    python scripts/train_model.py --data data/crop_yield_dataset.csv --out models/
"""

import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

CATEGORICAL_COLS = ["Crop_Type", "Soil_Type"]
NUMERIC_COLS = [
    "Soil_pH",
    "Temperature",
    "Humidity",
    "Wind_Speed",
    "N",
    "P",
    "K",
    "Soil_Quality",
]
TARGET_COL = "Crop_Yield"


def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["Date"] = pd.to_datetime(df["Date"])
    df["Month"] = df["Date"].dt.month
    return df


def encode_categoricals(df: pd.DataFrame):
    """Label-encode Crop_Type and Soil_Type; return encoded df + fitted encoders."""
    encoders = {}
    df = df.copy()
    for col in CATEGORICAL_COLS:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
    return df, encoders


def build_model() -> XGBRegressor:
    return XGBRegressor(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/crop_yield_dataset.csv")
    parser.add_argument("--out", default="models/")
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)

    print(f"[1/5] Loading data from {args.data} ...")
    df = load_data(args.data)
    print(f"      rows={len(df)}, columns={list(df.columns)}")

    print("[2/5] Encoding categorical columns (Crop_Type, Soil_Type) ...")
    df_enc, encoders = encode_categoricals(df)

    feature_cols = CATEGORICAL_COLS + NUMERIC_COLS + ["Month"]
    X = df_enc[feature_cols]
    y = df_enc[TARGET_COL]

    print("[3/5] Splitting train/test and fitting XGBRegressor ...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=args.test_size, random_state=42
    )
    model = build_model()
    model.fit(X_train, y_train)

    print("[4/5] Evaluating ...")
    preds = model.predict(X_test)
    metrics = {
        "mae": float(mean_absolute_error(y_test, preds)),
        "rmse": float(np.sqrt(mean_squared_error(y_test, preds))),
        "r2": float(r2_score(y_test, preds)),
    }
    print(f"      MAE={metrics['mae']:.3f}  RMSE={metrics['rmse']:.3f}  R2={metrics['r2']:.3f}")

    print("[5/5] Saving artifacts ...")
    model_path = os.path.join(args.out, "xgb_crop_model.joblib")
    encoder_path = os.path.join(args.out, "label_encoder.joblib")
    metrics_path = os.path.join(args.out, "metrics.json")
    feature_meta_path = os.path.join(args.out, "feature_columns.json")

    joblib.dump(model, model_path)
    joblib.dump(encoders, encoder_path)  # dict: {"Crop_Type": LabelEncoder, "Soil_Type": LabelEncoder}
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    with open(feature_meta_path, "w") as f:
        json.dump({"feature_order": feature_cols, "target": TARGET_COL}, f, indent=2)

    print(f"      model      -> {model_path}")
    print(f"      encoders   -> {encoder_path}")
    print(f"      metrics    -> {metrics_path}")
    print(f"      feat order -> {feature_meta_path}")


if __name__ == "__main__":
    main()
