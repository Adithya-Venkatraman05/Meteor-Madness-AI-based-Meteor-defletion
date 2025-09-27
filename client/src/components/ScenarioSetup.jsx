import React, { useState } from 'react';
import './ScenarioSetup.css';

const ScenarioSetup = ({ asteroidData, onScenarioComplete, onBack }) => {
  const [scenarioData, setScenarioData] = useState({
    impact_location: {
      latitude: '',
      longitude: ''
    },
    mitigation_strategy: 'none',
    time_to_impact_years: 10
  });

  const [errors, setErrors] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Predefined locations for quick selection
  const quickLocations = [
    { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
    { name: 'Rio de Janeiro, Brazil', lat: -22.9068, lng: -43.1729 },
    { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
    { name: 'Pacific Ocean', lat: 0, lng: -140 }
  ];


  const validateForm = () => {
    const newErrors = {};

    if (!scenarioData.impact_location.latitude && scenarioData.impact_location.latitude !== 0) {
      newErrors.latitude = 'Latitude is required';
    } else if (scenarioData.impact_location.latitude < -90 || scenarioData.impact_location.latitude > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (!scenarioData.impact_location.longitude && scenarioData.impact_location.longitude !== 0) {
      newErrors.longitude = 'Longitude is required';
    } else if (scenarioData.impact_location.longitude < -180 || scenarioData.impact_location.longitude > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    if (!scenarioData.time_to_impact_years || scenarioData.time_to_impact_years < 1) {
      newErrors.time_to_impact_years = 'Time to impact must be at least 1 year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setScenarioData(prev => ({
      ...prev,
      impact_location: {
        latitude: location.lat,
        longitude: location.lng
      }
    }));
    
    // Clear location errors
    setErrors(prev => ({
      ...prev,
      latitude: undefined,
      longitude: undefined
    }));
  };

  const handleInputChange = (field, value) => {
    if (field === 'latitude' || field === 'longitude') {
      setScenarioData(prev => ({
        ...prev,
        impact_location: {
          ...prev.impact_location,
          [field]: value
        }
      }));
      setSelectedLocation(null); // Clear selected location if manually entering coordinates
    } else {
      setScenarioData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const completeScenario = {
        asteroid: asteroidData,
        scenario: scenarioData
      };
      onScenarioComplete(completeScenario);
    }
  };

  return (
    <div className="scenario-setup">
      <div className="scenario-container">
        <div className="scenario-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1 className="scenario-title">Scenario Setup</h1>
          <p className="scenario-subtitle">Define impact location and mitigation strategy</p>
          
          {asteroidData && (
            <div className="asteroid-summary">
              <h3>Selected Asteroid: {asteroidData.name || asteroidData.fullName}</h3>
              {asteroidData.diameter !== undefined && (
                <p>Diameter: {asteroidData.diameter || asteroidData.diameter_km} km</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="scenario-form">
          {/* Impact Location */}
          <div className="form-section">
            <h3 className="section-title">Impact Location</h3>
            
            <div className="location-selection">
              <div className="quick-locations">
                <h4>Quick Select:</h4>
                <div className="location-grid">
                  {quickLocations.map((location, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`location-btn ${selectedLocation?.name === location.name ? 'selected' : ''}`}
                      onClick={() => handleLocationSelect(location)}
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="manual-coordinates">
                <h4>Or enter coordinates manually:</h4>
                <div className="coordinate-inputs">
                  <div className="form-group">
                    <label htmlFor="latitude">Latitude (-90 to 90)</label>
                    <input
                      id="latitude"
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                      placeholder="e.g., 40.7128"
                      value={scenarioData.impact_location.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      className={errors.latitude ? 'error' : ''}
                    />
                    {errors.latitude && <span className="error-message">{errors.latitude}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="longitude">Longitude (-180 to 180)</label>
                    <input
                      id="longitude"
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                      placeholder="e.g., -74.0060"
                      value={scenarioData.impact_location.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      className={errors.longitude ? 'error' : ''}
                    />
                    {errors.longitude && <span className="error-message">{errors.longitude}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mitigation Strategy */}
          <div className="form-section">
            <h3 className="section-title">Mitigation Strategy</h3>
            
            <div className="strategy-grid">
              {mitigationStrategies.map((strategy) => (
                <div
                  key={strategy.value}
                  className={`strategy-card ${scenarioData.mitigation_strategy === strategy.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('mitigation_strategy', strategy.value)}
                >
                  <div className="strategy-icon">{strategy.icon}</div>
                  <h4>{strategy.name}</h4>
                  <p>{strategy.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Time to Impact */}
          <div className="form-section">
            <h3 className="section-title">Timeline</h3>
            
            <div className="form-group">
              <label htmlFor="time-to-impact">Time to Impact (years)</label>
              <input
                id="time-to-impact"
                type="number"
                min="1"
                max="100"
                placeholder="10"
                value={scenarioData.time_to_impact_years}
                onChange={(e) => handleInputChange('time_to_impact_years', e.target.value)}
                className={errors.time_to_impact_years ? 'error' : ''}
              />
              {errors.time_to_impact_years && <span className="error-message">{errors.time_to_impact_years}</span>}
              <small>How many years until the potential impact?</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="start-simulation-btn">
              Start Simulation →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScenarioSetup;