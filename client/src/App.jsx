import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomeScreen from './components/HomeScreen'
import ModeSelection from './components/ModeSelection'
import ScenarioSetup from './components/ScenarioSetup'
import PredefinedAsteroid from './components/PredefinedAsteroid'
import CustomAsteroid from './components/CustomAsteroid'
import GlobeScreen from './components/GlobeScreen'
import './App.css'

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/simulation" element={<ModeSelection />} />
          <Route path="/simulation/scenario-setup" element={<ScenarioSetup />} />
          <Route path="/simulation/predefined" element={<PredefinedAsteroid />} />
          <Route path="/simulation/custom" element={<CustomAsteroid />} />
          <Route path="/simulation/globe" element={<GlobeScreen />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
