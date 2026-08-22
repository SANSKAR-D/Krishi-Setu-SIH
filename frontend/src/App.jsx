import React from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'

const App = () => {
  return (
    <div className="bg-background text-on-background font-body-md h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64 w-full relative overflow-y-auto">
        <Navbar />
        <Dashboard />
      </div>
    </div>
  )
}

export default App