import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Brain, Sun, CloudSun, CloudRain, Cloud, Loader2, Sparkles,
  Thermometer, MapPin, Search, Navigation2, Droplets, FlaskConical,
  Sprout, TrendingUp, Calendar, ChevronRight, Layers, Wind, CloudSnow, CloudLightning
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const GIS_API_URL = import.meta.env.VITE_GIS_URL || 'http://localhost:8001';

// Weather icon helper — returns a JSX icon based on condition string
const WeatherIcon = ({ condition = '', size = 6 }) => {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain')) return <CloudRain className={`w-${size} h-${size} text-blue-400`} />;
  if (c.includes('cloud')) return <Cloud className={`w-${size} h-${size} text-slate-400`} />;
  if (c.includes('snow')) return <CloudSnow className={`w-${size} h-${size} text-sky-300`} />;
  if (c.includes('storm')) return <CloudLightning className={`w-${size} h-${size} text-yellow-500`} />;
  return <Sun className={`w-${size} h-${size} text-amber-400`} />;
};

// Severity config for advisories
const severityConfig = {
  critical: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700', icon: <AlertTriangle className="w-4 h-4" />, border: 'border-l-red-500' },
  warning: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', icon: <AlertTriangle className="w-4 h-4" />, border: 'border-l-amber-500' },
  info: { dot: 'bg-primary', badge: 'bg-primary/10 text-primary', icon: <Brain className="w-4 h-4" />, border: 'border-l-primary' },
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [soilData, setSoilData] = useState({});
  const [advisories, setAdvisories] = useState([]);
  const [weather, setWeather] = useState([]);

  const [soilLoading, setSoilLoading] = useState(true);
  const [advisoriesLoading, setAdvisoriesLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  const [farmsCount, setFarmsCount] = useState(0);
  const [locationLabel, setLocationLabel] = useState('Detecting...');

  // Location form state
  const [farmsList, setFarmsList] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('live');
  const [activeCoords, setActiveCoords] = useState({ lat: null, lon: null });

  const fetchWeather = async (lat, lon) => {
    setWeatherLoading(true);
    try {
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&current=temperature_2m,weathercode,soil_moisture_0_to_7cm&forecast_days=7&timezone=auto`;
      const res = await axios.get(meteoUrl);
      const daily = res.data.daily;
      const getWeatherString = (code) => {
        if (code === null || code === undefined) return "Clear";
        if (code <= 3) return "Sunny";
        if (code <= 48) return "Cloudy";
        if (code <= 67) return "Rainy";
        if (code <= 77) return "Snow";
        if (code <= 99) return "Stormy";
        return "Clear";
      };
      
      if (daily && daily.time) {
        const wData = daily.time.slice(0, 7).map((date, index) => ({
          date: date,
          temp_max: Math.round(daily.temperature_2m_max[index]),
          temp_min: Math.round(daily.temperature_2m_min[index]),
          temp: Math.round((daily.temperature_2m_max[index] + daily.temperature_2m_min[index]) / 2),
          condition: getWeatherString(daily.weathercode[index])
        }));
        setWeather(wData);
      }
    } catch (err) {
      console.error("Frontend weather fetch error:", err);
      setWeather([]);
    } finally {
      setWeatherLoading(false);
    }
  };

  const fetchSoilData = async (lat, lon) => {
    setSoilLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/soil?lat=${lat}&lon=${lon}`);
      setSoilData(response.data.data.soil_metrics || {});
    } catch (err) {
      console.error('Error fetching soil data:', err);
    } finally {
      setSoilLoading(false);
    }
  };

  const fetchAdvisories = async (lat, lon) => {
    setAdvisoriesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/advisories?lat=${lat}&lon=${lon}`);
      setAdvisories(response.data.data.ai_advisories || []);
    } catch (err) {
      console.error('Error fetching advisories:', err);
    } finally {
      setAdvisoriesLoading(false);
    }
  };

  const fetchLocationData = (lat, lon, label) => {
    const targetLat = lat ?? 28.6139;
    const targetLon = lon ?? 77.209;
    
    if (label) setLocationLabel(label);
    setActiveCoords({ lat: targetLat, lon: targetLon });

    fetchWeather(targetLat, targetLon);
    fetchSoilData(targetLat, targetLon);
    fetchAdvisories(targetLat, targetLon);
  };

  const fetchFarms = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${GIS_API_URL}/api/farms?user_id=${user.id || user._id}`);
      if (res.data?.status === 'success' && res.data.data) {
        setFarmsList(res.data.data);
        setFarmsCount(res.data.data.length);
      }
    } catch (err) {
      console.error('Error fetching farms count:', err);
    }
  };

  const handleLiveLocation = () => {
    setSelectedLocationId('live');
    if (!('geolocation' in navigator)) { fetchLocationData(null, null, 'Default Location'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude, lon = coords.longitude;
        fetchLocationData(lat, lon, `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`);
      },
      () => fetchLocationData(null, null, 'Default Location')
    );
  };

  const handleLocationSelect = (e) => {
    const val = e.target.value;
    setSelectedLocationId(val);

    if (val === 'live') {
      handleLiveLocation();
    } else {
      const farm = farmsList.find(f => String(f.id) === val);
      if (farm && farm.geojson && farm.geojson.geometry && farm.geojson.geometry.coordinates) {
        try {
          // Geometry is typically a Polygon: [[[lon, lat], [lon, lat], ...]]
          const coords = farm.geojson.geometry.coordinates[0][0];
          const lon = coords[0];
          const lat = coords[1];
          fetchLocationData(lat, lon, farm.name);
        } catch (err) {
          console.warn("Could not parse farm coordinates", err);
        }
      }
    }
  };

  useEffect(() => {
    handleLiveLocation();
    fetchFarms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const userName = user?.email
    ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Farmer';

  const soil = soilData || {};

  const criticalCount = advisories.filter(a => a.severity === 'critical').length;
  const warningCount = advisories.filter(a => a.severity === 'warning').length;
  const infoCount = advisories.filter(a => a.severity === 'info' || !a.severity).length;

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-lowest min-h-full">
      <div className="max-w-[1400px] mx-auto p-4 md:p-6 flex flex-col gap-5">

        {/* ── MEDIUM HERO HEADER ────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a6b3c] to-[#0f4f8a] p-5 md:p-6 text-white shadow-md">
          {/* Abstract background blobs (smaller) */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-20 w-32 h-32 rounded-full bg-black/10 blur-xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Live Telemetry Active</p>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1 truncate">
                Welcome back, {userName} 👋
              </h1>
              <p className="text-white/80 text-xs md:text-sm font-medium">
                Your personalized farm intelligence dashboard.
              </p>
            </div>

            {/* Stat chips (compact) */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-2 rounded-xl">
                <MapPin className="w-4 h-4 text-white/90" />
                <div>
                  <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold">Location</p>
                  <p className="text-xs font-bold">{locationLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-2 rounded-xl">
                <Layers className="w-4 h-4 text-white/90" />
                <div>
                  <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold">Total Farms</p>
                  <p className="text-xs font-bold">{farmsCount} Saved</p>
                </div>
              </div>
              {criticalCount > 0 && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 backdrop-blur-sm px-3 py-2 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-300" />
                  <div>
                    <p className="text-[9px] text-white/60 uppercase tracking-wider font-bold">Critical</p>
                    <p className="text-xs font-bold text-red-200">{criticalCount} Issue{criticalCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── LOCATION CONTROLS ─────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">Change Location</p>
                <p className="text-xs text-on-surface-variant">Enter village coordinates or use GPS</p>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-3">
              <select
                value={selectedLocationId}
                onChange={handleLocationSelect}
                disabled={soilLoading || advisoriesLoading}
                className="flex-1 min-w-[200px] bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer disabled:opacity-60"
              >
                <option value="live">📍 Live Location (GPS)</option>
                {farmsList.map(farm => (
                  <option key={farm.id} value={farm.id}>
                    🚜 {farm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── SOIL HEALTH METRICS ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {soilLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-highest shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-3 w-16 bg-surface-container-highest rounded mb-2" />
                  <div className="h-6 w-12 bg-surface-container-highest rounded mb-1" />
                  <div className="h-2 w-20 bg-surface-container-highest rounded" />
                </div>
              </div>
            ))
          ) : (
            [
              { label: 'Soil Moisture', value: soil.moisture != null ? `${soil.moisture}%` : '--', icon: <Droplets className="w-6 h-6" />, color: 'text-blue-500 bg-blue-50', hint: 'Topsoil (0–7cm)' },
              { label: 'pH Level', value: soil.ph != null ? soil.ph : '--', icon: <FlaskConical className="w-6 h-6" />, color: 'text-purple-500 bg-purple-50', hint: 'Ideal: 6.0–7.5' },
              { label: 'Nitrogen', value: soil.nitrogen ?? '--', icon: <Sprout className="w-6 h-6" />, color: 'text-green-600 bg-green-50', hint: 'Topsoil level' },
              { label: 'Air Temp', value: soil.temperature != null ? `${soil.temperature}°C` : '--', icon: <Thermometer className="w-6 h-6" />, color: 'text-orange-500 bg-orange-50', hint: soil.weather_condition ?? 'Current' },
            ].map(({ label, value, icon, color, hint }) => (
              <div key={label} className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
                <div className={`p-3 rounded-2xl shrink-0 ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
                <div className="min-w-0">
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider truncate">{label}</p>
                  <p className="text-2xl font-black text-on-surface capitalize leading-tight">{value}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5 truncate">{hint}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── MAIN CONTENT GRID ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Left: Weather + Advisories */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* 7-Day Weather Forecast */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center gap-3 bg-gradient-to-r from-blue-50/60 to-transparent">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Sun className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">7-Day Weather Forecast</h2>
                  <p className="text-xs text-on-surface-variant">Daily avg temperature &amp; conditions</p>
                </div>
                {weatherLoading && <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />}
              </div>

              <div className="p-5">
                {weatherLoading ? (
                  <div className="grid grid-cols-7 gap-2 animate-pulse">
                    {Array(7).fill(0).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-2 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 h-[100px]">
                        <div className="w-6 h-2 bg-surface-container-highest rounded" />
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest mt-1" />
                        <div className="w-5 h-4 bg-surface-container-highest rounded mt-1" />
                        <div className="w-4 h-2 bg-surface-container-highest rounded mt-0.5" />
                      </div>
                    ))}
                  </div>
                ) : weather.length > 0 ? (
                  <div className="grid grid-cols-7 gap-2">
                    {weather.slice(0, 7).map((w, idx) => {
                      const isToday = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all cursor-default ${isToday ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface-container-lowest hover:bg-blue-50 border border-outline-variant/20 hover:-translate-y-0.5 hover:shadow-sm'}`}
                        >
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isToday ? 'text-white/80' : 'text-on-surface-variant'}`}>
                            {isToday ? 'Today' : new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <div className={`w-9 h-9 flex items-center justify-center rounded-full ${isToday ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            <WeatherIcon condition={w.condition} size={5} />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-black ${isToday ? 'text-white' : 'text-on-surface'}`}>{w.temp_max ?? w.temp}°</span>
                            <span className={`text-[10px] font-semibold ${isToday ? 'text-white/60' : 'text-on-surface-variant/60'}`}>{w.temp_min ?? '—'}°</span>
                          </div>
                          <span className={`text-[9px] font-bold text-center leading-tight ${isToday ? 'text-white/70' : 'text-on-surface-variant/70'}`}>{w.condition}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant/40">
                    <CloudSun className="w-12 h-12 text-on-surface-variant/20 mb-3" />
                    <p className="font-semibold text-on-surface-variant">Weather data unavailable</p>
                    <p className="text-sm text-on-surface-variant/60 mt-1">Try refreshing or check your connection</p>
                    <button
                      onClick={handleLiveLocation}
                      className="mt-4 bg-primary/10 text-primary font-bold px-5 py-2 rounded-xl hover:bg-primary hover:text-white transition-all text-sm"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Smart AI Advisories */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col">
              <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center gap-3 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-on-surface">Smart AI Advisories</h2>
                  <p className="text-xs text-on-surface-variant">Powered by Gemini · location-aware</p>
                </div>
                {advisoriesLoading && <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />}
              </div>
              <div className="p-5 flex flex-col gap-3">
                {advisoriesLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 animate-pulse">
                      <div className="w-8 h-8 rounded-xl bg-surface-container-highest shrink-0" />
                      <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
                        <div className="w-16 h-3 bg-surface-container-highest rounded" />
                        <div className="w-3/4 h-4 bg-surface-container-highest rounded" />
                        <div className="w-full h-3 bg-surface-container-highest rounded" />
                      </div>
                    </div>
                  ))
                ) : advisories.length > 0 ? advisories.map((adv, idx) => {
                  const cfg = severityConfig[adv.severity] || severityConfig.info;
                  return (
                    <div key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border-l-4 bg-surface-container-lowest border border-outline-variant/20 hover:shadow-sm transition-all ${cfg.border}`}>
                      <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.badge}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.badge}`}>{adv.severity || 'info'}</span>
                        </div>
                        <h4 className="text-sm font-bold text-on-surface mb-0.5">{adv.title}</h4>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{adv.description}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-bold text-on-surface">All Clear!</p>
                    <p className="text-sm text-on-surface-variant/70 mt-1">No active advisories at this time.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-1 flex flex-col gap-5">

            {/* Alert Summary */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center gap-3 bg-red-50/50">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-base font-bold text-on-surface">Alert Summary</h2>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {[
                  { label: 'Critical', count: criticalCount, dotClass: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700', pulse: true },
                  { label: 'Warnings', count: warningCount, dotClass: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700', pulse: false },
                  { label: 'Info / Tips', count: infoCount, dotClass: 'bg-primary', badgeClass: 'bg-primary/10 text-primary', pulse: false },
                ].map(({ label, count, dotClass, badgeClass, pulse }) => (
                  <div key={label} className="flex items-center justify-between py-3 px-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${dotClass} ${pulse ? 'animate-pulse' : ''}`} />
                      <span className="text-sm font-semibold text-on-surface">{label}</span>
                    </div>
                    <span className={`text-sm font-black px-3 py-1 rounded-lg ${badgeClass}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-outline-variant/15">
                <h2 className="text-base font-bold text-on-surface">Quick Navigate</h2>
                <p className="text-xs text-on-surface-variant">Jump to a module</p>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {[
                  { to: '/gis', label: 'GIS Farm Map', sub: 'Draw & view your farms', icon: <Layers className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
                  { to: '/market-data', label: 'Market Prices', sub: 'Check daily crop rates', icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
                  { to: '/crop-calendar', label: 'Crop Calendar', sub: 'Plan your sowing schedule', icon: <Calendar className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
                  { to: '/expert-chat', label: 'Krishi AI Chat', sub: 'Ask farming questions', icon: <Brain className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50' },
                ].map(({ to, label, sub, icon, color }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-lowest border border-transparent hover:border-outline-variant/20 transition-all group">
                    <div className={`p-2 rounded-xl shrink-0 ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">{label}</p>
                      <p className="text-xs text-on-surface-variant truncate">{sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default Dashboard;
