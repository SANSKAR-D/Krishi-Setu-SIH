from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from shapely.geometry import shape, mapping
from geoalchemy2.shape import from_shape, to_shape
from contextlib import asynccontextmanager
import httpx
import asyncio
import uvicorn
import time
from dotenv import load_dotenv
from dotenv import load_dotenv
from sqlalchemy import text
from agmarknet_api import AgmarknetClient
from datetime import date

load_dotenv()

from database import SessionLocal, Farm, engine, Base

# Create extension and tables on startup
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    conn.commit()
Base.metadata.create_all(bind=engine)
#  IN-MEMORY CACHE WITH TTL

class TTLCache:
    """Simple in-memory cache with per-key TTL expiry."""

    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}

    def get(self, key: str) -> Any:
        if key in self._store:
            if time.time() < self._expiry[key]:
                return self._store[key]
            else:
                # Expired — clean up
                del self._store[key]
                del self._expiry[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int):
        self._store[key] = value
        self._expiry[key] = time.time() + ttl_seconds

    def clear(self):
        self._store.clear()
        self._expiry.clear()


# Cache instances
weather_cache = TTLCache()
soil_cache = TTLCache()
elevation_cache = TTLCache()

WEATHER_TTL = 3600       # 1 hour
SOIL_TTL = 86400          # 24 hours (soil data rarely changes)
ELEVATION_TTL = 604800    # 7 days (elevation never changes)


def _cache_key(lat: float, lon: float) -> str:
    """Round to 2 decimal places (~1km precision) for cache key."""
    return f"{round(lat, 2)},{round(lon, 2)}"


