import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import * as turf from '@turf/turf';
import {
  Layers, MapPin, Database, CloudRain, Navigation, Search,
  Trash2, Sprout, Mountain, Droplets, Thermometer, Wind, Sun,
  RefreshCw, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import axios from 'axios';

// CSS imports — must load before map initializes
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

const GIS_URL = import.meta.env.VITE_GIS_URL || 'http://localhost:8001';

// ─── Direct API URLs (fallback when backend is unavailable) ───
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_ELEVATION_URL = 'https://api.open-meteo.com/v1/elevation';
const SOILGRIDS_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

// ─── Helper: validate a GeoJSON polygon has real coordinates ───
function isValidPolygon(feature) {
  try {
    return (
      feature &&
      feature.geometry &&
      feature.geometry.type === 'Polygon' &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length > 0 &&
      Array.isArray(feature.geometry.coordinates[0]) &&
      feature.geometry.coordinates[0].length >= 4
    );
  } catch {
    return false;
  }
}

// ─── Helper: soil health score color ───
function healthColor(score) {
  if (score == null) return 'var(--color-on-surface-variant)';
  if (score >= 75) return '#34d399';
  if (score >= 50) return '#fbbf24';
  if (score >= 25) return '#fb923c';
  return '#f87171';
}

function healthLabel(score) {
  if (score == null) return '—';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Good';
  if (score >= 25) return 'Fair';
  return 'Poor';
}

// ─── Helper: crop suitability color ───
function suitabilityColor(score) {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#a3e635';
  if (score >= 40) return '#fbbf24';
  return '#fb923c';
}

// ─── Calculate soil health score client-side ───
function calculateSoilHealth(soil) {
  const scores = [];
  if (soil.ph != null) {
    const ph = soil.ph;
    if (ph >= 6.0 && ph <= 7.5) scores.push(100);
    else if ((ph >= 5.5 && ph < 6.0) || (ph > 7.5 && ph <= 8.0)) scores.push(70);
    else if ((ph >= 5.0 && ph < 5.5) || (ph > 8.0 && ph <= 8.5)) scores.push(40);
    else scores.push(15);
  }
  if (soil.organic_carbon_g_kg != null) {
    const oc = soil.organic_carbon_g_kg;
    if (oc >= 20) scores.push(100);
    else if (oc >= 10) scores.push(80);
    else if (oc >= 5) scores.push(55);
    else scores.push(25);
  }
  if (soil.nitrogen_g_kg != null) {
    const n = soil.nitrogen_g_kg;
    if (n >= 2.0) scores.push(100);
    else if (n >= 1.0) scores.push(75);
    else if (n >= 0.5) scores.push(50);
    else scores.push(20);
  }
  if (soil.cec_cmol_kg != null) {
    const cec = soil.cec_cmol_kg;
    if (cec >= 25) scores.push(100);
    else if (cec >= 15) scores.push(80);
    else if (cec >= 10) scores.push(55);
    else scores.push(30);
  }
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ─── Direct fetch: Weather from Open-Meteo ───
async function fetchWeatherDirect(lat, lng) {
  const res = await axios.get(OPEN_METEO_URL, {
    params: {
      latitude: lat, longitude: lng,
      current_weather: true,
      daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min,uv_index_max,et0_fao_evapotranspiration,precipitation_probability_max',
      hourly: 'relative_humidity_2m,soil_moisture_0_to_7cm',
      timezone: 'auto', forecast_days: 7,
    },
    timeout: 15000,
  });
  const data = res.data;
  const cw = data.current_weather || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};
  const precip_list = daily.precipitation_sum || [];
  const rainfall_7d = parseFloat(precip_list.filter(Boolean).reduce((a, b) => a + b, 0).toFixed(1));
  const humidity_list = hourly.relative_humidity_2m || [];
  const humidity = humidity_list.find(h => h != null) ?? null;
  const sm_list = hourly.soil_moisture_0_to_7cm || [];
  const sm_val = sm_list.find(s => s != null);
  const soil_moisture = sm_val != null ? parseFloat(sm_val.toFixed(3)) : null;
  const uv_list = daily.uv_index_max || [];
  const uv_index = uv_list[0] ?? null;
  const et0_list = daily.et0_fao_evapotranspiration || [];
  const evapotranspiration = et0_list[0] != null ? parseFloat(et0_list[0].toFixed(2)) : null;
  const precip_prob_list = daily.precipitation_probability_max || [];
  const precipitation_probability = precip_prob_list[0] ?? null;
  const dates = daily.time || [];
  const precips = daily.precipitation_sum || [];
  const temp_maxs = daily.temperature_2m_max || [];
  const temp_mins = daily.temperature_2m_min || [];
  const forecast = dates.slice(0, 7).map((date, i) => ({
    date,
    precip_mm: precips[i] ?? null,
    temp_max: temp_maxs[i] ?? null,
    temp_min: temp_mins[i] ?? null,
  }));
  return {
    temperature: cw.temperature ?? null, windspeed: cw.windspeed ?? null,
    weathercode: cw.weathercode ?? null, humidity, rainfall_7d, uv_index,
    evapotranspiration, soil_moisture, precipitation_probability, forecast,
  };
}

// ─── Direct fetch: Elevation from Open-Meteo ───
async function fetchElevationDirect(lat, lng) {
  const res = await axios.get(OPEN_METEO_ELEVATION_URL, {
    params: { latitude: lat, longitude: lng },
    timeout: 10000,
  });
  const elevations = res.data.elevation || [];
  return { elevation_m: elevations[0] ?? null };
}

// ─── Direct fetch: Soil from SoilGrids ───
async function fetchSoilDirect(lat, lng) {
  try {
    const params = new URLSearchParams();
    params.append('lon', lng);
    params.append('lat', lat);
    ['nitrogen', 'bdod', 'phh2o', 'soc', 'clay', 'sand', 'cec'].forEach(p => params.append('property', p));
    params.append('depth', '0-5cm');
    ['mean', 'uncertainty'].forEach(v => params.append('value', v));
    const res = await axios.get(`${SOILGRIDS_URL}?${params.toString()}`, { timeout: 60000 });
    const data = res.data;
    const result = {
      nitrogen_g_kg: null, nitrogen_kg_ha: null, nitrogen_uncertainty_g_kg: null,
      bulk_density_kg_dm3: null, ph: null, ph_uncertainty: null,
      organic_carbon_g_kg: null, organic_carbon_uncertainty: null,
      clay_percent: null, sand_percent: null, cec_cmol_kg: null, soil_health_score: null,
    };
    for (const layer of data?.properties?.layers || []) {
      const vals = layer?.depths?.[0]?.values || {};
      const mean = vals.mean;
      const uncert = vals.uncertainty;
      if (layer.name === 'nitrogen') {
        if (mean != null) result.nitrogen_g_kg = parseFloat((mean / 100).toFixed(2));
        if (uncert != null) result.nitrogen_uncertainty_g_kg = parseFloat((uncert / 100).toFixed(2));
      } else if (layer.name === 'bdod') {
        if (mean != null) result.bulk_density_kg_dm3 = parseFloat((mean / 100).toFixed(2));
      } else if (layer.name === 'phh2o') {
        if (mean != null) result.ph = parseFloat((mean / 10).toFixed(1));
        if (uncert != null) result.ph_uncertainty = parseFloat((uncert / 10).toFixed(1));
      } else if (layer.name === 'soc') {
        if (mean != null) result.organic_carbon_g_kg = parseFloat((mean / 10).toFixed(2));
        if (uncert != null) result.organic_carbon_uncertainty = parseFloat((uncert / 10).toFixed(2));
      } else if (layer.name === 'clay') {
        if (mean != null) result.clay_percent = parseFloat((mean / 10).toFixed(1));
      } else if (layer.name === 'sand') {
        if (mean != null) result.sand_percent = parseFloat((mean / 10).toFixed(1));
      } else if (layer.name === 'cec') {
        if (mean != null) result.cec_cmol_kg = parseFloat((mean / 10).toFixed(1));
      }
    }
    if (result.nitrogen_g_kg != null && result.bulk_density_kg_dm3 != null) {
      result.nitrogen_kg_ha = parseFloat((result.nitrogen_g_kg * result.bulk_density_kg_dm3 * 5 * 10).toFixed(2));
    }
    result.soil_health_score = calculateSoilHealth(result);
    return result;
  } catch (err) {
    console.warn("SoilGrids API failed, returning null data:", err.message);
    const result = {
      nitrogen_g_kg: null, nitrogen_kg_ha: null, nitrogen_uncertainty_g_kg: null,
      bulk_density_kg_dm3: null, ph: null, ph_uncertainty: null,
      organic_carbon_g_kg: null, organic_carbon_uncertainty: null,
      clay_percent: null, sand_percent: null, cec_cmol_kg: null, soil_health_score: null,
    };
    return result;
  }
}

// ─── Weather code helpers ───
function getWeatherEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function getWeatherDescription(code) {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 49) return 'Foggy / hazy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

const MapDashboard = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);

  const [savedFarms, setSavedFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [areaInfo, setAreaInfo] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState(null);
  const [envSource, setEnvSource] = useState(null); // 'backend' | 'direct' | null
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [farmNameInput, setFarmNameInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const lastCoords = useRef(null);

  // ─────────── Fetch saved farms ───────────
  const fetchSavedFarms = useCallback(async () => {
    try {
      const res = await axios.get(`${GIS_URL}/api/farms`);
      if (res.data.status === 'success') {
        setSavedFarms(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch saved farms:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchSavedFarms();
  }, [fetchSavedFarms]);

  // ─────────── Environmental data fetcher ───────────
  // Strategy: try backend first → fall back to direct Open APIs
  const fetchEnvironmentalData = useCallback(async (lat, lng) => {
    setEnvLoading(true);
    setEnvError(null);
    lastCoords.current = { lat, lng };

    // Attempt 1: Backend aggregator
    let backendData = null;
    try {
      const res = await axios.get(`${GIS_URL}/api/environment`, {
        params: { lat, lng },
        timeout: 60000,
      });
      if (res.data.status === 'success') {
        backendData = res.data.data;
      }
    } catch (backendErr) {
      console.warn('[GIS] Backend unavailable, trying direct APIs…', backendErr.message);
    }

    const isWeatherValid = backendData?.weather?.temperature != null;
    const isElevationValid = backendData?.elevation?.elevation_m != null;
    const isSoilValid = backendData?.soil?.ph != null || backendData?.soil?.nitrogen_g_kg != null;

    if (backendData && isWeatherValid && isElevationValid && isSoilValid) {
        setEnvData(backendData);
        setEnvSource('backend');
        setEnvLoading(false);
        return;
    }

    console.warn('[GIS] Backend data incomplete or unavailable, falling back to direct APIs for missing data…');

    // Attempt 2: Direct API calls in parallel
    try {
      const [weatherRes, elevationRes, soilRes] = await Promise.allSettled([
        !isWeatherValid ? fetchWeatherDirect(lat, lng) : Promise.resolve(backendData?.weather || {}),
        !isElevationValid ? fetchElevationDirect(lat, lng) : Promise.resolve(backendData?.elevation || {}),
        !isSoilValid ? fetchSoilDirect(lat, lng) : Promise.resolve(backendData?.soil || {}),
      ]);

      const weatherData = weatherRes.status === 'fulfilled' ? weatherRes.value : {
        temperature: null, windspeed: null, humidity: null, rainfall_7d: null,
        uv_index: null, evapotranspiration: null, soil_moisture: null,
        precipitation_probability: null, weathercode: null, forecast: [],
      };
      if (weatherRes.status === 'rejected') console.warn('[Weather] Direct fetch failed:', weatherRes.reason?.message);

      const elevationData = elevationRes.status === 'fulfilled' ? elevationRes.value : { elevation_m: null };
      if (elevationRes.status === 'rejected') console.warn('[Elevation] Direct fetch failed:', elevationRes.reason?.message);

      const soilData = soilRes.status === 'fulfilled' ? soilRes.value : {
        nitrogen_g_kg: null, nitrogen_kg_ha: null, nitrogen_uncertainty_g_kg: null,
        bulk_density_kg_dm3: null, ph: null, ph_uncertainty: null,
        organic_carbon_g_kg: null, organic_carbon_uncertainty: null,
        clay_percent: null, sand_percent: null, cec_cmol_kg: null, soil_health_score: null,
      };
      if (soilRes.status === 'rejected') console.warn('[Soil] Direct fetch failed:', soilRes.reason?.message);

      const hasAnyData = weatherRes.status === 'fulfilled' || elevationRes.status === 'fulfilled' || soilRes.status === 'fulfilled';

      if (hasAnyData) {
        setEnvData({ weather: weatherData, elevation: elevationData, soil: soilData });
        setEnvSource('direct');
        setEnvError(null);
      } else {
        setEnvData(null);
        setEnvError('All data sources failed. Check your internet connection.');
      }
    } catch (directErr) {
      console.error('[GIS] All environment fetches failed:', directErr);
      setEnvData(null);
      setEnvError('Failed to load environment data. Please try again.');
    } finally {
      setEnvLoading(false);
    }
  }, []);

  // ─── Retry handler ───
  const retryEnvData = useCallback(() => {
    if (lastCoords.current) {
      fetchEnvironmentalData(lastCoords.current.lat, lastCoords.current.lng);
    }
  }, [fetchEnvironmentalData]);

  // ─────────── Area calculation ───────────
  const updateArea = useCallback(() => {
    if (!draw.current) return;
    const data = draw.current.getAll();
    if (!data || data.features.length === 0) {
      setAreaInfo(null);
      setEnvData(null);
      setEnvError(null);
      return;
    }
    const polygon = data.features[data.features.length - 1];
    if (!isValidPolygon(polygon)) {
      setAreaInfo(null);
      setEnvData(null);
      return;
    }
    try {
      const area = turf.area(polygon);
      const hectares = (area / 10000).toFixed(2);
      const acres = (area / 4046.86).toFixed(2);
      setAreaInfo({ hectares, acres });

      const centroid = turf.centroid(polygon);
      if (centroid?.geometry?.coordinates) {
        const [lng, lat] = centroid.geometry.coordinates;
        fetchEnvironmentalData(lat, lng);
      }
    } catch (err) {
      console.warn('Turf calculation error:', err.message);
      setAreaInfo(null);
    }
  }, [fetchEnvironmentalData]);

  // ─────────── Map initialisation ───────────
  useEffect(() => {
    if (map.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [78.9629, 20.5937], // India centre
      zoom: 4,
      pitch: 40,
      attributionControl: false,
    });

    const drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: 'simple_select',
    });

    // Controls
    mapInstance.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    mapInstance.addControl(drawInstance, 'top-left');
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Geocoder
    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl: mapboxgl,
      marker: true,
      placeholder: 'Search a location…',
    });
    mapInstance.addControl(geocoder, 'top-left');

    // Geolocation
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    mapInstance.addControl(geolocate, 'top-right');

    // Force resize after load to fix 0-height canvas bug
    mapInstance.on('load', () => {
      mapInstance.resize();
    });

    // Draw events
    mapInstance.on('draw.create', (e) => {
      if (drawInstance && e.features && e.features.length > 0) {
        const newId = e.features[0].id;
        const all = drawInstance.getAll();
        all.features.forEach(f => {
          if (f.id !== newId) drawInstance.delete(f.id);
        });
      }
      setSelectedFarmId('');
      updateArea();
    });
    mapInstance.on('draw.update', () => updateArea());
    mapInstance.on('draw.delete', () => {
      setAreaInfo(null);
      setEnvData(null);
      setEnvError(null);
      lastCoords.current = null;
    });

    map.current = mapInstance;
    draw.current = drawInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
      draw.current = null;
    };
  }, [updateArea]);

  // ─────────── Select saved farm ───────────
  const handleSelectFarm = (e) => {
    const farmId = e.target.value;
    setSelectedFarmId(farmId);
    if (!farmId) return;
    const farm = savedFarms.find((f) => String(f.id) === String(farmId));
    if (!farm) return;

    draw.current.deleteAll();

    if (!isValidPolygon(farm.geojson)) {
      console.warn('Selected farm has empty/invalid geometry');
      setAreaInfo(null);
      setEnvData(null);
      return;
    }

    draw.current.add(farm.geojson);

    try {
      const centroid = turf.centroid(farm.geojson);
      if (centroid?.geometry?.coordinates) {
        const [lng, lat] = centroid.geometry.coordinates;
        map.current.flyTo({ center: [lng, lat], zoom: 15, pitch: 45 });
      }
    } catch (err) {
      console.warn('Could not fly to farm centroid:', err.message);
    }

    updateArea();
  };

  // ─────────── Save farm ───────────
  const saveFarm = async () => {
    setSaveStatus(null);
    if (!draw.current) return;
    const data = draw.current.getAll();
    if (!data || data.features.length === 0) {
      setSaveStatus({ type: 'error', text: 'Please draw a farm polygon first!' });
      return;
    }
    const feature = data.features[data.features.length - 1];
    if (!isValidPolygon(feature)) {
      setSaveStatus({ type: 'error', text: 'Please finish drawing a valid closed polygon (at least 3 points).' });
      return;
    }

    const baseName = farmNameInput.trim() || 'My Farm';

    let count = 1;
    let finalName = baseName;
    while (savedFarms.some(f => f.name === finalName)) {
      finalName = `${baseName} (${count})`;
      count++;
    }

    setSaving(true);
    try {
      await axios.post(`${GIS_URL}/api/farms`, {
        name: finalName,
        geojson: feature,
      });
      setSaveStatus({ type: 'success', text: 'Farm saved successfully!' });
      await fetchSavedFarms();
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      setSaveStatus({ type: 'error', text: 'Failed to save farm. ' + (err.response?.data?.detail || 'Is the backend running?') });
    } finally {
      setSaving(false);
    }
  };

  // ─────────── Derived data ───────────
  const weather = envData?.weather;
  const soil = envData?.soil;
  const elevation = envData?.elevation;

  // ─────────── Render ───────────
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* ═══ Map ═══ */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      </div>

      {/* ═══ Side Panel ═══ */}
      <div
        style={{
          width: 400,
          minWidth: 360,
          background: 'var(--color-surface)',
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          overflowY: 'auto',
          color: 'var(--color-on-surface)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #1e293b', paddingBottom: 14 }}>
          <Layers style={{ width: 28, height: 28, color: '#34d399' }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, background: 'linear-gradient(90deg,#34d399,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Krishi-Setu GIS
          </h1>
        </div>

        {/* Saved Farms Dropdown */}
        <Card title="My Saved Farms" icon={<Database style={{ width: 16, height: 16, color: '#a78bfa' }} />}>
          <select
            value={selectedFarmId}
            onChange={handleSelectFarm}
            style={{
              width: '100%',
              background: 'var(--color-surface-container)',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: '8px 10px',
              color: 'var(--color-on-surface)',
              outline: 'none',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="">Select a farm…</option>
            {savedFarms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        </Card>

        {/* Spatial Analytics */}
        <Card title="Spatial Analytics" icon={<MapPin style={{ width: 16, height: 16, color: '#22d3ee' }} />}>
          {areaInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <MetricRow label="Area (Hectares)" value={`${areaInfo.hectares} ha`} color="#34d399" />
              <MetricRow label="Area (Acres)" value={`${areaInfo.acres} ac`} color="#22d3ee" />
              {elevation?.elevation_m != null ? (
                <MetricRow label="Elevation" value={`${elevation.elevation_m} m`} color="#a78bfa" />
              ) : envLoading ? (
                <div style={{ background: 'var(--color-surface-container)', padding: '10px 12px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-on-surface-variant)', fontSize: 13 }}>Elevation</span>
                  <div style={{ height: 14, width: 60, background: 'var(--color-outline-variant)', borderRadius: 3, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              ) : null}
            </div>
          ) : (
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
              Draw a polygon on the map to calculate area and fetch environment data.
            </p>
          )}
        </Card>

        {/* Loading State */}
        {envLoading && (
          <Card title="Fetching Environment Data…" icon={<CloudRain style={{ width: 16, height: 16, color: '#60a5fa' }} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[...Array(6)].map((_, i) => (
                <SkeletonTile key={i} />
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
              Fetching weather, soil, and elevation data…
            </div>
          </Card>
        )}

        {/* Error State */}
        {envError && !envLoading && (
          <Card title="Data Fetch Error" icon={<AlertTriangle style={{ width: 16, height: 16, color: '#f87171' }} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: '#f87171', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{envError}</p>
              <button
                onClick={retryEnvData}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, border: '1px solid #334155',
                  background: 'var(--color-surface-container)', color: 'var(--color-on-surface)', fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ width: 13, height: 13 }} />
                Retry
              </button>
            </div>
          </Card>
        )}

        {/* Environment Data Tabs */}
        {envData && !envLoading && (
          <>
            {/* Tab buttons */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--color-surface-container)', borderRadius: 10, padding: 4 }}>
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'soil', label: 'Soil' },
                { key: 'weather', label: 'Weather' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: '7px 6px',
                    borderRadius: 8,
                    border: 'none',
                    background: activeTab === tab.key ? 'var(--color-primary-container)' : 'transparent',
                    color: activeTab === tab.key ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)',
                    fontWeight: activeTab === tab.key ? 600 : 400,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ─── Overview Tab ─── */}
            {activeTab === 'overview' && (
              <Card title="Environment Overview" icon={<CloudRain style={{ width: 16, height: 16, color: '#60a5fa' }} />}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <MetricTile label="Temp" value={weather?.temperature != null ? `${weather.temperature}°C` : '—'} color="#fbbf24" icon="🌡️" />
                  <MetricTile label="Wind" value={weather?.windspeed != null ? `${weather.windspeed} km/h` : '—'} color="#60a5fa" icon="💨" />
                  <MetricTile label="Soil pH" value={soil?.ph != null ? soil.ph.toFixed(1) : '—'} color="#34d399" icon="🧪" />
                  <MetricTile label="Elevation" value={elevation?.elevation_m != null ? `${elevation.elevation_m} m` : '—'} color="#a78bfa" icon="⛰️" />
                  <MetricTile label="Humidity" value={weather?.humidity != null ? `${weather.humidity}%` : '—'} color="#818cf8" icon="💧" />
                  <MetricTile label="7-Day Rain" value={weather?.rainfall_7d != null ? `${weather.rainfall_7d} mm` : '—'} color="#38bdf8" icon="🌧️" />
                </div>

                {/* Soil Health Badge */}
                {soil?.soil_health_score != null ? (
                  <div style={{
                    marginTop: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${healthColor(soil.soil_health_score)}15, ${healthColor(soil.soil_health_score)}08)`,
                    border: `1px solid ${healthColor(soil.soil_health_score)}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1 }}>Soil Health</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: healthColor(soil.soil_health_score), marginTop: 2 }}>
                        {healthLabel(soil.soil_health_score)}
                      </div>
                    </div>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `conic-gradient(${healthColor(soil.soil_health_score)} ${soil.soil_health_score * 3.6}deg, #1e293b ${soil.soil_health_score * 3.6}deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', background: 'var(--color-surface)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: healthColor(soil.soil_health_score),
                      }}>
                        {soil.soil_health_score}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginTop: 10, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--color-surface-container)', border: '1px dashed #334155',
                    fontSize: 12, color: 'var(--color-on-surface-variant)', textAlign: 'center',
                  }}>
                    Soil health data unavailable for this location
                  </div>
                )}

                {/* Weather condition */}
                {weather?.weathercode != null && (
                  <div style={{
                    marginTop: 8, padding: '6px 12px', borderRadius: 8,
                    background: 'var(--color-surface-container)', fontSize: 12, color: 'var(--color-on-surface-variant)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span>{getWeatherEmoji(weather.weathercode)}</span>
                    <span>{getWeatherDescription(weather.weathercode)}</span>
                  </div>
                )}
              </Card>
            )}

            {/* ─── Soil Tab ─── */}
            {activeTab === 'soil' && (
              <Card title="Soil Properties" icon={<Sprout style={{ width: 16, height: 16, color: '#34d399' }} />}>
                {soil?.ph != null || soil?.nitrogen_g_kg != null || soil?.organic_carbon_g_kg != null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <MetricRow label="pH (H₂O)" value={soil?.ph != null ? soil.ph.toFixed(1) : '—'} color="#34d399" />
                    <MetricRow label="Nitrogen" value={soil?.nitrogen_g_kg != null ? `${soil.nitrogen_g_kg} g/kg` : '—'} color="#22d3ee" />
                    <MetricRow label="Nitrogen (kg/ha)" value={soil?.nitrogen_kg_ha != null ? `${soil.nitrogen_kg_ha}` : '—'} color="#38bdf8" />
                    <MetricRow label="Organic Carbon" value={soil?.organic_carbon_g_kg != null ? `${soil.organic_carbon_g_kg} g/kg` : '—'} color="#a78bfa" />
                    <MetricRow label="Clay Content" value={soil?.clay_percent != null ? `${soil.clay_percent}%` : '—'} color="#fb923c" />
                    <MetricRow label="Sand Content" value={soil?.sand_percent != null ? `${soil.sand_percent}%` : '—'} color="#fbbf24" />
                    <MetricRow label="CEC" value={soil?.cec_cmol_kg != null ? `${soil.cec_cmol_kg} cmol/kg` : '—'} color="#f472b6" />
                    <MetricRow label="Bulk Density" value={soil?.bulk_density_kg_dm3 != null ? `${soil.bulk_density_kg_dm3} kg/dm³` : '—'} color="#94a3b8" />

                    {/* Soil texture bars */}
                    {(soil?.clay_percent != null || soil?.sand_percent != null) && (
                      <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: 8, background: 'var(--color-surface-container)' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                          Soil Texture Composition
                        </div>
                        {soil.clay_percent != null && <TextureBar label="Clay" value={soil.clay_percent} color="#fb923c" />}
                        {soil.sand_percent != null && <TextureBar label="Sand" value={soil.sand_percent} color="#fbbf24" />}
                        {soil.clay_percent != null && soil.sand_percent != null && (
                          <TextureBar label="Silt (est.)" value={Math.max(0, 100 - soil.clay_percent - soil.sand_percent)} color="#818cf8" />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🌍</div>
                    <div style={{ color: 'var(--color-on-surface-variant)', fontSize: 13 }}>Soil data unavailable for this location.</div>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>SoilGrids may not have coverage here.</div>
                    <button onClick={retryEnvData} style={{
                      marginTop: 12, padding: '7px 14px', borderRadius: 7, border: '1px solid #334155',
                      background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)', fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, margin: '12px auto 0',
                    }}>
                      <RefreshCw style={{ width: 12, height: 12 }} /> Retry
                    </button>
                  </div>
                )}

                {/* Soil Health Score */}
                {soil?.soil_health_score != null && (
                  <div style={{
                    marginTop: 10, padding: 10, borderRadius: 8,
                    background: 'var(--color-surface-container)', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1 }}>Health Score</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: healthColor(soil.soil_health_score) }}>
                      {soil.soil_health_score}<span style={{ fontSize: 14, color: 'var(--color-on-surface-variant)' }}>/100</span>
                    </div>
                    <div style={{ fontSize: 12, color: healthColor(soil.soil_health_score), fontWeight: 500 }}>
                      {healthLabel(soil.soil_health_score)}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* ─── Weather Tab ─── */}
            {activeTab === 'weather' && (
              <Card title="Weather Details" icon={<Thermometer style={{ width: 16, height: 16, color: '#fbbf24' }} />}>
                {weather?.temperature != null || weather?.humidity != null ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <MetricTile label="Temperature" value={weather?.temperature != null ? `${weather.temperature}°C` : '—'} color="#fbbf24" icon="🌡️" />
                      <MetricTile label="Wind Speed" value={weather?.windspeed != null ? `${weather.windspeed} km/h` : '—'} color="#60a5fa" icon="💨" />
                      <MetricTile label="Humidity" value={weather?.humidity != null ? `${weather.humidity}%` : '—'} color="#818cf8" icon="💧" />
                      <MetricTile label="UV Index" value={weather?.uv_index != null ? `${weather.uv_index}` : '—'} color="#f472b6" icon="☀️" />
                      <MetricTile label="Rain Prob." value={weather?.precipitation_probability != null ? `${weather.precipitation_probability}%` : '—'} color="#38bdf8" icon="🌧️" />
                      <MetricTile label="7-Day Rain" value={weather?.rainfall_7d != null ? `${weather.rainfall_7d} mm` : '—'} color="#22d3ee" icon="🌂" />
                      <MetricTile label="ET₀ (today)" value={weather?.evapotranspiration != null ? `${weather.evapotranspiration} mm` : '—'} color="#a78bfa" icon="🌿" />
                      <MetricTile label="Soil Moisture" value={weather?.soil_moisture != null ? `${weather.soil_moisture} m³/m³` : '—'} color="#34d399" icon="🫧" />
                    </div>
                    {weather?.forecast?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>7-Day Forecast</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {weather.forecast.map((day, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 6, background: 'var(--color-surface-container)', fontSize: 11 }}>
                              <span style={{ color: 'var(--color-on-surface-variant)', minWidth: 70 }}>{day.date}</span>
                              <span style={{ color: '#fbbf24' }}>{day.temp_min != null ? `${day.temp_min}°` : '—'} / {day.temp_max != null ? `${day.temp_max}°` : '—'}</span>
                              <span style={{ color: '#38bdf8' }}>{day.precip_mm != null ? `${day.precip_mm}mm` : '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🌤️</div>
                    <div style={{ color: 'var(--color-on-surface-variant)', fontSize: 13 }}>Weather data unavailable.</div>
                    <button onClick={retryEnvData} style={{ marginTop: 12, padding: '7px 14px', borderRadius: 7, border: '1px solid #334155', background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, margin: '12px auto 0' }}>
                      <RefreshCw style={{ width: 12, height: 12 }} /> Retry
                    </button>
                  </div>
                )}
              </Card>
            )}


          </>
        )}

        {/* Save Button */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-outline-variant)' }}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={farmNameInput}
              onChange={(e) => setFarmNameInput(e.target.value)}
              placeholder="Enter farm name (default: My Farm)"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface)',
                color: 'var(--color-on-surface)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          {saveStatus && (
            <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: saveStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: saveStatus.type === 'error' ? '#ef4444' : '#10b981', border: `1px solid ${saveStatus.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
              {saveStatus.type === 'error' ? <Info style={{ width: 14, height: 14 }} /> : <CheckCircle style={{ width: 14, height: 14 }} />}
              {saveStatus.text}
            </div>
          )}
          <button
            onClick={saveFarm}
            disabled={saving}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: saving ? 'var(--color-outline-variant)' : 'linear-gradient(90deg,#10b981,#06b6d4)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              transition: 'all 0.2s',
            }}
          >
            <Database style={{ width: 18, height: 18 }} />
            {saving ? 'Saving…' : 'Save Boundary to PostGIS'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────── Reusable Card ───────────
function Card({ title, icon, children }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 14,
        backdropFilter: 'blur(8px)',
      }}
    >
      {title && (
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-on-surface-variant)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px 0' }}>
          {icon}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

// ─────────── Metric Row ───────────
function MetricRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-container)', padding: '10px 12px', borderRadius: 8 }}>
      <span style={{ color: 'var(--color-on-surface-variant)', fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, color, fontSize: 14 }}>{value}</span>
    </div>
  );
}

// ─────────── Metric Tile ───────────
function MetricTile({ label, value, color, icon }) {
  return (
    <div style={{ background: 'var(--color-surface-container)', padding: 10, borderRadius: 8, textAlign: 'center' }}>
      {icon && <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─────────── Texture Bar ───────────
function TextureBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-on-surface-variant)', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--color-outline-variant)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, value)}%`,
          background: color, borderRadius: 3, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

// ─────────── Skeleton Tile (loading state) ───────────
function SkeletonTile() {
  return (
    <div style={{
      background: 'var(--color-surface-container)',
      padding: 10,
      borderRadius: 8,
      textAlign: 'center',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: 22, background: 'var(--color-outline-variant)', borderRadius: 4, marginBottom: 6 }} />
      <div style={{ height: 10, background: 'var(--color-outline-variant)', borderRadius: 3, width: '60%', margin: '0 auto' }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default MapDashboard;
