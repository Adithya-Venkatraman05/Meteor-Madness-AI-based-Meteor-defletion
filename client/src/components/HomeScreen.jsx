import React from 'react';
import './HomeScreen.css';

const HomeScreen = () => {
  const handleSimulationClick = () => {
    // TODO: Navigate to simulation page
    console.log('Navigate to Simulation');
  };

  const handleCheckDataClick = () => {
    // TODO: Navigate to data page
    console.log('Navigate to Check Data');
  };

  return (
    <div className="home-screen">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">Meteor Madness</div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#simulation">Simulation</a>
          <a href="#data">Data</a>
          <a href="#about">About</a>
        </div>
      </nav>

      {/* Landing Section - Full Viewport */}
      <section id="home" className="landing-section">
        <div className="hero-section">
          <h1 className="main-title">Meteor Madness</h1>
          <p className="subtitle">Meteor Simulation System</p>
          
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
          <h2>About Us</h2>
          <div className="about-text">
            <p>
              Meteor Madness is an advanced AI-powered system designed to detect, analyze, 
              and simulate meteor deflection strategies. Our mission is to protect Earth 
              from potential asteroid impacts using cutting-edge technology and predictive modeling.
            </p>
            <p>
              Our cutting-edge simulation engine combines real astronomical data with 
              machine learning algorithms to provide accurate predictions and effective 
              deflection strategies for potentially hazardous asteroids.
            </p>
          </div>
          <div className="team-info">
            <span>Built with passion for space exploration and planetary defense</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeScreen;