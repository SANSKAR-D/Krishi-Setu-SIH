import React from 'react';
import { NavLink } from 'react-router-dom';
import { Brain, Home, Sprout, Calendar, Bot, HelpCircle, Settings } from 'lucide-react';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-sm px-md py-sm rounded-lg transition-colors ${
    isActive
      ? 'bg-secondary-container text-on-secondary-container font-bold'
      : 'text-on-surface-variant hover:bg-surface-container-high'
  }`;
const Sidebar = () => {
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
        <NavLink to="/" end className={navLinkClass}>
          <Home className="w-5 h-5" />
          <span className="label-sm">Home</span>
        </NavLink>
        <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
          <Sprout className="w-5 h-5" />
          <span className="label-sm">Soil Health</span>
        </a>
        <NavLink to="/crop-calendar" className={navLinkClass}>
          <Calendar className="w-5 h-5" />
          <span className="label-sm">Crop Calendar</span>
        </NavLink>
        <NavLink to="/expert-chat" className={navLinkClass}>
          <Bot className="w-5 h-5" />
          <span className="label-sm">Expert Chat</span>
        </NavLink>
      </div>

      <div className="mt-auto flex flex-col gap-sm">
        <div className="flex flex-col gap-xs mt-sm pt-sm border-t border-outline-variant">
          <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
            <HelpCircle className="w-5 h-5" />
            <span className="label-sm">Support</span>
          </a>
          <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
            <Settings className="w-5 h-5" />
            <span className="label-sm">Settings</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;