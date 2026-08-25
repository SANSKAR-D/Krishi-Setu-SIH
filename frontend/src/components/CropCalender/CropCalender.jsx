import { useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Droplet,
  Tractor,
  AlertTriangle,
  X,
} from "lucide-react";

// --------------------------------------------------
// Legend
// --------------------------------------------------

const legendItems = [
  { label: "Sowing", color: "bg-primary" },
  { label: "Irrigation", color: "bg-secondary" },
  { label: "Harvest", color: "bg-tertiary" },
  { label: "Alert/Overdue", color: "bg-error" },
];

// --------------------------------------------------
// Weekdays
// --------------------------------------------------

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --------------------------------------------------
// Event type -> color / icon mapping
// --------------------------------------------------

const eventTypeColorMap = {
  sowing: "primary",
  irrigation: "secondary",
  harvest: "tertiary",
  alert: "error",
};

const eventTypeIconMap = {
  sowing: Leaf,
  irrigation: Droplet,
  harvest: Tractor,
  alert: AlertTriangle,
};

const eventColorClasses = {
  primary: "bg-primary/10 text-primary border border-primary/20",
  secondary: "bg-secondary/10 text-secondary border border-secondary/20",
  tertiary: "bg-tertiary/10 text-tertiary border border-tertiary/20",
  error: "bg-error/10 text-error border border-error/20",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const emptyForm = {
  title: "",
  eventType: "",
  date: "",
  crop: "",
  field: "",
  farmerId: "",
  medicineName: "",
  dosage: "",
  notes: "",
};

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const CropCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const month = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  const today = startOfDay(new Date());

  // --------------------------------------------------
  // Fetch events from backend
  // --------------------------------------------------

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch("http://localhost:5000/api/events");
        const data = await res.json();
        if (data.success) {
          setEvents(data.data || []);
        } else {
          setFetchError(data.message || "Events fetch nahi ho paaye");
        }
      } catch (err) {
        setFetchError("Server se connect nahi ho paaya");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // --------------------------------------------------
  // Add event
  // --------------------------------------------------

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openModal = () => {
    setFormData(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.eventType || !formData.date || !formData.farmerId) {
      setFormError("Title, Event Type, Date aur Farmer ID bharna zaroori hai");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setEvents((prev) => [...prev, data.data]);
        setFormData(emptyForm);
        setIsModalOpen(false);
      } else {
        setFormError(data.message || "Event add nahi ho paaya");
      }
    } catch (err) {
      setFormError("Server se connect nahi ho paaya");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // --------------------------------------------------
  // Build calendar grid for the current month
  // --------------------------------------------------

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();

  const leadingBlanks = Array.from({ length: firstWeekday }, (_, i) => ({
    blank: true,
    key: `blank-${i}`,
  }));

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1;
    const cellDate = new Date(year, monthIndex, dayNumber);
    const dayEvents = events.filter((ev) => isSameDay(new Date(ev.date), cellDate));
    return {
      blank: false,
      key: `day-${dayNumber}`,
      day: dayNumber,
      isToday: isSameDay(cellDate, today),
      events: dayEvents,
    };
  });

  const calendarCells = [...leadingBlanks, ...monthDays];

  // --------------------------------------------------
  // Derived summary data (from real events)
  // --------------------------------------------------

  const activeCropsCount = new Set(events.map((ev) => ev.crop).filter(Boolean)).size;

  const upcomingSowingCount = events.filter(
    (ev) => ev.eventType === "Sowing" && startOfDay(new Date(ev.date)) >= today
  ).length;

  const readyToHarvestCount = events.filter(
    (ev) => ev.eventType === "Harvest" && startOfDay(new Date(ev.date)) >= today
  ).length;

  const overdueTasksCount = events.filter(
    (ev) => startOfDay(new Date(ev.date)) < today
  ).length;

  const summaryCards = [
    { label: "Active Crops", value: activeCropsCount, color: "text-primary", icon: Leaf, iconBg: "bg-primary/10" },
    { label: "Upcoming Sowing", value: upcomingSowingCount, color: "text-secondary", icon: Droplet, iconBg: "bg-secondary/10" },
    { label: "Ready to Harvest", value: readyToHarvestCount, color: "text-tertiary", icon: Tractor, iconBg: "bg-tertiary/10" },
    { label: "Overdue Tasks", value: overdueTasksCount, color: "text-error", icon: AlertTriangle, iconBg: "bg-error/10" },
  ];

  // --------------------------------------------------
  // Upcoming tasks list (from real events, sorted by date)
  // --------------------------------------------------

  const upcomingTasks = [...events]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
    .map((ev) => {
      const evDate = startOfDay(new Date(ev.date));
      const diffDays = Math.round((evDate - today) / (1000 * 60 * 60 * 24));
      const colorKey = eventTypeColorMap[ev.eventType?.toLowerCase()] || "primary";
      const Icon = eventTypeIconMap[ev.eventType?.toLowerCase()] || Leaf;

      let meta = "";
      let metaColor = "text-on-surface-variant";
      if (diffDays < 0) {
        meta = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`;
        metaColor = "text-error";
      } else if (diffDays === 0) {
        meta = "Due today";
      } else {
        meta = `Due ${evDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      }

      return {
        icon: Icon,
        iconColor: `text-${colorKey}`,
        iconBg: `bg-${colorKey}/10`,
        text: `${ev.eventType} - ${ev.crop || ev.title} (${ev.field || "N/A"})`,
        meta,
        metaColor,
      };
    });

  return (
    <main className="flex-1 min-w-0 min-h-0 p-margin-mobile md:p-gutter flex flex-col gap-md bg-background overflow-y-auto">
      {/* HEADER */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-sm">
        <div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Crop Calendar
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Track sowing, growth stages and harvest windows across all fields
          </p>
        </div>

        <button
          onClick={openModal}
          className="self-start md:self-auto flex items-center justify-center gap-2 px-md py-sm bg-primary text-on-primary rounded-xl font-bold shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-label-sm text-label-sm">Add Crop Event</span>
        </button>
      </section>

      {fetchError && (
        <p className="text-error text-sm">{fetchError}</p>
      )}

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-sm md:gap-md">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-surface-container-low rounded-2xl p-sm md:p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-11 h-11 rounded-full ${card.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{card.label}</p>
              <p className={`mt-1 font-headline-lg-mobile text-headline-lg-mobile ${card.color}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* LEGEND */}
      <section className="flex flex-wrap items-center gap-md text-label-sm text-on-surface-variant">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-xs">
            <span className={`w-3 h-3 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </section>

      {/* CALENDAR */}
      <section className="bg-surface-container-low rounded-2xl border border-outline-variant shadow-sm">
        {/* Month Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-outline-variant">
          <button
            onClick={handlePreviousMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="font-title-md text-title-md text-on-surface">{month}</h2>

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-outline-variant">
          {weekdays.map((day) => (
            <div key={day} className="py-3 text-center font-label-sm text-label-sm font-semibold text-on-surface-variant">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarCells.map((cell) => {
            if (cell.blank) {
              return (
                <div
                  key={cell.key}
                  className="min-h-[90px] md:min-h-[110px] p-2 border-r border-b border-outline-variant bg-surface-container-low/50"
                />
              );
            }

            const visibleEvents = cell.events.slice(0, 2);
            const extraCount = cell.events.length - visibleEvents.length;

            return (
              <div
                key={cell.key}
                className={`min-h-[90px] md:min-h-[110px] p-2 border-r border-b border-outline-variant relative ${
                  cell.isToday ? "bg-primary/5" : ""
                }`}
              >
                <span
                  className={`text-sm ${
                    cell.isToday
                      ? "inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-primary font-bold"
                      : "text-on-surface-variant"
                  }`}
                >
                  {cell.day}
                </span>

                <div className="mt-1 flex flex-col gap-1">
                  {visibleEvents.map((ev) => {
                    const colorKey = eventTypeColorMap[ev.eventType?.toLowerCase()] || "primary";
                    return (
                      <div
                        key={ev._id}
                        className={`px-2 py-1 rounded-md text-[10px] md:text-[11px] font-bold truncate ${
                          eventColorClasses[colorKey]
                        }`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                  {extraCount > 0 && (
                    <div className="text-[10px] text-on-surface-variant px-2">
                      +{extraCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* UPCOMING TASKS */}
      <section className="bg-surface-container-low rounded-2xl border border-outline-variant p-md shadow-sm">
        <h3 className="font-title-md text-title-md text-on-surface mb-sm">Upcoming Tasks</h3>

        {loading ? (
          <p className="text-sm text-on-surface-variant">Loading...</p>
        ) : upcomingTasks.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Koi event nahi mila</p>
        ) : (
          <>
            <div className="flex flex-col">
              {upcomingTasks.map((task, index) => {
                const Icon = task.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-sm py-4 border-b border-outline-variant last:border-b-0"
                  >
                    <div className={`w-10 h-10 rounded-full ${task.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${task.iconColor}`} />
                    </div>

                    <p className="font-body-md text-body-md text-on-surface flex-1">{task.text}</p>

                    <span className={`hidden sm:block text-sm font-semibold ${task.metaColor}`}>
                      {task.meta}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="sm:hidden mt-2 flex flex-col gap-1">
              {upcomingTasks.map((task, index) => (
                <div key={index} className={`text-right text-xs ${task.metaColor}`}>
                  {task.meta}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ADD EVENT MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: "16px",
          }}
        >
          <div
            className="bg-surface-container-low rounded-2xl border border-outline-variant shadow-lg"
            style={{
              width: "100%",
              maxWidth: "448px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
              <h3 className="font-title-md text-title-md text-on-surface">Add Crop Event</h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="flex flex-col gap-sm p-md">
              {formError && <p className="text-error text-sm">{formError}</p>}

              <div>
                <label className="text-label-sm text-on-surface-variant">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                  placeholder="e.g. Wheat Sowing"
                />
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">Event Type *</label>
                <select
                  value={formData.eventType}
                  onChange={(e) => handleFormChange("eventType", e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                >
                  <option value="">Select type</option>
                  <option value="Sowing">Sowing</option>
                  <option value="Irrigation">Irrigation</option>
                  <option value="Harvest">Harvest</option>
                  <option value="Alert">Alert</option>
                </select>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="text-label-sm text-on-surface-variant">Crop</label>
                  <input
                    type="text"
                    value={formData.crop}
                    onChange={(e) => handleFormChange("crop", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                    placeholder="e.g. Wheat"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant">Field</label>
                  <input
                    type="text"
                    value={formData.field}
                    onChange={(e) => handleFormChange("field", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                    placeholder="e.g. North Field"
                  />
                </div>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">Farmer ID *</label>
                <input
                  type="text"
                  value={formData.farmerId}
                  onChange={(e) => handleFormChange("farmerId", e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                  placeholder="e.g. F123"
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <div>
                  <label className="text-label-sm text-on-surface-variant">Medicine Name</label>
                  <input
                    type="text"
                    value={formData.medicineName}
                    onChange={(e) => handleFormChange("medicineName", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant">Dosage</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(e) => handleFormChange("dosage", e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="text-label-sm text-on-surface-variant">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
                  rows={2}
                  placeholder="Optional"
                />
              </div>

              <div className="flex justify-end gap-sm mt-sm">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-md py-sm rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-md py-sm rounded-xl bg-primary text-on-primary font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default CropCalendar;
