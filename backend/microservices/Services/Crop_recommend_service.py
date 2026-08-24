import os
import joblib
import numpy as np
import pandas as pd
import requests
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "xgb_crop_model.joblib")
ENCODER_PATH = os.path.join(BASE_DIR, "..", "models", "label_encoder.joblib")

model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)


# 2. HELPER: WEATHER SUMMARY API

def get_weather_summary(lat: float, lon: float, days: int = 16) -> dict:
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&daily=temperature_2m_mean,"
        f"relative_humidity_2m_mean,precipitation_sum&forecast_days={days}&timezone=auto"
    )
    
    response = requests.get(url, timeout=10)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch weather data: {response.text}")

    data = response.json().get("daily", {})
    daily_df = pd.DataFrame({
        "Avg_Temp_C": data.get("temperature_2m_mean", []),
        "Avg_Humidity_%": data.get("relative_humidity_2m_mean", []),
        "Rainfall_mm": data.get("precipitation_sum", [])
    })

    return {
        "temperature": round(float(daily_df["Avg_Temp_C"].mean()), 2),
        "humidity": round(float(daily_df["Avg_Humidity_%"].mean()), 2),
        "rainfall": round(float(daily_df["Rainfall_mm"].sum()), 2)
    }

# 3. MAIN PREDICTION SERVICE (CALLED BY BACKEND)
def predict_recommended_crops(
    lat: float,
    lon: float,
    n: float,
    p: float,
    k: float,
    ph: float,
    top_n: int = 5
) -> dict:

    # 1. Fetch weather parameters
    weather_summary = get_weather_summary(lat, lon, days=16)

    # 2. Build model input features
    ml_features = {
        'N': float(n),
        'P': float(p),
        'K': float(k),
        'temperature': weather_summary['temperature'],
        'humidity': weather_summary['humidity'],
        'ph': float(ph),
        'rainfall': weather_summary['rainfall']
    }

    feature_order = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    sample = pd.DataFrame([ml_features])[feature_order]

    # 3. Predict probabilities
    probs = model.predict_proba(sample)[0]
    top_indices = np.argsort(probs)[-top_n:][::-1]
    top_crops = label_encoder.inverse_transform(top_indices)
    top_scores = probs[top_indices] * 100

    # 4. Construct JSON-serializable payload
    recommendations = []
    for rank, (crop, score) in enumerate(zip(top_crops, top_scores), start=1):
        recommendations.append({
            "rank": rank,
            "crop": str(crop),
            "confidence_score": round(float(score), 2),
            "confidence_percentage": f"{score:.2f}%"
        })

    return {
        "status": "success",
        "inputs": {
            "latitude": lat,
            "longitude": lon,
            "N": n,
            "P": p,
            "K": k,
            "ph": ph
        },
        "weather_summary": weather_summary,
        "recommendations": recommendations
    }