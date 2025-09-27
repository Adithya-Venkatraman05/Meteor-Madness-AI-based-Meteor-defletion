import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ModeSelection.css';

const ModeSelection = () => {
  const navigate = useNavigate();

  const handlePredefinedMode = () => {
    navigate('/simulation/predefined');
  };

  const handleCustomMode = () => {
    navigate('/simulation/custom');
  };

  return (
    <div className="mode-selection">
      <div className="mode-container">
        <div className="navigation-header">
          <Link to="/" className="back-btn">← Back to Home</Link>
        </div>
        <h1 className="mode-title">Choose Your Mission</h1>
        <p className="mode-subtitle">Select how you want to explore asteroid deflection</p>
        
        <div className="mode-buttons">
          <button className="mode-btn predefined-btn" onClick={handlePredefinedMode}>
            <div className="mode-icon">🌍</div>
            <h3>Explore Real Asteroids</h3>
            <p>Use NASA data to simulate real asteroid scenarios and deflection strategies</p>
            <div className="mode-features">
              <span>• Real orbital data</span>
              <span>• Historical asteroids</span>
              <span>• NASA SBDB integration</span>
            </div>
          </button>

          <button className="mode-btn custom-btn" onClick={handleCustomMode}>
            <div className="mode-icon">⚙️</div>
            <h3>Create Custom Scenario</h3>
            <p>Design your own asteroid with custom properties and orbital parameters</p>
            <div className="mode-features">
              <span>• Custom size & density</span>
              <span>• Define orbital elements</span>
              <span>• Full parameter control</span>
            </div>
          </button>
        </div>

        <div className="mode-info">
          <p>Both modes will guide you through scenario setup including impact location and mitigation strategies</p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;