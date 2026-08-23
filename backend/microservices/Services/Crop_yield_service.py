import os
import joblib
import pandas as pd
import requests
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

# =========================================================
# 1. LOAD MODEL + ENCODERS ONCE AT STARTUP
# =========================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "models", "khushboo_xgb_crop_model.joblib")
ENCODER_PATH = os.path.join(BASE_DIR, "..", "models", "khushboo_label_encoder.joblib")

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODER_PATH)  # dict: {"Crop_Type": LabelEncoder, "Soil_Type": LabelEncoder}

FEATURE_ORDER = [
    "Crop_Type", "Soil_Type", "Soil_pH", "Temperature",
    "Humidity", "Wind_Speed", "N", "P", "K", "Soil_Quality", "Month",
]


# =========================================================
# 2. HELPER: WEATHER SUMMARY API (adds Wind Speed vs recommend service)
# =========================================================
def get_weather_summary(lat: float, lon: float, days: int = 16) -> dict:
    """Fetches weather summary (temp, humidity, wind speed) from Open-Meteo API."""
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&daily=temperature_2m_mean,"
        f"relative_humidity_2m_mean,wind_speed_10m_max"
        f"&forecast_days={days}&timezone=auto"
    )

    response = requests.get(url, timeout=10)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to fetch weather data: {response.text}")

    data = response.json().get("daily", {})
    daily_df = pd.DataFrame({
        "Temperature": data.get("temperature_2m_mean", []),
        "Humidity": data.get("relative_humidity_2m_mean", []),
        "Wind_Speed": data.get("wind_speed_10m_max", []),
    })

    return {
        "temperature": round(float(daily_df["Temperature"].mean()), 2),
        "humidity": round(float(daily_df["Humidity"].mean()), 2),
        "wind_speed": round(float(daily_df["Wind_Speed"].mean()), 2),
    }


# =========================================================
# 3. MAIN PREDICTION SERVICE (CALLED BY BACKEND)
# =========================================================
def predict_crop_yield(
    lat: float,
    lon: float,
    crop_type: str,
    soil_type: str,
    soil_ph: float,
    n: float,
    p: float,
    k: float,
    soil_quality: float,
    month: int,
) -> dict:
    """
    Predicts crop yield based on location weather + soil/nutrient parameters.

    Returns:
        dict: JSON-serializable dictionary containing the predicted yield.
    """
    # 1. Fetch weather parameters
    weather_summary = get_weather_summary(lat, lon, days=16)

    # 2. Encode categorical inputs using the SAME encoders used at training time
    encoded_crop = encoders["Crop_Type"].transform([crop_type])[0]
    encoded_soil = encoders["Soil_Type"].transform([soil_type])[0]

    # 3. Build model input in the exact trained feature order
    row = {
        "Crop_Type": encoded_crop,
        "Soil_Type": encoded_soil,
        "Soil_pH": float(soil_ph),
        "Temperature": weather_summary["temperature"],
        "Humidity": weather_summary["humidity"],
        "Wind_Speed": weather_summary["wind_speed"],
        "N": float(n),
        "P": float(p),
        "K": float(k),
        "Soil_Quality": float(soil_quality),
        "Month": int(month),
    }
    sample = pd.DataFrame([row])[FEATURE_ORDER]

    # 4. Predict
    predicted_yield = float(model.predict(sample)[0])

    return {
        "status": "success",
        "inputs": {
            "latitude": lat,
            "longitude": lon,
            "crop_type": crop_type,
            "soil_type": soil_type,
            "soil_ph": soil_ph,
            "N": n,
            "P": p,
            "K": k,
            "soil_quality": soil_quality,
            "month": month,
        },
        "weather_summary": weather_summary,
        "predicted_crop_yield": round(predicted_yield, 2),
    }