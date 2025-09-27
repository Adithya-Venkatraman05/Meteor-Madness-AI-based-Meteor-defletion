import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ScenarioSetup.css';

// Mitigation strategies data
const mitigationStrategies = [
  {
    value: 'none',
    name: 'No Intervention',
    description: 'Observe natural trajectory',
    icon: '👁️'
  },
  {
    value: 'kinetic_impactor',
    name: 'Kinetic Impactor',
    description: 'High-speed spacecraft collision',
    icon: '🚀'
  },
  {
    value: 'gravity_tractor',
    name: 'Gravity Tractor',
    description: 'Gradual gravitational deflection',
    icon: '🛰️'
  },
  {
    value: 'nuclear',
    name: 'Nuclear Deflection',
    description: 'Nuclear device detonation',
    icon: '💥'
  },
  {
    value: 'ion_beam',
    name: 'Ion Beam Shepherd',
    description: 'Ion beam gradual deflection',
    icon: '⚡'
  }
];

const ScenarioSetup = () => {
  const navigate = useNavigate();
  const [scenarioData, setScenarioData] = useState({
    impact_location: {
      latitude: '',
      longitude: ''
    },
    mitigation_strategy: 'none',
    time_to_impact_years: 10,
    velocity_kms: 25.0,
    angle_degrees: 45
  });

  const [errors, setErrors] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Check for coordinates from globe screen on component load
  useEffect(() => {
    const savedLocation = localStorage.getItem('impactLocation');
    if (savedLocation) {
      try {
        const coordinates = JSON.parse(savedLocation);
        setScenarioData(prev => ({
          ...prev,
          impact_location: {
            latitude: coordinates.lat,
            longitude: coordinates.lng
          }
        }));
        // Clear the saved location to prevent reloading on refresh
        localStorage.removeItem('impactLocation');
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    }
  }, []);

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

    if (scenarioData.velocity_kms < 1 || scenarioData.velocity_kms > 100) {
      newErrors.velocity_kms = 'Velocity must be between 1 and 100 km/s';
    }

    if (scenarioData.angle_degrees < 5 || scenarioData.angle_degrees > 90) {
      newErrors.angle_degrees = 'Angle must be between 5 and 90 degrees';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (location) => {
    // Save the selected location coordinates to localStorage
    const coordinates = {
      lat: location.lat,
      lng: location.lng
    };
    localStorage.setItem('currentImpactLocation', JSON.stringify(coordinates));
    
    // Navigate to globe screen with pre-filled coordinates
    navigate('/simulation/globe');
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
      // Save current coordinates and navigate to globe screen for visual confirmation
      const coordinates = {
        lat: scenarioData.impact_location.latitude,
        lng: scenarioData.impact_location.longitude
      };
      localStorage.setItem('currentImpactLocation', JSON.stringify(coordinates));
      navigate('/simulation/globe');
    }
  };

  return (
    <div className="scenario-setup">
      <div className="scenario-container">
        <div className="scenario-header">
          <Link to="/simulation" className="back-btn">← Back to Mode Selection</Link>
          <h1 className="scenario-title">Scenario Setup</h1>
          <p className="scenario-subtitle">Define impact location and mitigation strategy</p>
          
          <div className="asteroid-summary">
            <h3>Selected Asteroid: Sample Asteroid</h3>
            <p>Configure your simulation parameters below</p>
          </div>
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

              <div className="map-selection">
                <h4>Or select visually:</h4>
                <button
                  type="button"
                  className="map-btn"
                  onClick={() => {
                    // Save current coordinates to localStorage for globe screen
                    const currentCoords = {
                      lat: scenarioData.impact_location.latitude,
                      lng: scenarioData.impact_location.longitude
                    };
                    if (currentCoords.lat && currentCoords.lng) {
                      localStorage.setItem('currentImpactLocation', JSON.stringify(currentCoords));
                    }
                    navigate('/simulation/globe');
                  }}
                >
                  🌍 Locate on Map
                </button>
              </div>
            </div>
          </div>

          {/* Impact Parameters */}
          <div className="form-section">
            <h3 className="section-title">Impact Parameters</h3>
            
            <div className="impact-parameters">
              {/* Velocity Parameter */}
              <div className="parameter-group">
                <label className="parameter-label">
                  Velocity: <span className="parameter-value">{scenarioData.velocity_kms} km/s</span>
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="0.1"
                    value={scenarioData.velocity_kms}
                    onChange={(e) => handleInputChange('velocity_kms', parseFloat(e.target.value))}
                    className="parameter-slider"
                  />
                </div>
                <div className="parameter-range">
                  <span>1 km/s</span>
                  <span>100 km/s</span>
                </div>
                {errors.velocity_kms && <span className="error-message">{errors.velocity_kms}</span>}
              </div>

              {/* Angle Parameter */}
              <div className="parameter-group">
                <label className="parameter-label">
                  Impact Angle: <span className="parameter-value">{scenarioData.angle_degrees}°</span>
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="1"
                    value={scenarioData.angle_degrees}
                    onChange={(e) => handleInputChange('angle_degrees', parseFloat(e.target.value))}
                    className="parameter-slider"
                  />
                </div>
                <div className="parameter-range">
                  <span>5° grazing</span>
                  <span>90° head-on</span>
                </div>
                {errors.angle_degrees && <span className="error-message">{errors.angle_degrees}</span>}
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