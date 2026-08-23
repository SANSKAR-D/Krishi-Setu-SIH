import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import SoilHealth from './components/SoilHealth/SoilHealth'
import ExpertChat from './components/ExpertChat/ExpertChat'
import CropCalendar from './components/CropCalender/CropCalender'

const App = () => {
  return (
    <BrowserRouter>
      <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-64 w-full relative overflow-y-auto">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/soil-health" element={<SoilHealth />} />
            <Route path="/expert-chat" element={<ExpertChat />} />
            <Route path="/crop-calendar" element={<CropCalendar />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App