# ═══════════════════════════════════════════════════════════
#  APP LIFESPAN — shared httpx client with connection pooling
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create a shared httpx client on startup, close on shutdown."""
    app.state.http_client = httpx.AsyncClient(
        headers={"User-Agent": "Krishi-Setu-GIS-Backend/1.0"},
        timeout=httpx.Timeout(15.0, connect=5.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        follow_redirects=True,
    )
    yield
    await app.state.http_client.aclose()


app = FastAPI(
    title="GIS Backend",
    version="3.0.0",
    lifespan=lifespan,
)

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── DB dependency ───
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Schemas ───
class FarmCreate(BaseModel):
    name: str
    geojson: Dict[str, Any]

#  EXTERNAL API FETCHERS (all async, run in parallel)

async def fetch_weather(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    """Open-Meteo: current weather + extended daily/hourly data."""

    key = _cache_key(lat, lon)
    cached = weather_cache.get(f"weather:{key}")
    if cached is not None:
        return cached

    try:
        r = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current_weather": True,
                "daily": (
                    "precipitation_sum,temperature_2m_max,temperature_2m_min,"
                    "uv_index_max,et0_fao_evapotranspiration,"
                    "precipitation_probability_max"
                ),
                "hourly": "relative_humidity_2m,soil_moisture_0_to_7cm",
                "timezone": "auto",
                "forecast_days": 7,
            },
            timeout=12.0,
        )
        r.raise_for_status()
        data = r.json()

        cw = data.get("current_weather", {})
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})

        # 7-day rainfall total
        precip_list = daily.get("precipitation_sum", [])
        rainfall_7d = round(sum(p for p in precip_list if p is not None), 1)

        # Current humidity (first non-None hourly value)
        humidity_list = hourly.get("relative_humidity_2m", [])
        humidity = None
        for h in humidity_list:
            if h is not None:
                humidity = h
                break

        # Current soil moisture (first non-None hourly value)
        soil_moisture_list = hourly.get("soil_moisture_0_to_7cm", [])
        soil_moisture = None
        for sm in soil_moisture_list:
            if sm is not None:
                soil_moisture = round(sm, 3)
                break

        # Today's UV index
        uv_list = daily.get("uv_index_max", [])
        uv_index = uv_list[0] if uv_list else None

        # Today's evapotranspiration
        et0_list = daily.get("et0_fao_evapotranspiration", [])
        evapotranspiration = round(et0_list[0], 2) if et0_list and et0_list[0] is not None else None

        # Today's precipitation probability
        precip_prob_list = daily.get("precipitation_probability_max", [])
        precipitation_probability = precip_prob_list[0] if precip_prob_list else None

        # Daily forecast summary
        forecast = []
        dates = daily.get("time", [])
        precips = daily.get("precipitation_sum", [])
        temp_maxs = daily.get("temperature_2m_max", [])
        temp_mins = daily.get("temperature_2m_min", [])
        for i in range(min(7, len(dates))):
            forecast.append({
                "date": dates[i] if i < len(dates) else None,
                "precip_mm": precips[i] if i < len(precips) else None,
                "temp_max": temp_maxs[i] if i < len(temp_maxs) else None,
                "temp_min": temp_mins[i] if i < len(temp_mins) else None,
            })

        result = {
            "temperature": cw.get("temperature"),
            "windspeed": cw.get("windspeed"),
            "weathercode": cw.get("weathercode"),
            "humidity": humidity,
            "rainfall_7d": rainfall_7d,
            "uv_index": uv_index,
            "evapotranspiration": evapotranspiration,
            "soil_moisture": soil_moisture,
            "precipitation_probability": precipitation_probability,
            "forecast": forecast,
        }

        weather_cache.set(f"weather:{key}", result, WEATHER_TTL)
        return result

    except Exception as e:
        print(f"[Weather] Error: {e}")
        return {
            "temperature": None, "windspeed": None, "weathercode": None,
            "humidity": None, "rainfall_7d": None, "uv_index": None,
            "evapotranspiration": None, "soil_moisture": None,
            "precipitation_probability": None, "forecast": [],
        }


async def fetch_soil(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    """
    ISRIC SoilGrids: nitrogen, bulk density, pH, organic carbon,
    clay, sand, CEC (0-5cm depth).
    """

    key = _cache_key(lat, lon)
    cached = soil_cache.get(f"soil:{key}")
    if cached is not None:
        return cached

    try:
        r = await client.get(
            "https://rest.isric.org/soilgrids/v2.0/properties/query",
            params=[
                ("lon", lon), ("lat", lat),
                # Soil properties
                ("property", "nitrogen"),
                ("property", "bdod"),
                ("property", "phh2o"),
                ("property", "soc"),
                ("property", "clay"),
                ("property", "sand"),
                ("property", "cec"),
                # Depth
                ("depth", "0-5cm"),
                # Statistics
                ("value", "mean"),
                ("value", "uncertainty"),
            ],
            timeout=60.0,
        )
        r.raise_for_status()
        data = r.json()

        result = {
            "nitrogen_g_kg": None,
            "nitrogen_kg_ha": None,
            "nitrogen_uncertainty_g_kg": None,
            "bulk_density_kg_dm3": None,
            "ph": None,
            "ph_uncertainty": None,
            "organic_carbon_g_kg": None,
            "organic_carbon_uncertainty": None,
            "clay_percent": None,
            "sand_percent": None,
            "cec_cmol_kg": None,
            "soil_health_score": None,
        }

        for layer in data.get("properties", {}).get("layers", []):
            values = layer.get("depths", [{}])[0].get("values", {})
            mean_val = values.get("mean")
            uncert_val = values.get("uncertainty")

            if layer["name"] == "nitrogen":
                if mean_val is not None:
                    result["nitrogen_g_kg"] = round(mean_val / 100, 2)
                if uncert_val is not None:
                    result["nitrogen_uncertainty_g_kg"] = round(uncert_val / 100, 2)

            elif layer["name"] == "bdod":
                if mean_val is not None:
                    result["bulk_density_kg_dm3"] = round(mean_val / 100, 2)

            elif layer["name"] == "phh2o":
                if mean_val is not None:
                    result["ph"] = round(mean_val / 10, 1)
                if uncert_val is not None:
                    result["ph_uncertainty"] = round(uncert_val / 10, 1)

            elif layer["name"] == "soc":
                # SoilGrids SOC: raw value / 10 = g/kg
                if mean_val is not None:
                    result["organic_carbon_g_kg"] = round(mean_val / 10, 2)
                if uncert_val is not None:
                    result["organic_carbon_uncertainty"] = round(uncert_val / 10, 2)

            elif layer["name"] == "clay":
                # SoilGrids clay: raw value / 10 = %
                if mean_val is not None:
                    result["clay_percent"] = round(mean_val / 10, 1)

            elif layer["name"] == "sand":
                # SoilGrids sand: raw value / 10 = %
                if mean_val is not None:
                    result["sand_percent"] = round(mean_val / 10, 1)

            elif layer["name"] == "cec":
                # SoilGrids CEC: raw value / 10 = cmol(+)/kg
                if mean_val is not None:
                    result["cec_cmol_kg"] = round(mean_val / 10, 1)

        # Convert nitrogen g/kg → kg/ha
        if result["nitrogen_g_kg"] is not None and result["bulk_density_kg_dm3"] is not None:
            depth_cm = 5
            result["nitrogen_kg_ha"] = round(
                result["nitrogen_g_kg"] * result["bulk_density_kg_dm3"] * depth_cm * 10, 2
            )

        # Calculate soil health score (0-100)
        result["soil_health_score"] = _calculate_soil_health(result)

        soil_cache.set(f"soil:{key}", result, SOIL_TTL)
        return result

    except Exception as e:
        print(f"[Soil] Error: {e}")
        return {
            "nitrogen_g_kg": None, "nitrogen_kg_ha": None,
            "nitrogen_uncertainty_g_kg": None, "bulk_density_kg_dm3": None,
            "ph": None, "ph_uncertainty": None,
            "organic_carbon_g_kg": None, "organic_carbon_uncertainty": None,
            "clay_percent": None, "sand_percent": None,
            "cec_cmol_kg": None, "soil_health_score": None,
        }


def _calculate_soil_health(soil: dict) -> Optional[int]:
    """
    Derive a 0-100 soil health score from pH, organic carbon,
    nitrogen, and CEC. Returns None if insufficient data.
    """
    scores = []

    # pH score: ideal range 6.0-7.5
    if soil.get("ph") is not None:
        ph = soil["ph"]
        if 6.0 <= ph <= 7.5:
            scores.append(100)
        elif 5.5 <= ph < 6.0 or 7.5 < ph <= 8.0:
            scores.append(70)
        elif 5.0 <= ph < 5.5 or 8.0 < ph <= 8.5:
            scores.append(40)
        else:
            scores.append(15)

    # Organic carbon score: higher is better (> 2 g/kg = good)
    if soil.get("organic_carbon_g_kg") is not None:
        oc = soil["organic_carbon_g_kg"]
        if oc >= 20:
            scores.append(100)
        elif oc >= 10:
            scores.append(80)
        elif oc >= 5:
            scores.append(55)
        else:
            scores.append(25)

    # Nitrogen score: based on g/kg
    if soil.get("nitrogen_g_kg") is not None:
        n = soil["nitrogen_g_kg"]
        if n >= 2.0:
            scores.append(100)
        elif n >= 1.0:
            scores.append(75)
        elif n >= 0.5:
            scores.append(50)
        else:
            scores.append(20)

    # CEC score: higher = better nutrient retention
    if soil.get("cec_cmol_kg") is not None:
        cec = soil["cec_cmol_kg"]
        if cec >= 25:
            scores.append(100)
        elif cec >= 15:
            scores.append(80)
        elif cec >= 10:
            scores.append(55)
        else:
            scores.append(30)

    if not scores:
        return None

    return round(sum(scores) / len(scores))


async def fetch_elevation(client: httpx.AsyncClient, lat: float, lon: float) -> dict:
    """Open-Meteo Elevation API: terrain height at coordinates."""

    key = _cache_key(lat, lon)
    cached = elevation_cache.get(f"elev:{key}")
    if cached is not None:
        return cached

    try:
        r = await client.get(
            "https://api.open-meteo.com/v1/elevation",
            params={"latitude": lat, "longitude": lon},
            timeout=8.0,
        )
        r.raise_for_status()
        data = r.json()

        elevations = data.get("elevation", [])
        elevation = elevations[0] if elevations else None

        result = {"elevation_m": elevation}
        elevation_cache.set(f"elev:{key}", result, ELEVATION_TTL)
        return result

    except Exception as e:
        print(f"[Elevation] Error: {e}")
        return {"elevation_m": None}

#  ROUTES

@app.get("/")
def read_root():
    return {"message": "Welcome to GIS API", "status": "running"}


@app.get("/api/environment")
async def get_environment(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
):
    """
    Single endpoint that fetches Weather, Soil, Elevation, and Markets
    data **in parallel** for a given coordinate.
    Includes in-memory caching — repeated requests return instantly.
    """
    client = app.state.http_client

    weather_task = fetch_weather(client, lat, lng)
    soil_task = fetch_soil(client, lat, lng)
    elevation_task = fetch_elevation(client, lat, lng)

    weather, soil, elevation = await asyncio.gather(
        weather_task, soil_task, elevation_task
    )

    return {
        "status": "success",
        "data": {
            "weather": weather,
            "soil": soil,
            "elevation": elevation
        },
    }


@app.get("/api/farms")
def get_farms(db: Session = Depends(get_db)):
    """Return all saved farm boundaries as GeoJSON features."""
    farms = db.query(Farm).all()
    results = []
    for f in farms:
        try:
            geom_shape = to_shape(f.geom)
            geojson_geometry = mapping(geom_shape)
        except Exception:
            geojson_geometry = {"type": "Polygon", "coordinates": []}

        results.append({
            "id": f.id,
            "name": f.name,
            "created_at": f.created_at.isoformat() if f.created_at else None,
            "geojson": {
                "type": "Feature",
                "properties": {"name": f.name, "id": f.id},
                "geometry": geojson_geometry,
            },
        })
    return {"status": "success", "data": results}


@app.post("/api/farms")
def create_farm(farm: FarmCreate, db: Session = Depends(get_db)):
    """Save a new farm boundary polygon into PostGIS."""
    geometry = farm.geojson.get("geometry")
    if not geometry:
        raise HTTPException(status_code=400, detail="Missing 'geometry' in geojson payload.")

    coords = geometry.get("coordinates", [])
    if not coords or len(coords) == 0:
        raise HTTPException(status_code=400, detail="Empty polygon coordinates.")

    ring = coords[0] if isinstance(coords[0], list) else []
    if len(ring) < 4:
        raise HTTPException(
            status_code=400,
            detail=f"Polygon must have at least 4 coordinate pairs (got {len(ring)}).",
        )

    try:
        geom = shape(geometry)
        if not geom.is_valid:
            raise ValueError(f"Invalid polygon geometry: {geom.geom_type}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse geometry: {str(e)}")

    try:
        db_farm = Farm(name=farm.name, geom=from_shape(geom, srid=4326))
        db.add(db_farm)
        db.commit()
        db.refresh(db_farm)
        return {"status": "success", "data": {"id": db_farm.id, "name": db_farm.name}}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/api/farms/{farm_id}")
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    """Delete a saved farm by ID."""
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
    db.delete(farm)
    db.commit()
    return {"status": "success", "message": f"Farm {farm_id} deleted."}

# ─── AGMARKNET INTEGRATION ───

client = AgmarknetClient()

@app.get("/api/agmarknet/states")
def get_states():
    try:
        all_states = []
        page = 1
        while True:
            response = client.list_states(page=page, search="")
            states = response.get("states", [])
            if not states:
                break
            all_states.extend(states)
            
            pagination = response.get("pagination", {})
            if page >= pagination.get("total_pages", 1):
                break
            page += 1
            
        VALID_STATES = [
            'Andhra Pradesh', 'Assam', 'Bihar', 'Chattisgarh', 'Gujarat', 'Haryana', 
            'Himachal Pradesh', 'Jammu and Kashmir', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
            'Maharashtra', 'NCT of Delhi', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 
            'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttrakhand', 'West Bengal'
        ]
        
        filtered_states = [
            s for s in all_states 
            if (s.get('state_name') or s.get('stateName') or s.get('name')) in VALID_STATES
        ]
            
        return {"states": filtered_states}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/agmarknet/daily_report/{state_id}")
def get_daily_report(state_id: str):
    from datetime import timedelta
    
    # Agmarknet data is typically available for the previous day.
    # Try today first, and fall back to previous days if no data is returned.
    for days_back in range(0, 8):
        target_date = (date.today() - timedelta(days=days_back)).isoformat()
        try:
            report = client.commodity_market_daily_report_state(date=target_date, state_id=state_id)
        except Exception as e:
            print(f"Error fetching data for {target_date}: {e}")
            continue
        
        commodity_groups = report.get("commodityGroups", [])
        if not commodity_groups:
            continue  # no data for this date, try previous day
        
        # Flatten the nested structure into a list of rows for the frontend
        flat_data = []
        for group in commodity_groups:
            for commodity in group.get("commodities", []):
                commodity_name = commodity.get("commodityName", "")
                for market in commodity.get("markets", []):
                    market_name = market.get("marketCenter", "")
                    for item in market.get("data", []):
                        flat_data.append({
                            "commodityName": commodity_name,
                            "marketName": market_name,
                            "variety": item.get("variety"),
                            "minPrice": item.get("minimumPrice"),
                            "maxPrice": item.get("maximumPrice"),
                            "modalPrice": item.get("modalPrice"),
                            "arrivals": item.get("arrivals"),
                            "unitOfArrivals": item.get("unitOfArrivals"),
                            "unitOfPrice": item.get("unitOfPrice"),
                        })
        
        return {"date": target_date, "data": flat_data}
    
    return {"date": date.today().isoformat(), "data": [], "message": "No data available for the last 7 days"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
    # Reload triggered
