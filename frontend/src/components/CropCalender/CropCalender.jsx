import React, { useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Droplet,
  Tractor,
  AlertTriangle,
  X,
  Bug,
  Beaker,
  MapPin,
  FilePlus,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// Each event type gets a static accent color (hex) for inline styles
const EVENT_META = {
  sowing:     { label: "Sowing",      color: "#006948", bg: "#e8f5f0", icon: Leaf },
  irrigation: { label: "Irrigation",  color: "#006c49", bg: "#e6f4ee", icon: Droplet },
  harvest:    { label: "Harvest",     color: "#904821", bg: "#fce9dd", icon: Tractor },
  fertilizer: { label: "Fertilizer",  color: "#1a5fa8", bg: "#deeaf8", icon: Beaker },
  pesticide:  { label: "Pesticide",   color: "#7b2d8b", bg: "#f3e4f8", icon: Bug },
  disease:    { label: "Disease",     color: "#b84c00", bg: "#fceadc", icon: AlertTriangle },
  others:     { label: "Others",      color: "#4a5568", bg: "#e2e8f0", icon: Plus },
};

const getEventMeta = (eventType = "") =>
  EVENT_META[eventType.toLowerCase()] ?? EVENT_META.others;

const emptyForm = {
  title: "", eventType: "", date: "", 
  fertilizerName: "", pesticideName: "", diseaseName: "", dosage: "", cost: "", notes: "", actualYield: ""
};

// ─── Helpers ──────────────────────────────────────────────────

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth()    === d2.getMonth()    &&
  d1.getDate()     === d2.getDate();

const startOfDay = (d) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

// ─── Sub-components ───────────────────────────────────────────

const SummaryCard = ({ icon: Icon, label, value, accentColor }) => (
  <div
    className="rounded-2xl p-4 border flex flex-col gap-3"
    style={{ background: "#f3f4f5", borderColor: "#bccac0", flexShrink: 0 }}
  >
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{ background: accentColor + "20" }}
    >
      <Icon className="w-5 h-5" style={{ color: accentColor }} />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#3d4a42" }}>
        {label}
      </p>
      <p className="mt-0.5 text-xl font-extrabold truncate" style={{ color: accentColor }} title={String(value)}>
        {value}
      </p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────

const CropCalendar = () => {

  // Global Context State
  const farmerId = "F123";
  const [cropPlans, setCropPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  
  // Selected Profile
  const [selectedFarm, setSelectedFarm] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // Calendar State
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [events,        setEvents]        = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError,    setFetchError]    = useState("");

  // Drawer
  const [drawerDate, setDrawerDate] = useState(null);
  const [formData,   setFormData]   = useState(emptyForm);
  const [formError,  setFormError]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Wizard specifics
  const [farms, setFarms] = useState([]);
  const [wizardFarm, setWizardFarm] = useState("");
  const [wizardCrop, setWizardCrop] = useState("");
  const [wizardSeason, setWizardSeason] = useState("");
  const [wizardYear, setWizardYear] = useState(new Date().getFullYear().toString());
  const [wizardArea, setWizardArea] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);

  const today = startOfDay(new Date());

  // ── Fetch Data ──────────────────────────────────────────────
  useEffect(() => {
    // 1. Fetch Crop Plans
    const initData = async () => {
      setLoadingPlans(true);
      try {
        const res = await fetch(`http://localhost:5000/api/crop-plans?farmerId=${farmerId}`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setCropPlans(data.data);
          setSelectedFarm(data.data[0].farmName);
          setSelectedPlanId(data.data[0]._id);
          setShowWizard(false);
        } else {
          setShowWizard(true);
        }
      } catch (err) {
        console.error("Failed to load crop plans", err);
        setShowWizard(true); // default to wizard on failure to prompt action
      } finally {
        setLoadingPlans(false);
      }

      // 2. Fetch GIS Farms for Wizard dropdown
      try {
        const gisUrl = import.meta.env.VITE_GIS_URL || "http://localhost:8001";
        const res = await fetch(`${gisUrl}/api/farms`);
        const data = await res.json();
        if (data.status === "success") setFarms(data.data || []);
      } catch (e) {
        console.warn("Could not fetch GIS farms:", e.message);
      }
    };
    initData();
  }, []);

  // Fetch events whenever we are NOT in the wizard (meaning we have an active context)
  useEffect(() => {
    if (!showWizard && selectedFarm && selectedPlanId) {
      fetchEvents();
    }
  }, [showWizard, selectedFarm, selectedPlanId]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    setFetchError("");
    try {
      // Fetch ALL events for this farmer to populate the upcoming list correctly
      const res  = await fetch(`http://localhost:5000/api/crop-plans/events?farmerId=${farmerId}`);
      const data = await res.json();
      if (data.success) setEvents(data.data || []);
      else setFetchError(data.message || data.error || "Could not fetch events");
    } catch {
      setFetchError("Could not connect to server");
    } finally {
      setLoadingEvents(false);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleFarmChange = (newFarm) => {
    setSelectedFarm(newFarm);
    // Find the first crop plan associated with this farm and select it automatically
    const plan = cropPlans.find(p => p.farmName === newFarm);
    if (plan) {
      setSelectedPlanId(plan._id);
    }
  };

  const handleCreatePlan = async () => {
    if (!wizardFarm || !wizardCrop || !wizardSeason || !wizardYear) return;
    setCreatingPlan(true);
    try {
      const selectedFarmObj = farms.find(f => f.name === wizardFarm);
      const payload = { 
        farmerId,
        farmName: wizardFarm, 
        cropName: wizardCrop,
        season: wizardSeason,
        year: parseInt(wizardYear, 10),
        area: parseFloat(wizardArea) || 0,
        latitude: selectedFarmObj?.latitude || selectedFarmObj?.lat || 28.6139,
        longitude: selectedFarmObj?.longitude || selectedFarmObj?.lng || 77.2090
      };
      
      const res = await fetch("http://localhost:5000/api/crop-plans", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCropPlans(prev => [data.data, ...prev]);
        setSelectedFarm(wizardFarm);
        setSelectedPlanId(data.data._id);
        setShowWizard(false);
      } else {
        alert(data.message || data.error || "Failed to create plan");
      }
    } catch (e) {
      alert("Failed to create crop plan");
    } finally {
      setCreatingPlan(false);
    }
  };

  const fc = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const openDrawer = (cellDate) => {
    const offset    = cellDate.getTimezoneOffset();
    const localDate = new Date(cellDate.getTime() - offset * 60000);
    setDrawerDate(cellDate);
    setFormData({
      ...emptyForm,
      date: localDate.toISOString().split("T")[0],
    });
    setFormError("");
  };

  const closeDrawer = () => { setDrawerDate(null); setFormError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.eventType) {
      setFormError("Title and Event Type are required");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const currentPlan = cropPlans.find(p => p._id === selectedPlanId);
      if (!currentPlan) throw new Error("No active crop plan selected");

      const payload = { ...formData, cropPlanId: currentPlan._id };

      const res  = await fetch("http://localhost:5000/api/crop-plans/events", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.success) { 
        // fetch events again to get the fully populated cropPlanId object
        fetchEvents(); 
        closeDrawer(); 
      }
      else setFormError(data.message || data.error || "Failed to save event");
    } catch (err) {
      setFormError(err.message || "Could not connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Dynamic form fields ───────────────────────────────────────
  const DynamicFields = () => {
    const inputCls = "w-full px-3 py-2.5 rounded-lg text-sm font-medium outline-none transition-colors";
    const inputStyle = { background: "#ffffff", border: "1.5px solid #bccac0", color: "#191c1d" };
    const labelCls = "block text-xs font-bold uppercase tracking-wide mb-1.5";

    switch (formData.eventType) {
      case "Fertilizer":
        return (
          <>
            <div>
              <label className={labelCls} style={{ color: "#3d4a42" }}>Fertilizer Name *</label>
              <input type="text" value={formData.fertilizerName} onChange={e => fc("fertilizerName", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="e.g. DAP, Urea" />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#3d4a42" }}>Dosage / Quantity</label>
              <input type="text" value={formData.dosage} onChange={e => fc("dosage", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="e.g. 50 kg/acre" />
            </div>
          </>
        );
      case "Pesticide":
        return (
          <>
            <div>
              <label className={labelCls} style={{ color: "#3d4a42" }}>Pesticide Name *</label>
              <input type="text" value={formData.pesticideName} onChange={e => fc("pesticideName", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="e.g. Malathion, Chlorpyrifos" />
            </div>
            <div>
              <label className={labelCls} style={{ color: "#3d4a42" }}>Dosage / Quantity</label>
              <input type="text" value={formData.dosage} onChange={e => fc("dosage", e.target.value)}
                className={inputCls} style={inputStyle} placeholder="e.g. 500 ml/acre" />
            </div>
          </>
        );
      case "Disease":
        return (
          <div>
            <label className={labelCls} style={{ color: "#3d4a42" }}>Disease / Infection Name *</label>
            <input type="text" value={formData.diseaseName} onChange={e => fc("diseaseName", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="e.g. Leaf Rust, Blight" />
          </div>
        );
      case "Harvest":
        return (
          <div>
            <label className={labelCls} style={{ color: "#3d4a42" }}>Actual Yield (optional)</label>
            <input type="number" value={formData.actualYield} onChange={e => fc("actualYield", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="e.g. 50 (Quintals/Tons)" />
          </div>
        );
      case "Others":
        return (
          <div>
            <label className={labelCls} style={{ color: "#3d4a42" }}>Cost / Expense (optional)</label>
            <input type="text" value={formData.cost} onChange={e => fc("cost", e.target.value)}
              className={inputCls} style={inputStyle} placeholder="e.g. 500 rs for tractor rent" />
          </div>
        );
      default:
        return null;
    }
  };

  // ── WIZARD ────────────────────────────────────────────────────
  if (loadingPlans) {
    return <div className="p-8 font-bold" style={{ color: "#006948" }}>Loading Calendar...</div>;
  }

  if (showWizard) {
    return (
      <div style={{ width: "100%", minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, background: "#f8f9fa", boxSizing: "border-box" }}>
        <div style={{ width: "100%", maxWidth: 460, background: "#ffffff", border: "1.5px solid #bccac0", borderRadius: 24, padding: 36, boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
          
          {cropPlans.length > 0 && (
             <button onClick={() => setShowWizard(false)} className="mb-4 flex items-center gap-1 text-sm font-bold" style={{ color: "#6d7a72" }}>
               <ChevronLeft className="w-4 h-4" /> Back to Calendar
             </button>
          )}

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-md" style={{ background: "linear-gradient(135deg, #006948, #004d34)" }}>
              <FilePlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: "#191c1d" }}>New Crop Plan</h2>
            <p className="mt-2 text-sm" style={{ color: "#3d4a42" }}>Create a dedicated profile for a new crop on your farm.</p>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Farm Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#006948" }} />
                <select value={wizardFarm} onChange={e => setWizardFarm(e.target.value)}
                  className="w-full h-12 pl-9 pr-4 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer"
                  style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }}>
                  <option value="">Select a farm…</option>
                  {farms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none rotate-90" style={{ color: "#6d7a72" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Crop Name *</label>
              <div className="relative">
                <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#006948" }} />
                <input type="text" value={wizardCrop} onChange={e => setWizardCrop(e.target.value)}
                  className="w-full h-12 pl-9 pr-4 rounded-xl text-sm font-medium outline-none"
                  style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }}
                  placeholder="e.g. Wheat, Rice, Sugarcane…" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Season *</label>
                <select value={wizardSeason} onChange={e => setWizardSeason(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer"
                  style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }}>
                  <option value="">Select season…</option>
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Zaid">Zaid</option>
                  <option value="Annual">Annual</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Year *</label>
                <input type="number" value={wizardYear} onChange={e => setWizardYear(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl text-sm font-medium outline-none"
                  style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }}
                  placeholder="2026" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Area (Acres)</label>
              <input type="number" value={wizardArea} onChange={e => setWizardArea(e.target.value)}
                className="w-full h-12 px-4 rounded-xl text-sm font-medium outline-none"
                style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }}
                placeholder="e.g. 5" />
            </div>

            <button disabled={!wizardFarm || !wizardCrop || !wizardSeason || !wizardYear || creatingPlan} onClick={handleCreatePlan}
              className="mt-2 w-full h-13 rounded-xl font-bold text-base tracking-wide transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "#006948", color: "#ffffff", height: 52 }}>
              {creatingPlan ? "Saving..." : "Create Plan →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived Data for Header Dropdowns ────────────────────────
  const uniqueFarms = Array.from(new Set(cropPlans.map(p => p.farmName)));
  const plansForSelectedFarm = cropPlans.filter(p => p.farmName === selectedFarm);
  const currentPlan = cropPlans.find(p => p._id === selectedPlanId);

  // ── CALENDAR GRID BUILD ───────────────────────────────────────
  const year       = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const daysInMonth   = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday  = new Date(year, monthIndex, 1).getDay();

  const blanks   = Array.from({ length: firstWeekday }, (_, i) => ({ blank: true, key: `b-${i}` }));
  const daysCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day      = i + 1;
    const dateObj  = new Date(year, monthIndex, day);
    const dayEvs   = events.filter(ev => ev.cropPlanId?._id === selectedPlanId && isSameDay(new Date(ev.date), dateObj));
    return { blank: false, key: `d-${day}`, day, isToday: isSameDay(dateObj, today), dateObj, events: dayEvs };
  });
  const cells = [...blanks, ...daysCells];

  // ── Summary stats ─────────────────────────────────────────────
  const ctxEvs = events.filter(ev => ev.cropPlanId?._id === selectedPlanId);
  const upcomingSowing  = ctxEvs.filter(ev => ev.eventType === "Sowing"  && startOfDay(new Date(ev.date)) >= today).length;
  const upcomingHarvest = ctxEvs.filter(ev => ev.eventType === "Harvest" && startOfDay(new Date(ev.date)) >= today).length;
  const overdue         = ctxEvs.filter(ev => startOfDay(new Date(ev.date)) < today && ev.status !== "completed").length;

  // ── Upcoming task list ────────────────────────────────────────
  // Show all pending/upcoming tasks across ALL plans for the farmer that are >= today
  const upcomingList = [...events]
    .filter(ev => startOfDay(new Date(ev.date)) >= today && ev.status !== "completed")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#f8f9fa" }}>

      {/* ══ MAIN SCROLL AREA ══════════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20, padding: 24, marginRight: drawerDate ? 400 : 0, transition: "margin-right 0.3s ease", boxSizing: "border-box" }}>

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <div style={{ flexShrink: 0 }}>
          <div className="flex flex-wrap items-center gap-4 mb-2">
            
            {/* Dynamic Farm Selection */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#e8f5f0", border: "1px solid #bccac0" }}>
              <MapPin className="w-3 h-3" style={{ color: "#006948" }} />
              <select
                value={selectedFarm}
                onChange={e => handleFarmChange(e.target.value)}
                className="text-xs font-bold outline-none cursor-pointer bg-transparent"
                style={{ color: "#006948" }}
              >
                {uniqueFarms.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Crop Selection (constrained by Farm) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#e8f5f0", border: "1px solid #bccac0" }}>
              <Leaf className="w-3 h-3" style={{ color: "#006948" }} />
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="text-xs font-bold outline-none cursor-pointer bg-transparent"
                style={{ color: "#006948" }}
              >
                {plansForSelectedFarm.map(p => (
                  <option key={p._id} value={p._id}>{p.cropName} ({p.season} {p.year})</option>
                ))}
              </select>
            </div>
            
            {/* Add New Plan Button */}
            <button
              onClick={() => { setWizardFarm(""); setWizardCrop(""); setShowWizard(true); }}
              className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors hover:bg-gray-200"
              style={{ color: "#3d4a42", border: "1px dashed #6d7a72" }}
            >
              <Plus className="w-3 h-3" /> New Plan
            </button>
          </div>

          <h1 className="text-3xl font-extrabold" style={{ color: "#191c1d" }}>Crop Calendar</h1>
          <p className="mt-1 text-sm" style={{ color: "#3d4a42" }}>
            Track sowing, irrigation, harvesting, treatments and disease events for your crop.
          </p>
        </div>

        {fetchError && (
          <div className="px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: "#fde8e8", color: "#ba1a1a", border: "1px solid #f5c2c2" }}>
            {fetchError}
          </div>
        )}

        {/* ── SUMMARY CARDS ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ flexShrink: 0 }}>
          <SummaryCard icon={MapPin}       label="Farm"            value={selectedFarm}   accentColor="#006948" />
          <SummaryCard icon={Leaf}         label="Sowing (Ahead)"  value={upcomingSowing}  accentColor="#006c49" />
          <SummaryCard icon={Tractor}      label="Harvest (Ahead)" value={upcomingHarvest} accentColor="#904821" />
          <SummaryCard icon={AlertTriangle} label="Overdue Tasks"  value={overdue}         accentColor="#ba1a1a" />
        </div>

        {/* ── LEGEND ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-3 rounded-xl text-xs font-semibold" style={{ background: "#f3f4f5", border: "1px solid #bccac0", flexShrink: 0 }}>
          {Object.entries(EVENT_META).map(([key, m]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
              <span style={{ color: "#3d4a42" }}>{m.label}</span>
            </div>
          ))}
        </div>

        {/* ── CALENDAR SECTION ─────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1.5px solid #bccac0", flexShrink: 0 }}>
          {/* Month header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #bccac0", background: "#f3f4f5" }}>
            <button onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-200">
              <ChevronLeft className="w-5 h-5" style={{ color: "#191c1d" }} />
            </button>
            <h2 className="text-lg font-extrabold" style={{ color: "#191c1d" }}>{monthNames[monthIndex]} {year}</h2>
            <button onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-200">
              <ChevronRight className="w-5 h-5" style={{ color: "#191c1d" }} />
            </button>
          </div>

          {/* Weekday row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e7e8e9" }}>
            {weekdays.map(d => (
              <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6d7a72" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {cells.map(cell => {
              if (cell.blank) return <div key={cell.key} style={{ minHeight: 110, borderRight: "1px solid #e7e8e9", borderBottom: "1px solid #e7e8e9", background: "#fafafa" }} />;

              const visible = cell.events.slice(0, 3);
              const extra   = cell.events.length - visible.length;

              return (
                <div key={cell.key} onClick={() => openDrawer(cell.dateObj)}
                  style={{ minHeight: 110, padding: 8, position: "relative", cursor: "pointer", borderRight: "1px solid #e7e8e9", borderBottom: "1px solid #e7e8e9", background: cell.isToday ? "#e8f5f0" : "#ffffff", transition: "background 0.15s", boxSizing: "border-box" }}
                  onMouseEnter={e => { if (!cell.isToday) e.currentTarget.style.background = "#f0faf5"; }}
                  onMouseLeave={e => { if (!cell.isToday) e.currentTarget.style.background = "#ffffff"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontSize: 13, fontWeight: 700, ...(cell.isToday ? { background: "#006948", color: "#ffffff" } : { color: "#3d4a42" }) }}>
                      {cell.day}
                    </span>
                    <Plus style={{ width: 13, height: 13, color: "#006948", opacity: 0.3 }} />
                  </div>

                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                    {visible.map(ev => {
                      const m = getEventMeta(ev.eventType);
                      const Icon = m.icon;
                      return (
                        <div key={ev._id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: m.bg, color: m.color, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }} title={ev.title}>
                          <Icon style={{ width: 9, height: 9, flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                        </div>
                      );
                    })}
                    {extra > 0 && <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: "#e7e8e9", color: "#6d7a72", alignSelf: "flex-start" }}>+{extra} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── UPCOMING TASKS LIST ───────────────────────────────── */}
        <div className="rounded-2xl p-5" style={{ background: "#ffffff", border: "1.5px solid #bccac0", flexShrink: 0 }}>
          <h3 className="text-lg font-extrabold mb-4" style={{ color: "#191c1d" }}>Upcoming Events</h3>
          {loadingEvents ? (
            <p className="text-sm animate-pulse" style={{ color: "#6d7a72" }}>Loading events…</p>
          ) : upcomingList.length === 0 ? (
            <div className="py-8 text-center rounded-xl text-sm font-medium" style={{ background: "#f3f4f5", color: "#6d7a72", border: "1.5px dashed #bccac0" }}>
              No upcoming events — click a date to add one!
            </div>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: "#e7e8e9" }}>
              {upcomingList.map((ev, i) => {
                const m      = getEventMeta(ev.eventType);
                const Icon   = m.icon;
                const evDate = startOfDay(new Date(ev.date));
                const diff   = Math.round((evDate - today) / 86400000);
                
                let badge = "";
                if (diff === 0) badge = "Today";
                else if (diff > 0) badge = `in ${diff} day${diff !== 1 ? "s" : ""}`;
                else badge = `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""} ago`;
                
                return (
                  <div key={i} className="flex items-center gap-4 py-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: m.bg }}>
                      <Icon className="w-5 h-5" style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#191c1d" }}>{ev.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6d7a72" }}>{m.label} · {ev.cropPlanId?.cropName}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: diff < 0 ? "#fde8e8" : m.bg, color: diff < 0 ? "#ba1a1a" : m.color }}>
                      {badge}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="h-8" />
      </div>

      {/* ══ MOBILE OVERLAY ═══════════════════════════════════════ */}
      {drawerDate && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)" }} onClick={closeDrawer} />}

      {/* ══ RIGHT DRAWER ══════════════════════════════════════════ */}
      <aside className="absolute top-0 right-0 h-full flex flex-col transition-transform duration-300 ease-in-out z-40" style={{ width: 400, background: "#ffffff", borderLeft: "1.5px solid #bccac0", transform: drawerDate ? "translateX(0)" : "translateX(100%)", boxShadow: drawerDate ? "-8px 0 32px rgba(0,0,0,0.08)" : "none" }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e7e8e9", background: "#f3f4f5" }}>
          <div>
            <h3 className="text-lg font-extrabold" style={{ color: "#191c1d" }}>Add Event</h3>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#6d7a72" }}>{drawerDate ? drawerDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : ""}</p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-200" style={{ color: "#6d7a72" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {formError && (
              <div className="px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2" style={{ background: "#fde8e8", color: "#ba1a1a", border: "1px solid #f5c2c2" }}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5" style={{ background: "#e8f5f0", color: "#006948" }}>
                <Leaf className="w-3 h-3" /> {currentPlan ? `${currentPlan.cropName} (${currentPlan.season} ${currentPlan.year})` : ""}
              </span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5" style={{ background: "#e8f5f0", color: "#006948" }}>
                <MapPin className="w-3 h-3" /> {selectedFarm}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Event Title *</label>
              <input type="text" value={formData.title} onChange={e => fc("title", e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none" style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }} placeholder="e.g. First Irrigation, DAP Application…" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Event Type *</label>
              <div className="relative">
                <select value={formData.eventType} onChange={e => fc("eventType", e.target.value)} className="w-full px-4 py-3 pr-10 rounded-xl text-sm font-medium outline-none appearance-none cursor-pointer" style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }}>
                  <option value="">Select event type…</option>
                  <option value="Sowing">🌱 Sowing</option>
                  <option value="Irrigation">💧 Irrigation / Water Supplied</option>
                  <option value="Harvest">🚜 Harvest</option>
                  <option value="Fertilizer">🧪 Fertilizer Application</option>
                  <option value="Pesticide">🐛 Pesticide Application</option>
                  <option value="Disease">⚠️ Disease / Crop Infection</option>
                  <option value="Others">📝 Others (e.g., Tractor Cost, Extra Work)</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none rotate-90" style={{ color: "#6d7a72" }} />
              </div>
            </div>

            {formData.eventType && (
              <div className="flex flex-col gap-4 rounded-xl p-4" style={{ background: "#f3f4f5", border: "1px solid #e7e8e9" }}>
                <DynamicFields />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#3d4a42" }}>Notes / Observations</label>
              <textarea value={formData.notes} onChange={e => fc("notes", e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none" style={{ background: "#f3f4f5", border: "1.5px solid #bccac0", color: "#191c1d" }} placeholder="Any additional observations…" />
            </div>

            <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "#006948", color: "#ffffff" }}>
              {submitting ? "Saving…" : "Save Event"}
            </button>
            <div className="h-4" />
          </form>
        </div>
      </aside>
    </div>
  );
};

export default CropCalendar;
