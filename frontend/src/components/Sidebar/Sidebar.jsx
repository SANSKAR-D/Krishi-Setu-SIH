import { Brain, Home, Sprout, Calendar, Bot, HelpCircle, Settings, Map } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navClass = ({ isActive }) =>
    `flex items-center gap-sm px-md py-sm rounded-lg transition-colors ${
      isActive
        ? 'bg-secondary-container text-on-secondary-container font-bold'
        : 'text-on-surface-variant hover:bg-surface-container-high'
    }`;

  return (
    <nav className="fixed left-0 top-0 h-full hidden lg:flex flex-col py-md px-sm w-64 z-40 bg-surface-container-lowest dark:bg-surface-dim border-r border-outline-variant">
      {/* Header */}
      <div className="flex items-center gap-sm px-sm mb-lg">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Brain className="text-on-primary w-6 h-6" />
        </div>
        <div>
          <h1 className="title-md text-primary leading-tight">AgriExpert AI</h1>
          <p className="label-sm text-on-surface-variant">Precision Agriculture</p>
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-xs">
        <NavLink to="/" className={navClass}>
          <Home className="w-5 h-5" />
          <span className="label-sm">Home</span>
        </NavLink>
        <NavLink to="/soil-health" className={navClass}>
          <Sprout className="w-5 h-5" />
          <span className="label-sm">Soil Health</span>
        </NavLink>
        <NavLink to="/crop-calendar" className={navClass}>
          <Calendar className="w-5 h-5" />
          <span className="label-sm">Crop Calendar</span>
        </NavLink>
        <NavLink to="/expert-chat" className={navClass}>
          <Bot className="w-5 h-5" />
          <span className="label-sm">Expert Chat</span>
        </NavLink>
        <NavLink to="/gis" className={navClass}>
          <Map className="w-5 h-5" />
          <span className="label-sm">GIS Map</span>
        </NavLink>
      </div>
      
      {/* CTA & Footer */}
      <div className="mt-auto flex flex-col gap-sm">
        <div className="flex flex-col gap-xs mt-sm pt-sm border-t border-outline-variant">
          <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer" href="#">
            <HelpCircle className="w-5 h-5" />
            <span className="label-sm">Support</span>
          </a>
          <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer" href="#">
            <Settings className="w-5 h-5" />
            <span className="label-sm">Settings</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;