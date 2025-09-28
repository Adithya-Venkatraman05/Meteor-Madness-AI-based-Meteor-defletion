import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SpaceScene from './SpaceScene';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();

  const handleSimulationClick = () => {
    navigate('/simulation');
  };

  const handleCheckDataClick = () => {
    navigate('/simulation/predefined');
  };

  return (
    <div className="home-screen">
      {/* Three.js Space Scene Background */}
      <SpaceScene />
      
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">Meteor Madness</div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/simulation">Simulation</Link>
          <a href="#data">Data</a>
          <a href="#about">About</a>
        </div>
      </nav>

      {/* Landing Section - Full Viewport */}
      <section id="home" className="landing-section">
        {/* Title Section - Moved up */}
        <div className="title-section">
          <h1 className="main-title">Meteor Madness</h1>
          <p className="subtitle">Meteor Simulation System</p>
        </div>
        
        {/* Button Section - Separate positioning */}
        <div className="button-section">
          <div className="action-buttons">
            <button 
              className="action-btn simulation-btn" 
              onClick={handleSimulationClick}
            >
              Simulation
            </button>
            <button 
              className="action-btn data-btn" 
              onClick={handleCheckDataClick}
            >
              Check Data
            </button>
          </div>
        </div>
      </section>

      {/* About Us Section - Separate from landing */}
      <section id="about" className="about-section">
        <div className="about-content">
          <h2>About Meteor Madness</h2>
          
          {/* Abstract/Overview */}
          <div className="abstract-section">
            <div className="about-text">
              <p className="abstract-intro">
                <strong>Meteor Madness</strong> is a comprehensive planetary defense simulation platform that addresses 
                the critical gap between asteroid threat detection and actionable impact mitigation strategies. 
                Our system integrates real-time astronomical data with advanced physics modeling to provide 
                accurate impact assessments and deflection mission planning.
              </p>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="about-section-block">
            <h3>The Problem We're Solving</h3>
            <div className="about-text">
              <p>
                <strong>Asteroid Impact Risk:</strong> With over 34,000 known Near-Earth Objects (NEOs) and new discoveries 
                occurring daily, the threat of potentially hazardous asteroids remains one of humanity's most significant 
                existential challenges. Current systems lack comprehensive integration of real-time data, accurate population 
                modeling, and physics-based impact simulation necessary for effective planetary defense planning.
              </p>
              <p>
                <strong>Critical Gaps:</strong> Existing tools often provide fragmented analysis - astronomical observation 
                without impact consequences, or impact models without deflection feasibility. There's a crucial need for 
                unified platforms that can seamlessly transition from threat detection to mission planning.
              </p>
            </div>
          </div>

          {/* Our Solution Approach */}
          <div className="about-section-block">
            <h3>How We're Solving It</h3>
            <div className="about-text">
              <p>
                <strong>Integrated Analysis Pipeline:</strong> We've developed a comprehensive system that combines NASA's 
                Small-Body Database with sophisticated physics engines, high-resolution population datasets, and interactive 
                visualization tools to deliver end-to-end asteroid threat analysis.
              </p>
              <p>
                <strong>Multi-Dimensional Assessment:</strong> Our approach addresses three critical dimensions:
              </p>
              <ul className="solution-list">
                <li><strong>Astronomical Accuracy:</strong> Real-time orbital mechanics and physical parameter analysis</li>
                <li><strong>Impact Physics:</strong> Comprehensive damage modeling including thermal, overpressure, and seismic effects</li>
                <li><strong>Population Intelligence:</strong> High-resolution gridded population data for realistic casualty estimates</li>
                <li><strong>Mission Feasibility:</strong> Deflection energy calculations and success probability analysis</li>
              </ul>
            </div>
          </div>

          {/* Technical Implementation */}
          <div className="about-section-block">
            <h3>Technical Implementation</h3>
            
            <div className="implementation-categories">
              <div className="impl-category">
                <h4>Data Integration Layer</h4>
                <ul>
                  <li><strong>NASA SBDB API:</strong> Real-time asteroid orbital elements, physical parameters, and discovery data</li>
                  <li><strong>Geographic Intelligence:</strong> Land/ocean classification and impact location analysis</li>
                  <li><strong>Astronomical Catalogs:</strong> Integration with multiple NEO databases for comprehensive coverage</li>
                </ul>
              </div>

              <div className="impl-category">
                <h4>Physics Simulation Engine</h4>
                <ul>
                  <li><strong>Orbital Mechanics:</strong> Trajectory calculation, approach velocity determination, impact angle analysis</li>
                  <li><strong>Impact Physics:</strong> Airburst altitude modeling, crater formation scaling, seismic magnitude estimation</li>
                  <li><strong>Damage Assessment:</strong> Multi-zone thermal radiation and overpressure wave propagation</li>
                  <li><strong>Deflection Analysis:</strong> Energy requirement calculations, mission timeline optimization, success probability</li>
                </ul>
              </div>

              <div className="impl-category">
                <h4>Interactive Visualization</h4>
                <ul>
                  <li><strong>3D Earth Rendering:</strong> WebGL-based globe with real-time impact visualization using react-globe.gl</li>
                  <li><strong>Damage Zone Overlays:</strong> Multi-severity impact radii with color-coded severity indicators</li>
                  <li><strong>Parameter Manipulation:</strong> Real-time physics recalculation with dynamic asteroid property editing</li>
                  <li><strong>Scenario Comparison:</strong> Side-by-side analysis of multiple impact locations and deflection strategies</li>
                </ul>
              </div>

              <div className="impl-category">
                <h4>Technology Architecture</h4>
                <ul>
                  <li><strong>Frontend:</strong> React.js with Three.js for 3D visualization, responsive design for cross-platform access</li>
                  <li><strong>Backend:</strong> FastAPI with NumPy-based physics calculations, async processing for real-time analysis</li>
                  <li><strong>API Integration:</strong> RESTful architecture with NASA APIs, error handling, and data validation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Capabilities */}
          <div className="about-section-block">
            <h3>Core Capabilities</h3>
            <div className="capabilities-grid">
              <div className="capability-item">
                <div className="capability-content">
                  <strong>Precision Impact Modeling</strong>
                  <p>Advanced physics simulation incorporating atmospheric effects, material composition, and orbital mechanics for accurate impact predictions</p>
                </div>
              </div>
              <div className="capability-item">
                <div className="capability-content">
                  <strong>High-Resolution Population Analysis</strong>
                  <p>Gridded population datasets with ~100m spatial resolution for realistic casualty estimates and urban/rural impact differentiation</p>
                </div>
              </div>
              <div className="capability-item">
                <div className="capability-content">
                  <strong>Deflection Mission Planning</strong>
                  <p>Comprehensive energy calculations, timeline optimization, and success probability analysis for asteroid deflection missions</p>
                </div>
              </div>
              <div className="capability-item">
                <div className="capability-content">
                  <strong>Multi-Environment Impact Assessment</strong>
                  <p>Specialized modeling for ocean impacts including tsunami propagation and coastal population risk analysis</p>
                </div>
              </div>
            </div>
          </div>

          {/* Innovation & Impact */}
          <div className="about-section-block">
            <h3>Innovation & Impact</h3>
            <div className="about-text">
              <p>
                <strong>Democratizing Planetary Defense:</strong> By creating an accessible, web-based platform that integrates 
                complex astronomical and physics data, we're making advanced impact analysis available to researchers, 
                policymakers, and space agencies worldwide. Our system reduces the barrier to entry for planetary defense 
                research and enables rapid scenario analysis for emergency planning.
              </p>
              <p>
                <strong>Real-World Applications:</strong> From academic research and policy development to emergency preparedness 
                and space mission planning, Meteor Madness provides the analytical foundation for informed decision-making 
                in planetary defense scenarios.
              </p>
            </div>
          </div>

          <div className="team-info">
            <span>Built with passion for space exploration, computational physics, and safeguarding Earth's future</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;