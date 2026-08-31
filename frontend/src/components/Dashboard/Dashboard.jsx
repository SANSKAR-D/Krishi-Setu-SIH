import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Brain, Sun, CloudSun, CloudRain, Cloud, Loader2, Sparkles, Thermometer } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async (lat, lon) => {
      try {
        let url = "http://localhost:5000/api/dashboard";
        if (lat && lon) {
          url += `?lat=${lat}&lon=${lon}`;
        }
        const response = await axios.get(url);
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchDashboardData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation blocked or failed. Using default location.", error);
          fetchDashboardData();
        }
      );
    } else {
      fetchDashboardData();
    }
  }, []);

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-on-surface-variant font-medium animate-pulse">Loading Farm Insights...</p>
        </div>
      </main>
    );
  }

  // Fallbacks if data fails
  const advisories = data?.ai_advisories || [];
  const weather = data?.weather_forecast || [];

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-container-lowest min-h-full">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-primary to-secondary p-8 md:p-10 rounded-[2rem] shadow-lg shadow-primary/20 text-white relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-20 -mb-10 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-white/90" />
              <p className="text-sm font-bold uppercase tracking-widest text-white/90">Live Telemetry Active</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Welcome back, Farmer</h2>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed font-medium">
              Your farm is looking great today. We've gathered the latest insights and AI advisories to help you optimize your crop yield.
            </p>
          </div>
          <div className="relative z-10 hidden md:flex items-center gap-4 bg-white/20 px-6 py-4 rounded-2xl shadow-sm border border-white/30 backdrop-blur-md">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.8)]"></div>
            <p className="text-lg text-white font-bold tracking-wide">System Online</p>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
          
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Weather Forecast (Horizontal strip) */}
            <div className="bg-white rounded-[2rem] border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <Sun className="text-blue-600 w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Weather Forecast</h3>
                    <p className="text-sm text-on-surface-variant font-medium mt-1">7-Day outlook for your location</p>
                  </div>
                </div>
              </div>
              <div className="p-8">
                {weather.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                    {weather.slice(0, 7).map((w, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-surface hover:bg-blue-50/50 border border-outline-variant/20 transition-all hover:-translate-y-1 hover:shadow-sm group cursor-pointer">
                        <span className="text-xs font-bold text-on-surface-variant group-hover:text-blue-700 transition-colors mb-3 uppercase tracking-wider">
                          {new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                          {w.condition.toLowerCase().includes('cloud') ? <Cloud className="text-slate-400 w-6 h-6" /> :
                           w.condition.toLowerCase().includes('rain') ? <CloudRain className="text-blue-400 w-6 h-6" /> :
                           <Sun className="text-orange-400 w-6 h-6" />}
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-on-surface-variant/50" />
                          <span className="text-lg font-black text-on-surface">{w.temp}&deg;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-surface/50 rounded-2xl border border-dashed border-outline-variant/50">
                    <CloudSun className="w-12 h-12 text-on-surface-variant/30 mb-4" />
                    <p className="text-on-surface-variant font-medium">Weather Data Unavailable</p>
                    <p className="text-sm text-on-surface-variant/70 mt-1 max-w-[200px]">Configure your OpenWeather API key to view the forecast.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Advisories */}
            <div className="bg-white rounded-[2rem] border border-outline-variant/30 shadow-sm flex flex-col transition-all hover:shadow-md">
              <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Brain className="text-primary w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Smart Advisories</h3>
                    <p className="text-sm text-on-surface-variant font-medium mt-1">AI-powered recommendations for your fields</p>
                  </div>
                </div>
              </div>
              <div className="p-8 flex flex-col gap-5">
                {advisories.length > 0 ? advisories.map((adv, idx) => (
                  <div key={idx} className="group relative bg-surface hover:bg-primary/5 rounded-2xl p-6 border border-outline-variant/20 transition-all duration-300 hover:border-primary/30 hover:shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${adv.severity === 'critical' ? 'bg-error text-white' : 'bg-orange-100 text-orange-700'}`}>
                        {adv.severity === 'critical' ? <AlertTriangle className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${adv.severity === 'critical' ? 'text-error bg-error/10' : 'text-orange-700 bg-orange-100'}`}>
                          {adv.severity}
                        </span>
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div> Live Insight
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{adv.title}</h4>
                      <p className="text-on-surface-variant text-base leading-relaxed">{adv.description}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-5">
                      <Sparkles className="w-10 h-10 text-on-surface-variant/50" />
                    </div>
                    <p className="text-xl font-bold text-on-surface-variant mb-2">All Clear!</p>
                    <p className="text-base text-on-surface-variant/80">No pending advisories at this time.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (1/3 width) */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            
            {/* Active Alerts */}
            <div className="bg-white rounded-[2rem] border border-outline-variant/30 shadow-sm flex flex-col transition-all hover:shadow-md h-full">
              <div className="rounded-t-[2rem] px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-error/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-error/10 rounded-2xl">
                    <AlertTriangle className="text-error w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">Active Alerts</h3>
                </div>
              </div>
              <div className="p-8 flex flex-col gap-6 flex-1">
                <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                      <span className="text-lg font-bold text-on-surface">Critical Issues</span>
                    </div>
                    <span className="bg-error text-white px-4 py-1.5 rounded-xl text-base font-black shadow-sm">
                      {advisories.filter(a => a.severity === 'critical').length}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant/80 font-medium">Requires immediate attention</p>
                </div>
                
                <div className="bg-surface rounded-2xl p-6 border border-outline-variant/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]"></div>
                      <span className="text-lg font-bold text-on-surface">Warnings</span>
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-4 py-1.5 rounded-xl text-base font-black shadow-sm">
                      {advisories.filter(a => a.severity === 'warning').length}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant/80 font-medium">Monitor closely</p>
                </div>
              </div>
            </div>

          </div>

        </div>
        
      </div>
    </main>
  );
};

export default Dashboard;
