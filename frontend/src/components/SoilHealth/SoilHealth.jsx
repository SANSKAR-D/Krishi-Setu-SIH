
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
  MoreVertical 
} from 'lucide-react';

const SoilHealth = () => {
  return (
    <main className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter bg-background">
      <div className="max-w-[1280px] mx-auto space-y-md">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div>
            <h1 className="headline-lg-mobile md:headline-lg headline-lg-mobile md:headline-lg text-on-surface">Soil Health Overview</h1>
            <p className="body-md text-on-surface-variant">North Field, Section 4</p>
          </div>
          <div className="flex items-center gap-xs bg-surface-container-low px-sm py-xs rounded-lg border border-outline-variant cursor-pointer">
            <Calendar className="text-on-surface-variant w-5 h-5" />
            <span className="label-sm text-on-surface">Last 7 Days</span>
            <ChevronDown className="text-on-surface-variant w-4 h-4" />
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
              <span className="headline-lg-mobile text-on-surface">Good</span>
            </div>
            <div className="flex items-center gap-xs text-primary">
              <CheckCircle2 className="w-4 h-4" />
              <span className="label-sm">Balanced</span>
            </div>
          </div>
          
          {/* pH Level */}
          <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md border border-surface-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-sm">
              <h3 className="label-sm text-on-surface-variant">pH Level</h3>
              <Droplets className="text-secondary w-5 h-5" />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="headline-lg-mobile text-on-surface">6.5</span>
            </div>
            <div className="flex items-center gap-xs text-primary">
              <CheckCircle2 className="w-4 h-4" />
              <span className="label-sm">Optimal</span>
            </div>
          </div>
          
          {/* Soil Moisture */}
          <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md border border-surface-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-sm">
              <h3 className="label-sm text-on-surface-variant">Soil Moisture</h3>
              <Waves className="text-tertiary w-5 h-5" />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="headline-lg-mobile text-on-surface">42%</span>
            </div>
            <div className="flex items-center gap-xs text-tertiary-container">
              <AlertTriangle className="w-4 h-4" />
              <span className="label-sm">Slightly Low</span>
            </div>
          </div>
          
          {/* Temperature */}
          <div className="bg-surface-container-lowest rounded-xl p-sm md:p-md border border-surface-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-sm">
              <h3 className="label-sm text-on-surface-variant">Temperature</h3>
              <Thermometer className="text-secondary w-5 h-5" />
            </div>
            <div className="flex items-end gap-xs mb-xs">
              <span className="headline-lg-mobile text-on-surface">22°C</span>
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
              <h3 className="title-md text-on-surface">Moisture Trends</h3>
              <button className="text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-md relative overflow-hidden flex items-end justify-between gap-xs">
              {/* Abstract Chart Representation */}
              <div className="w-full bg-surface-container-low h-full rounded-lg relative overflow-hidden flex items-end px-md pb-md gap-4">
                {/* Bars representing data */}
                <div className="w-[14%] bg-primary opacity-60 rounded-t-sm h-[40%]"></div>
                <div className="w-[14%] bg-primary opacity-70 rounded-t-sm h-[55%]"></div>
                <div className="w-[14%] bg-primary opacity-80 rounded-t-sm h-[45%]"></div>
                <div className="w-[14%] bg-primary opacity-90 rounded-t-sm h-[65%]"></div>
                <div className="w-[14%] bg-primary opacity-100 rounded-t-sm h-[75%]"></div>
                <div className="w-[14%] bg-tertiary-container opacity-80 rounded-t-sm h-[35%]"></div>
                <div className="w-[14%] bg-tertiary-container opacity-90 rounded-t-sm h-[42%]"></div>
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
                    <span className="text-on-surface">Low</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-container w-[40%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between label-sm mb-xs">
                    <span className="text-on-surface-variant">Phosphorus (P)</span>
                    <span className="text-on-surface">Optimal</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[75%] rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between label-sm mb-xs">
                    <span className="text-on-surface-variant">Potassium (K)</span>
                    <span className="text-on-surface">Optimal</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%] rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-md flex-1">
              <h3 className="title-md text-on-surface mb-sm">AI Recommendations</h3>
              <ul className="space-y-sm p-0 m-0 list-none">
                <li className="flex items-start gap-sm p-sm bg-surface-container-low rounded-lg">
                  <AlertTriangle className="text-tertiary-container mt-xs w-5 h-5 shrink-0" />
                  <div>
                    <p className="label-sm text-on-surface font-semibold m-0">Apply Nitrogen</p>
                    <p className="body-md text-on-surface-variant text-sm mt-1 mb-0">Levels are dropping. Recommend 50kg/ha N-rich fertilizer.</p>
                  </div>
                </li>
                <li className="flex items-start gap-sm p-sm bg-surface-container-low rounded-lg">
                  <Droplets className="text-primary mt-xs w-5 h-5 shrink-0" />
                  <div>
                    <p className="label-sm text-on-surface font-semibold m-0">Irrigation Needed</p>
                    <p className="body-md text-on-surface-variant text-sm mt-1 mb-0">Next irrigation scheduled in 2 days to maintain moisture.</p>
                  </div>
                </li>
              </ul>
            </div>
            
          </div>
        </div>
        
      </div>
    </main>
  );
};

export default SoilHealth;
