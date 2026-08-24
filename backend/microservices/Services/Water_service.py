import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PIPELINE_PATH = os.path.join(BASE_DIR, "..", "models", "Kailash_water_pipeline.joblib")
PIPELINE = joblib.load(PIPELINE_PATH)

def get_water_requirement(crop: str, soil: str, region: str, temp_range: str, weather: str) -> dict:
    try:
        # Clean string inputs
        crop_clean = crop.strip().upper()
        soil_clean = soil.strip().upper()
        region_clean = region.strip().upper()
        weather_clean = weather.strip().upper()

        # Parse numeric temperature boundaries
        low_temp, high_temp = map(float, temp_range.split('-'))
        avg_temp = round((low_temp + high_temp) / 2.0, 1)

        raw_input = pd.DataFrame([{
            'CROP TYPE': crop_clean,
            'SOIL TYPE': soil_clean,
            'REGION': region_clean,
            'WEATHER CONDITION': weather_clean,
            'LOW_TEMP': low_temp,
            'HIGH_TEMP': high_temp
        }])

        # Run pipeline inference
        raw_pred = PIPELINE.predict(raw_input)[0]
        
        # Format outputs and metrics
        water_l_m2 = round(float(raw_pred), 2)
        liters_per_ha = round(water_l_m2 * 10000, 2)
        irrigation_needed = water_l_m2 > 1.0  # Threshold rule

        return {
            "status": "success",
            "data": {
                "input_summary": {
                    "crop_type": crop_clean,
                    "soil_type": soil_clean,
                    "region": region_clean,
                    "weather_condition": weather_clean,
                    "temperature_celsius": {
                        "min": low_temp,
                        "max": high_temp,
                        "avg": avg_temp
                    }
                },
                "water_requirement": {
                    "liters_per_sq_meter": water_l_m2,
                    "liters_per_hectare": liters_per_ha,
                    "irrigation_recommended": irrigation_needed
                },
                "recommendation": (
                    f"Irrigation Required: Apply {water_l_m2} L/m² ({liters_per_ha:,.0f} L/ha)."
                    if irrigation_needed
                    else "No irrigation needed today. Soil moisture level is sufficient."
                )
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to predict water requirement: {str(e)}"
        }