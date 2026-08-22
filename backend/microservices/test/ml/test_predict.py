"""
Quick sanity-check script for the trained crop yield model.
Run from the project root: python test/test_predict.py
"""

import joblib
import pandas as pd

MODEL_PATH = "models/xgb_crop_model.joblib"
ENCODER_PATH = "models/label_encoder.joblib"

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODER_PATH)

# Example input — same shape/order as training features
sample = {
    "Crop_Type": "Wheat",
    "Soil_Type": "Loamy",
    "Soil_pH": 6.5,
    "Temperature": 22.0,
    "Humidity": 65.0,
    "Wind_Speed": 8.0,
    "N": 60.0,
    "P": 45.0,
    "K": 35.0,
    "Soil_Quality": 40.0,
    "Month": 6,
}

row = sample.copy()
row["Crop_Type"] = encoders["Crop_Type"].transform([row["Crop_Type"]])[0]
row["Soil_Type"] = encoders["Soil_Type"].transform([row["Soil_Type"]])[0]

feature_order = ["Crop_Type", "Soil_Type", "Soil_pH", "Temperature", "Humidity",
                  "Wind_Speed", "N", "P", "K", "Soil_Quality", "Month"]

X = pd.DataFrame([[row[c] for c in feature_order]], columns=feature_order)
pred = model.predict(X)[0]

print(f"Input: {sample}")
print(f"Predicted Crop_Yield: {pred:.2f}")
