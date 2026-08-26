import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, 
  ChevronDown, 
  FlaskConical, 
  CheckCircle2, 
  Droplets, 
  Waves, 
  AlertTriangle, 
  Thermometer, 
  TrendingUp, 
  MoreVertical,
  Loader2
} from 'lucide-react';

const SoilHealth = () => {
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
      <main className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </main>
    );
  }

  const soil = data?.soil_metrics || { moisture: 0, ph: 0, temperature: 0, nitrogen: "Unknown", phosphorus: "Unknown", potassium: "Unknown" };
  const advisories = data?.ai_advisories || [];

  return (
    <main className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter bg-background">
      <div className="max-w-[1280px] mx-auto space-y-md">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div>
            <h1 className="headline-lg-mobile md:headline-lg headline-lg-mobile md:headline-lg text-on-surface">Live Soil Telemetry</h1>
            <p className="body-md text-on-surface-variant">North Field, Section 4 (Simulated IoT)</p>
          </div>
          <div className="flex items-center gap-xs bg-surface-container-low px-sm py-xs rounded-lg border border-outline-variant cursor-pointer">
            <span className="label-sm text-on-surface text-primary animate-pulse">● Live Data</span>
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm md:gap-md">
          
          {/* NPK */}
          <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md border border-surface-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-sm">
              <h3 className="label-sm text-on-surface-variant">NPK Levels</h3>
              <FlaskConical className="text-primary w-5 h-5" />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="headline-lg-mobile text-on-surface">{soil.nitrogen === "Optimal" ? "Good" : "Low N"}</span>
            </div>
            <div className={`flex items-center gap-xs ${soil.nitrogen === "Optimal" ? "text-primary" : "text-tertiary-container"}`}>
              {soil.nitrogen === "Optimal" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="label-sm">{soil.nitrogen === "Optimal" ? "Balanced" : "Needs Attention"}</span>
            </div>
          </div>
          
          {/* pH Level */}
          <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md border border-surface-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-sm">
              <h3 className="label-sm text-on-surface-variant">pH Level</h3>
              <Droplets className="text-secondary w-5 h-5" />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="headline-lg-mobile text-on-surface">{soil.ph}</span>
            </div>
            <div className="flex items-center gap-xs text-primary">
              <CheckCircle2 className="w-4 h-4" />
              <span className="label-sm">{soil.ph >= 6 && soil.ph <= 7.5 ? "Optimal" : "Check Level"}</span>
            </div>
          </div>
          
          {/* Soil Moisture */}
          <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md border border-surface-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-sm">
              <h3 className="label-sm text-on-surface-variant">Soil Moisture</h3>
              <Waves className="text-tertiary w-5 h-5" />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="headline-lg-mobile text-on-surface">{soil.moisture}%</span>
            </div>
            <div className="flex items-center gap-xs text-tertiary-container">
              {soil.moisture < 50 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span className="label-sm">{soil.moisture < 50 ? "Slightly Low" : "Optimal"}</span>
            </div>
          </div>
          
          {/* Temperature */}
          <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md border border-surface-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-sm">
              <h3 className="label-sm text-on-surface-variant">Temperature</h3>
              <Thermometer className="text-secondary w-5 h-5" />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="headline-lg-mobile text-on-surface">{soil.temperature}°C</span>
            </div>
            <div className="flex items-center gap-xs text-primary">
              <TrendingUp className="w-4 h-4" />
              <span className="label-sm">Steady</span>
            </div>
          </div>
          
        </div>
        
        {/* Main Content Area: Chart & Secondary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          
          {/* Chart Area (Spans 2 columns on lg) */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm flex flex-col h-96">
            <div className="p-md border-b border-surface-variant flex justify-between items-center">
              <h3 className="title-md text-on-surface">Moisture Trends (Live)</h3>
              <button className="text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-md relative overflow-hidden flex items-end justify-between gap-xs">
              <div className="w-full bg-surface-container-low h-full rounded-lg relative overflow-hidden flex items-end px-md pb-md gap-4">
                <div className="w-[14%] bg-primary opacity-60 rounded-t-sm h-[40%]"></div>
                <div className="w-[14%] bg-primary opacity-70 rounded-t-sm h-[55%]"></div>
                <div className="w-[14%] bg-primary opacity-80 rounded-t-sm h-[45%]"></div>
                <div className="w-[14%] bg-primary opacity-90 rounded-t-sm h-[65%]"></div>
                <div className="w-[14%] bg-primary opacity-100 rounded-t-sm h-[75%]"></div>
                <div className="w-[14%] bg-tertiary-container opacity-80 rounded-t-sm" style={{height: `${soil.moisture - 5}%`}}></div>
                <div className="w-[14%] bg-tertiary-container opacity-90 rounded-t-sm animate-pulse" style={{height: `${soil.moisture}%`}}></div>
              </div>
            </div>
          </div>
          
          {/* Secondary Cards Column */}
          <div className="flex flex-col gap-md">
            
            {/* Nutrient Analysis */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-md">
              <h3 className="title-md text-on-surface mb-sm">Nutrient Analysis</h3>
              <div className="space-y-sm">
                <div>
                  <div className="flex justify-between label-sm mb-xs">
                    <span className="text-on-surface-variant">Nitrogen (N)</span>
                    <span className="text-on-surface">{soil.nitrogen}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className={`h-full ${soil.nitrogen === 'Optimal' ? 'bg-primary w-[75%]' : 'bg-tertiary-container w-[40%]'} rounded-full`}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between label-sm mb-xs">
                    <span className="text-on-surface-variant">Phosphorus (P)</span>
                    <span className="text-on-surface">{soil.phosphorus}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className={`h-full ${soil.phosphorus === 'Optimal' ? 'bg-primary w-[75%]' : 'bg-tertiary-container w-[40%]'} rounded-full`}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between label-sm mb-xs">
                    <span className="text-on-surface-variant">Potassium (K)</span>
                    <span className="text-on-surface">{soil.potassium}</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className={`h-full ${soil.potassium === 'Optimal' ? 'bg-primary w-[85%]' : 'bg-tertiary-container w-[40%]'} rounded-full`}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-md flex-1 overflow-y-auto">
              <h3 className="title-md text-on-surface mb-sm">AI Recommendations</h3>
              <ul className="space-y-sm p-0 m-0 list-none">
                {advisories.length > 0 ? advisories.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-sm p-sm bg-surface-container-low rounded-lg">
                    {adv.severity === 'critical' ? (
                      <AlertTriangle className="text-error-container mt-xs w-5 h-5 shrink-0" />
                    ) : adv.severity === 'warning' ? (
                      <AlertTriangle className="text-tertiary-container mt-xs w-5 h-5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="text-primary mt-xs w-5 h-5 shrink-0" />
                    )}
                    <div>
                      <p className="label-sm text-on-surface font-semibold m-0">{adv.title}</p>
                      <p className="body-md text-on-surface-variant text-sm mt-1 mb-0">{adv.description}</p>
                    </div>
                  </li>
                )) : (
                  <p className="text-sm text-on-surface-variant">No advisories at this time.</p>
                )}
              </ul>
            </div>
            
          </div>
        </div>
        
      </div>
    </main>
  );
};

export default SoilHealth;
