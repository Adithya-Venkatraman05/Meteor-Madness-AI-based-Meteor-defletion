import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CustomAsteroid.css';

const CustomAsteroid = () => {
  const navigate = useNavigate();
  const [asteroidData, setAsteroidData] = useState({
    diameter_km: 0.5,
    type: 'stone asteroid',
    velocity_kms: 25.0,
    angle_degrees: 45,
    orbit_type: 'elliptical',
    // Orbital elements (for manual orbit)
    a: '', // semimajor axis (AU)
    e: '', // eccentricity (0-1)
    i: '', // inclination (degrees)
    om: '', // longitude of ascending node (degrees)
    w: '', // argument of perihelion (degrees)
    ma: '' // mean anomaly (degrees)
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (asteroidData.diameter_km < 0.07 || asteroidData.diameter_km > 1.5) {
      newErrors.diameter_km = 'Diameter must be between 0.07 and 1.5 km';
    }

    if (!asteroidData.type) {
      newErrors.type = 'Asteroid type is required';
    }

    if (asteroidData.velocity_kms < 1 || asteroidData.velocity_kms > 100) {
      newErrors.velocity_kms = 'Velocity must be between 1 and 100 km/s';
    }

    if (asteroidData.angle_degrees < 5 || asteroidData.angle_degrees > 90) {
      newErrors.angle_degrees = 'Angle must be between 5 and 90 degrees';
    }

    if (asteroidData.orbit_type === 'manual') {
      const orbitalFields = ['a', 'e', 'i', 'om', 'w', 'ma'];
      orbitalFields.forEach(field => {
        if (!asteroidData[field] && asteroidData[field] !== 0) {
          newErrors[field] = 'This orbital element is required for manual orbit';
        }
      });

      if (asteroidData.e && (asteroidData.e < 0 || asteroidData.e >= 1)) {
        newErrors.e = 'Eccentricity must be between 0 and 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setAsteroidData(prev => ({
      ...prev,
      [field]: value
    }));

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
      const customAsteroid = {
        ...asteroidData,
        name: `Custom Asteroid ${Date.now()}`,
        fullName: `Custom ${asteroidData.type} (${asteroidData.diameter_km}km)`,
        hazardous: asteroidData.diameter_km > 0.14,
        description: `Custom ${asteroidData.type} with ${asteroidData.diameter_km}km diameter`
      };
      // Store custom asteroid data
      localStorage.setItem('selectedAsteroid', JSON.stringify(customAsteroid));
      navigate('/simulation/scenario-setup');
    }
  };



  return (
    <div className="custom-asteroid">
      <div className="custom-container">
        <div className="custom-header">
          <Link to="/simulation" className="back-btn">← Back to Mode Selection</Link>
          <h1 className="custom-title">Create Custom Asteroid</h1>
        </div>

        <form onSubmit={handleSubmit} className="custom-form">
          {/* Physical Properties */}
          <div className="form-section compact">
            <h3 className="section-title">Physical Properties</h3>
            
            <div className="controls-grid">
              {/* Diameter Slider */}
              <div className="control-item">
                <label>Diameter: <span className="value">{asteroidData.diameter_km} km</span></label>
                <input
                  type="range"
                  min="0.07"
                  max="1.5"
                  step="0.01"
                  value={asteroidData.diameter_km}
                  onChange={(e) => handleInputChange('diameter_km', parseFloat(e.target.value))}
                  className="compact-slider"
                />
                <div className="range-labels">
                  <span>0.07</span>
                  <span>1.5 km</span>
                </div>
                {errors.diameter_km && <span className="error-message">{errors.diameter_km}</span>}
              </div>

              {/* Velocity Slider */}
              <div className="control-item">
                <label>Velocity: <span className="value">{asteroidData.velocity_kms} km/s</span></label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="0.1"
                  value={asteroidData.velocity_kms}
                  onChange={(e) => handleInputChange('velocity_kms', parseFloat(e.target.value))}
                  className="compact-slider"
                />
                <div className="range-labels">
                  <span>1</span>
                  <span>100 km/s</span>
                </div>
                {errors.velocity_kms && <span className="error-message">{errors.velocity_kms}</span>}
              </div>

              {/* Impact Angle Slider */}
              <div className="control-item">
                <label>Angle: <span className="value">{asteroidData.angle_degrees}°</span></label>
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="1"
                  value={asteroidData.angle_degrees}
                  onChange={(e) => handleInputChange('angle_degrees', parseFloat(e.target.value))}
                  className="compact-slider"
                />
                <div className="range-labels">
                  <span>5° grazing</span>
                  <span>90° head-on</span>
                </div>
                {errors.angle_degrees && <span className="error-message">{errors.angle_degrees}</span>}
              </div>

              {/* Asteroid Type */}
              <div className="control-item">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={asteroidData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={`compact-select ${errors.type ? 'error' : ''}`}
                >
                  <option value="stone asteroid">Stone Asteroid</option>
                  <option value="iron asteroid">Iron Asteroid</option>
                  <option value="carbon asteroid">Carbon Asteroid</option>
                  <option value="comet">Comet</option>
                  <option value="gold asteroid">Gold Asteroid</option>
                </select>
                {errors.type && <span className="error-message">{errors.type}</span>}
              </div>
            </div>
          </div>

          {/* Orbital Properties */}
          <div className="form-section compact">
            <h3 className="section-title">Orbital Properties</h3>
            
            <div className="form-group">
              <label htmlFor="orbit-type">Orbit Type</label>
              <select
                id="orbit-type"
                value={asteroidData.orbit_type}
                onChange={(e) => handleInputChange('orbit_type', e.target.value)}
              >
                <option value="elliptical">Elliptical (Standard)</option>
                <option value="circular">Circular</option>
                <option value="manual">Manual (Define Elements)</option>
              </select>
            </div>

            {asteroidData.orbit_type === 'manual' && (
              <div className="orbital-elements">
                <h4 className="subsection-title">Orbital Elements</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="a">Semimajor Axis (AU)</label>
                    <input
                      id="a"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="e.g., 1.5"
                      value={asteroidData.a}
                      onChange={(e) => handleInputChange('a', e.target.value)}
                      className={errors.a ? 'error' : ''}
                    />
                    {errors.a && <span className="error-message">{errors.a}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="e">Eccentricity (0-1)</label>
                    <input
                      id="e"
                      type="number"
                      step="0.001"
                      min="0"
                      max="0.999"
                      placeholder="e.g., 0.2"
                      value={asteroidData.e}
                      onChange={(e) => handleInputChange('e', e.target.value)}
                      className={errors.e ? 'error' : ''}
                    />
                    {errors.e && <span className="error-message">{errors.e}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="i">Inclination (degrees)</label>
                    <input
                      id="i"
                      type="number"
                      step="0.1"
                      min="0"
                      max="180"
                      placeholder="e.g., 15.0"
                      value={asteroidData.i}
                      onChange={(e) => handleInputChange('i', e.target.value)}
                      className={errors.i ? 'error' : ''}
                    />
                    {errors.i && <span className="error-message">{errors.i}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="om">Longitude of Ascending Node (degrees)</label>
                    <input
                      id="om"
                      type="number"
                      step="0.1"
                      min="0"
                      max="360"
                      placeholder="e.g., 120.0"
                      value={asteroidData.om}
                      onChange={(e) => handleInputChange('om', e.target.value)}
                      className={errors.om ? 'error' : ''}
                    />
                    {errors.om && <span className="error-message">{errors.om}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="w">Argument of Perihelion (degrees)</label>
                    <input
                      id="w"
                      type="number"
                      step="0.1"
                      min="0"
                      max="360"
                      placeholder="e.g., 85.0"
                      value={asteroidData.w}
                      onChange={(e) => handleInputChange('w', e.target.value)}
                      className={errors.w ? 'error' : ''}
                    />
                    {errors.w && <span className="error-message">{errors.w}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="ma">Mean Anomaly (degrees)</label>
                    <input
                      id="ma"
                      type="number"
                      step="0.1"
                      min="0"
                      max="360"
                      placeholder="e.g., 45.0"
                      value={asteroidData.ma}
                      onChange={(e) => handleInputChange('ma', e.target.value)}
                      className={errors.ma ? 'error' : ''}
                    />
                    {errors.ma && <span className="error-message">{errors.ma}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="create-btn">
              Create Asteroid & Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomAsteroid;