import { useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Droplet,
  Tractor,
  AlertTriangle,
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
// Summary Cards
// --------------------------------------------------

const summaryCards = [
  {
    label: "Active Crops",
    value: 6,
    color: "text-primary",
    icon: Leaf,
    iconBg: "bg-primary/10",
  },
  {
    label: "Upcoming Sowing",
    value: 2,
    color: "text-secondary",
    icon: Droplet,
    iconBg: "bg-secondary/10",
  },
  {
    label: "Ready to Harvest",
    value: 1,
    color: "text-tertiary",
    icon: Tractor,
    iconBg: "bg-tertiary/10",
  },
  {
    label: "Overdue Tasks",
    value: 3,
    color: "text-error",
    icon: AlertTriangle,
    iconBg: "bg-error/10",
  },
];

// --------------------------------------------------
// Calendar Events
// --------------------------------------------------

const calendarDays = [
  { day: 1 },
  { day: 2, event: { label: "Wheat sown", color: "primary" } },
  { day: 3 },
  { day: 4 },
  { day: 5 },
  { day: 6 },
  { day: 7 },

  { day: 8 },
  { day: 9 },
  { day: 10, event: { label: "Irrigate N.Field", color: "secondary" } },
  { day: 11 },
  { day: 12 },
  { day: 13 },
  { day: 14 },

  { day: 15 },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },

  { day: 22 },
  { day: 23, event: { label: "Fungicide overdue", color: "error" } },
  { day: 24, isToday: true },
  { day: 25 },
  { day: 26, event: { label: "Rice harvest", color: "tertiary" } },
  { day: 27 },
  { day: 28 },

  { day: 29 },
  { day: 30 },
  { day: 31, event: { label: "Cucumber check", color: "secondary" } },
];

// --------------------------------------------------
// Upcoming Tasks
// --------------------------------------------------

const upcomingTasks = [
  {
    icon: AlertTriangle,
    iconColor: "text-error",
    iconBg: "bg-error/10",
    text: "Apply fungicide to Cucumber (Greenhouse B)",
    meta: "Overdue by 1 day",
    metaColor: "text-error",
  },
  {
    icon: Tractor,
    iconColor: "text-tertiary",
    iconBg: "bg-tertiary/10",
    text: "Harvest Rice (East Plot)",
    meta: "Due Oct 26",
    metaColor: "text-on-surface-variant",
  },
  {
    icon: Droplet,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    text: "Irrigate Wheat (North Field)",
    meta: "Due Oct 28",
    metaColor: "text-on-surface-variant",
  },
];

// --------------------------------------------------
// Weekdays
// --------------------------------------------------

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --------------------------------------------------
// Event Color Mapping
// --------------------------------------------------

const eventColorClasses = {
  primary: "bg-primary/10 text-primary border border-primary/20",
  secondary: "bg-secondary/10 text-secondary border border-secondary/20",
  tertiary: "bg-tertiary/10 text-tertiary border border-tertiary/20",
  error: "bg-error/10 text-error border border-error/20",
};

// --------------------------------------------------
// Component
// --------------------------------------------------

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CropCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2023, 9, 1)); // October 2023

  const month = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleAddEvent = () => {
    // wire up modal/form logic here
    console.log("Add crop event");
  };

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
          onClick={handleAddEvent}
          className="self-start md:self-auto flex items-center justify-center gap-2 px-md py-sm bg-primary text-on-primary rounded-xl font-bold shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-label-sm text-label-sm">Add Crop Event</span>
        </button>
      </section>

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
      <section className="bg-surface-container-low rounded-2xl border border-outline-variant  shadow-sm">
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
          {calendarDays.map((cell, index) => {
            const { day, event, isToday } = cell;
            return (
              <div
                key={index}
                className={`min-h-[90px] md:min-h-[110px] p-2 border-r border-b border-outline-variant relative ${
                  isToday ? "bg-primary/5" : "bg-surface-container-low"
                }`}
              >
                {isToday ? (
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-on-primary text-sm font-bold">
                    {day}
                  </span>
                ) : (
                  <span className="text-sm text-on-surface-variant">{day}</span>
                )}

                {event && (
                  <div
                    className={`mt-2 px-2 py-1 rounded-md text-[10px] md:text-[11px] font-bold truncate ${eventColorClasses[event.color]}`}
                    title={event.label}
                  >
                    {event.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* UPCOMING TASKS */}
      <section className="bg-surface-container-low rounded-2xl border border-outline-variant p-md shadow-sm">
        <h3 className="font-title-md text-title-md text-on-surface mb-sm">Upcoming Tasks</h3>

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

        {/* Mobile task meta */}
        <div className="sm:hidden mt-2 flex flex-col gap-1">
          {upcomingTasks.map((task, index) => (
            <div key={index} className="text-right text-xs text-on-surface-variant">
              {task.meta}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default CropCalendar;