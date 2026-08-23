import React from 'react';
import { Leaf, AlertTriangle, ClipboardList, Droplet, Maximize, Brain, Sun, CloudSun, CloudRain, Cloud } from 'lucide-react';

const Dashboard = () => {
  return (
    <main className="flex-1 overflow-y-auto p-margin-mobile md:p-gutter">
      <div className="max-w-[1280px] mx-auto flex flex-col gap-gutter">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-sm">
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs">October 24, 2023</p>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Welcome back, Farmer John</h2>
          </div>
          <div className="bg-surface px-md py-sm rounded-lg border border-outline-variant">
            <p className="font-body-md text-body-md text-on-surface-variant">
              All <span className="font-bold text-primary">4</span> fields are currently healthy. <span className="font-bold text-tertiary">2</span> tasks require attention today.
            </p>
          </div>
        </div>
        
        {/* Top Row: Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-md">
              <h3 className="font-title-md text-title-md text-on-surface">Field Health Score</h3>
              <Leaf className="text-primary w-6 h-6" />
            </div>
            <div className="flex items-center gap-md">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-r-surface-variant flex items-center justify-center transform rotate-45">
                <span className="font-title-md text-title-md text-primary transform -rotate-45">92%</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Overall farm vitality</p>
                <p className="font-body-sm text-primary mt-xs">+2% from last week</p>
              </div>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-md">
              <h3 className="font-title-md text-title-md text-on-surface">Active Alerts</h3>
              <AlertTriangle className="text-tertiary w-6 h-6" />
            </div>
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-center bg-surface-container-low px-sm py-xs rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Critical</span>
                <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-xs font-bold">0</span>
              </div>
              <div className="flex justify-between items-center bg-surface-container-low px-sm py-xs rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Warnings</span>
                <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded text-xs font-bold">2</span>
              </div>
            </div>
          </div>
          
          {/* Card 3 */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-md">
              <h3 className="font-title-md text-title-md text-on-surface">Next Scheduled Task</h3>
              <ClipboardList className="text-outline w-6 h-6" />
            </div>
            <div className="flex items-start gap-sm">
              <div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                <Droplet className="w-6 h-6" />
              </div>
              <div>
                <p className="font-title-md text-title-md text-on-surface">Fertilizer Application</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">North Field • Today, 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
          {/* Left 2/3: Field Map Overview */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
            <div className="p-md border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-title-md text-title-md text-on-surface">Field Map Overview</h3>
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
              <div className="absolute top-1/2 right-1/3 flex flex-col items-center">
                <div className="w-4 h-4 bg-tertiary rounded-full border-2 border-white shadow-sm mb-1"></div>
                <span className="bg-surface px-2 py-1 rounded text-xs font-bold text-on-surface shadow">East Plot</span>
              </div>
            </div>
          </div>
          
          {/* Right 1/3: Quick Advisory */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
            <div className="p-md border-b border-outline-variant flex gap-sm items-center">
              <Brain className="text-primary w-6 h-6" />
              <h3 className="font-title-md text-title-md text-on-surface">Quick Advisory</h3>
            </div>
            <div className="p-md flex-1 flex flex-col gap-md">
              <div className="bg-surface-container-low rounded-lg p-sm border border-outline-variant">
                <div className="flex justify-between items-start mb-sm">
                  <span className="bg-error-container text-on-error-container px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">New Diagnosis</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">2 hrs ago</span>
                </div>
                <p className="font-title-md text-body-md font-bold text-on-surface mb-xs">Downy Mildew detected</p>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">Initial signs identified on Cucumber leaves in Greenhouse B.</p>
                <div className="flex gap-sm">
                  <button className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-sm text-label-sm hover:bg-secondary transition-colors w-full text-center border-none cursor-pointer">
                    View Full Chat
                  </button>
                </div>
              </div>
              <div className="mt-auto pt-md border-t border-outline-variant text-center">
                <a className="font-label-sm text-label-sm text-primary hover:underline no-underline" href="#">View All Advisory History</a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md pb-lg">
          {/* Soil Health Preview */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm">
            <h3 className="font-title-md text-title-md text-on-surface mb-md">Soil Health Preview</h3>
            <div className="flex justify-around items-end h-32 mb-sm border-b border-outline-variant pb-2">
              <div className="flex flex-col items-center gap-xs w-full">
                <div className="w-8 bg-primary rounded-t-sm" style={{height: '60%'}}></div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">N</span>
              </div>
              <div className="flex flex-col items-center gap-xs w-full">
                <div className="w-8 bg-tertiary rounded-t-sm" style={{height: '40%'}}></div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">P</span>
              </div>
              <div className="flex flex-col items-center gap-xs w-full">
                <div className="w-8 bg-secondary-container rounded-t-sm" style={{height: '80%'}}></div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">K</span>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant text-center">Nitrogen levels slightly low in South Field.</p>
          </div>
          
          {/* Weather Forecast */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant shadow-sm">
            <h3 className="font-title-md text-title-md text-on-surface mb-md">Weekly Weather Forecast</h3>
            <div className="grid grid-cols-5 gap-sm text-center">
              <div className="flex flex-col items-center gap-xs p-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Mon</span>
                <Sun className="text-outline w-6 h-6" />
                <span className="font-body-md text-on-surface">72&deg;</span>
              </div>
              <div className="flex flex-col items-center gap-xs p-xs rounded bg-secondary-container text-on-secondary-container">
                <span className="font-label-sm text-label-sm font-bold">Tue</span>
                <CloudSun className="w-6 h-6" />
                <span className="font-body-md font-bold">68&deg;</span>
              </div>
              <div className="flex flex-col items-center gap-xs p-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Wed</span>
                <CloudRain className="text-outline w-6 h-6" />
                <span className="font-body-md text-on-surface">65&deg;</span>
              </div>
              <div className="flex flex-col items-center gap-xs p-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Thu</span>
                <Cloud className="text-outline w-6 h-6" />
                <span className="font-body-md text-on-surface">66&deg;</span>
              </div>
              <div className="flex flex-col items-center gap-xs p-xs rounded hover:bg-surface-container transition-colors cursor-pointer">
                <span className="font-label-sm text-label-sm text-on-surface-variant">Fri</span>
                <Sun className="text-outline w-6 h-6" />
                <span className="font-body-md text-on-surface">70&deg;</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </main>
  );
};

export default Dashboard;
