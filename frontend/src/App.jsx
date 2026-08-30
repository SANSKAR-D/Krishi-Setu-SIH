import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import ExpertChat from './components/ExpertChat/ExpertChat'
import CropCalendar from './components/CropCalender/CropCalender'
import Login from './pages/Login'
import Register from './pages/Register'
import GISMap from './pages/GISMap'
import MarketData from './pages/MarketData'
import ProtectedRoute from './components/ProtectedRoute'

const DashboardLayout = () => (
  <div className="bg-background text-on-background body-md h-screen flex overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col lg:ml-64 min-w-0 relative overflow-y-auto w-full">
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/crop-calendar" element={<CropCalendar />} />
        <Route path="/expert-chat" element={<ExpertChat />} />
        <Route path="/gis" element={<GISMap />} />
        <Route path="/market-data" element={<MarketData />} />
      </Routes>
    </div>
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App