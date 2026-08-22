import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import CropCalendar from './components/CropCalender/CropCalender'
import ExpertChat from './components/ExpertChat/ExpertChat'
const App = () => {
  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64 w-full relative overflow-y-auto">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crop-calendar" element={<CropCalendar />} />
          <Route path="/expert-chat" element={<ExpertChat />} />
        </Routes>
       
      </div>
    </div>
  )
}

export default App