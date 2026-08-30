import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        r = await client.get('https://api.open-meteo.com/v1/forecast', params={'latitude': 20.0, 'longitude': 78.0, 'current_weather': True, 'daily': 'precipitation_sum,temperature_2m_max,temperature_2m_min,uv_index_max,et0_fao_evapotranspiration,precipitation_probability_max', 'hourly': 'relative_humidity_2m,soil_moisture_0_to_7cm', 'timezone': 'auto', 'forecast_days': 7})
        print(f"Weather status: {r.status_code}")
        print(r.text[:200])

        r2 = await client.get('https://rest.isric.org/soilgrids/v2.0/properties/query', params=[
            ("lon", 78.0), ("lat", 20.0),
            ("property", "nitrogen"),
            ("property", "bdod"),
            ("property", "phh2o"),
            ("property", "soc"),
            ("property", "clay"),
            ("property", "sand"),
            ("property", "cec"),
            ("depth", "0-5cm"),
            ("value", "mean"),
            ("value", "uncertainty"),
        ])
        print(f"Soil status: {r2.status_code}")
        print(r2.text[:200])

asyncio.run(test())
