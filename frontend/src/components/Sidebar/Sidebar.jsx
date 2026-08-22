import React from 'react';
import { Brain, Home, Sprout, Calendar, Bot, HelpCircle, Settings } from 'lucide-react';

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
        <a className="flex items-center gap-sm px-md py-sm bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:bg-surface-container transition-colors" href="#">
          <Home className="w-5 h-5" />
          <span className="label-sm">Home</span>
        </a>
        <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
          <Sprout className="w-5 h-5" />
          <span className="label-sm">Soil Health</span>
        </a>
        <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
          <Calendar className="w-5 h-5" />
          <span className="label-sm">Crop Calendar</span>
        </a>
        <a className="flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors" href="#">
          <Bot className="w-5 h-5" />
          <span className="label-sm">Expert Chat</span>
        </a>
      </div>
      
      {/* CTA & Footer */}
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
