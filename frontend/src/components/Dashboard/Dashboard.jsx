import { useState, useEffect } from 'react';
import axios from 'axios';
import { Leaf, AlertTriangle, ClipboardList, Droplet, Maximize, Brain, Sun, CloudSun, CloudRain, Cloud, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/dashboard");
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  // Fallbacks if data fails
  const soil = data?.soil_metrics || { moisture: 0, ph: 0, nitrogen: "Unknown" };
  const advisories = data?.ai_advisories || [];
  const weather = data?.weather_forecast || [];

  return (
    <main className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-gutter">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
          <div>
            <p className="label-sm text-on-surface-variant mb-xs">Today</p>
            <h2 className="headline-lg-mobile md:headline-lg headline-lg-mobile md:headline-lg text-on-surface">Welcome back, Farmer</h2>
          </div>
          <div className="bg-surface px-md py-sm rounded-lg border border-outline-variant">
            <p className="body-md text-on-surface-variant">
              System is monitoring <span className="font-bold text-primary">live</span> telemetry data.
            </p>
          </div>
        </div>
        
        {/* Top Row: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-md">
              <h3 className="title-md text-on-surface">Field Health Score</h3>
              <Leaf className="text-primary w-6 h-6" />
            </div>
            <div className="flex items-center gap-md">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-r-surface-variant flex items-center justify-center transform rotate-45">
                <span className="title-md text-primary transform -rotate-45">{(soil.moisture + soil.ph * 10).toFixed(0)}%</span>
              </div>
              <div>
                <p className="label-sm text-on-surface-variant">Overall farm vitality</p>
                <p className="font-body-sm text-primary mt-xs">Calculated from AI metrics</p>
              </div>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-md">
              <h3 className="title-md text-on-surface">Active Alerts</h3>
              <AlertTriangle className="text-tertiary w-6 h-6" />
            </div>
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-center bg-surface-container-low px-sm py-xs rounded-lg">
                <span className="label-sm text-on-surface-variant">Critical</span>
                <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-xs font-bold">
                  {advisories.filter(a => a.severity === 'critical').length}
                </span>
              </div>
              <div className="flex justify-between items-center bg-surface-container-low px-sm py-xs rounded-lg">
                <span className="label-sm text-on-surface-variant">Warnings</span>
                <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded text-xs font-bold">
                  {advisories.filter(a => a.severity === 'warning').length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Card 3 */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-md">
              <h3 className="title-md text-on-surface">Next Scheduled Task</h3>
              <ClipboardList className="text-outline w-6 h-6" />
            </div>
            <div className="flex items-start gap-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <p className="title-md text-on-surface">Fertilizer Application</p>
                <p className="label-sm text-on-surface-variant mt-xs">Based on {soil.nitrogen} Nitrogen</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Left 2/3: Field Map Overview */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            <div className="p-md border-b border-outline-variant flex justify-between items-center">
              <h3 className="title-md text-on-surface">Field Map Overview</h3>
              <button className="text-primary hover:text-secondary-fixed-dim transition-colors border-none bg-transparent cursor-pointer">
                <Maximize className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full h-80 bg-surface-container flex-1">
              <div className="w-full h-full bg-cover bg-center absolute inset-0" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBHdcf-_uXeC9AELmwKe1REFA6NHHR-pnu6w3Ak4U2HLNQkAuBtzT7BcMWizHpo-vBCzoMH-0yiyRz-BedDnTBLAxClwGzQ0r94Gp8klmu4m9B8I-gxAVNE1IDQi2Z9zvM1eYYIgo0R1tP6QWFI4xIw_s5B04LqBH7wB2v0HDkhmLPYnelgRHHUgwvlzPvm0lhsBRTMniv8gOZDLCvonYwEAHtNiy7iCSvWELYODZ12NOdIlXeWeKza8g')"}}></div>
              {/* Status Markers */}
              <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-sm mb-1 animate-pulse"></div>
                <span className="bg-surface px-2 py-1 rounded text-xs font-bold text-on-surface shadow">North Field</span>
              </div>
            </div>
          </div>
          
          {/* Right 1/3: Quick Advisory */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
            <div className="p-md border-b border-outline-variant flex gap-sm items-center">
              <Brain className="text-primary w-6 h-6" />
              <h3 className="title-md text-on-surface">Quick Advisory</h3>
            </div>
            <div className="p-md flex-1 flex flex-col gap-md overflow-y-auto max-h-80">
              {advisories.length > 0 ? advisories.map((adv, idx) => (
                <div key={idx} className="bg-surface-container-low rounded-lg p-sm border border-outline-variant">
                  <div className="flex justify-between items-start mb-sm">
                    <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${adv.severity === 'critical' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                      {adv.severity}
                    </span>
                    <span className="label-sm text-on-surface-variant">Live</span>
                  </div>
                  <p className="title-md body-md font-bold text-on-surface mb-xs">{adv.title}</p>
                  <p className="body-md text-on-surface-variant mb-sm">{adv.description}</p>
                </div>
              )) : (
                <p className="text-on-surface-variant">No advisories at this time.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md pb-lg">
          {/* Soil Health Preview */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm">
            <h3 className="title-md text-on-surface mb-md">Soil Health Preview</h3>
            <div className="flex justify-around items-end h-32 mb-sm border-b border-outline-variant pb-2">
              <div className="flex flex-col items-center gap-xs w-full">
                <div className={`w-8 rounded-t-sm ${soil.nitrogen === 'Optimal' ? 'bg-primary' : 'bg-tertiary'}`} style={{height: soil.nitrogen === 'Optimal' ? '80%' : '40%'}}></div>
                <span className="label-sm text-on-surface-variant">N</span>
              </div>
              <div className="flex flex-col items-center gap-xs w-full">
                <div className={`w-8 rounded-t-sm ${soil.phosphorus === 'Optimal' ? 'bg-primary' : 'bg-tertiary'}`} style={{height: soil.phosphorus === 'Optimal' ? '80%' : '40%'}}></div>
                <span className="label-sm text-on-surface-variant">P</span>
              </div>
              <div className="flex flex-col items-center gap-xs w-full">
                <div className={`w-8 rounded-t-sm ${soil.potassium === 'Optimal' ? 'bg-primary' : 'bg-tertiary'}`} style={{height: soil.potassium === 'Optimal' ? '80%' : '40%'}}></div>
                <span className="label-sm text-on-surface-variant">K</span>
              </div>
            </div>
            <p className="body-md text-on-surface-variant text-center">Nitrogen is {soil.nitrogen.toLowerCase()}, Phosphorus is {soil.phosphorus.toLowerCase()}.</p>
          </div>
          
          {/* Weather Forecast */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm">
            <h3 className="title-md text-on-surface mb-md">Weekly Weather Forecast</h3>
            {weather.length > 0 ? (
              <div className="grid grid-cols-5 gap-sm text-center">
                {weather.slice(0, 5).map((w, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-xs p-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                    <span className="label-sm text-on-surface-variant">
                      {new Date(w.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    {w.condition.toLowerCase().includes('cloud') ? <Cloud className="text-outline w-6 h-6" /> :
                     w.condition.toLowerCase().includes('rain') ? <CloudRain className="text-outline w-6 h-6" /> :
                     <Sun className="text-outline w-6 h-6" />}
                    <span className="body-md text-on-surface">{w.temp}&deg;</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant text-center my-4">Add OpenWeather API key to view forecast.</p>
            )}
          </div>
        </div>
        
      </div>
    </main>
  );
};

export default Dashboard;
