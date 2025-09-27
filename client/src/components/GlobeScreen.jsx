import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Globe from 'react-globe.gl';
import './GlobeScreen.css';

const GlobeScreen = () => {
  const navigate = useNavigate();
  const globeRef = useRef();
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [markers, setMarkers] = useState([]);
  const [errors, setErrors] = useState({});

  // Predefined locations for quick selection (including ocean locations)
  const quickLocations = [
    { name: 'New York, USA', lat: 40.7128, lng: -74.0060, color: '#ff6b35', type: 'land' },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278, color: '#4ecdc4', type: 'land' },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, color: '#45b7d1', type: 'land' },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, color: '#96ceb4', type: 'land' },
    { name: 'Pacific Ocean (Central)', lat: 0, lng: -140, color: '#0984e3', type: 'ocean' },
    { name: 'Atlantic Ocean (Mid)', lat: 30, lng: -40, color: '#74b9ff', type: 'ocean' },
    { name: 'Indian Ocean', lat: -20, lng: 80, color: '#00b894', type: 'ocean' },
    { name: 'Arctic Ocean', lat: 85, lng: 0, color: '#81ecec', type: 'ocean' },
    { name: 'Southern Ocean', lat: -60, lng: 0, color: '#00cec9', type: 'ocean' },
    { name: 'Mediterranean Sea', lat: 35, lng: 15, color: '#6c5ce7', type: 'ocean' },
    { name: 'Caribbean Sea', lat: 15, lng: -75, color: '#fd79a8', type: 'ocean' },
    { name: 'Bermuda Triangle', lat: 25, lng: -70, color: '#fdcb6e', type: 'ocean' }
  ];

  useEffect(() => {
    // Initialize with quick locations
    setMarkers(quickLocations);
    
    // Check for existing coordinates from ScenarioSetup
    const savedCoords = localStorage.getItem('currentImpactLocation');
    if (savedCoords) {
      try {
        const coordinates = JSON.parse(savedCoords);
        if (coordinates.lat && coordinates.lng) {
          const lat = parseFloat(coordinates.lat);
          const lng = parseFloat(coordinates.lng);
          
          // Set the coordinates
          setSelectedCoordinates({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
          setManualCoords({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
          
          // Add marker for existing coordinates
          setMarkers(prev => {
            const filtered = prev.filter(marker => marker.name !== 'Selected Location');
            return [...filtered, {
              name: 'Selected Location',
              lat,
              lng,
              color: '#ff0080',
              size: 1.0,
              type: 'selected'
            }];
          });
          
          // Animate globe to the coordinates after a short delay to ensure globe is loaded
          setTimeout(() => {
            if (globeRef.current) {
              globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
            }
          }, 500);
        }
        
        // Clear the saved coordinates after loading
        localStorage.removeItem('currentImpactLocation');
      } catch (error) {
        console.error('Error parsing saved coordinates:', error);
      }
    }
  }, []);

  const handleGlobeClick = (coords, event) => {
    const { lat, lng } = coords;
    const newCoordinates = { lat: lat.toFixed(4), lng: lng.toFixed(4) };
    
    setSelectedCoordinates(newCoordinates);
    setManualCoords({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
    
    // Add or update user marker
    setMarkers(prev => {
      const filtered = prev.filter(marker => marker.name !== 'Selected Location');
      return [...filtered, {
        name: 'Selected Location',
        lat: parseFloat(newCoordinates.lat),
        lng: parseFloat(newCoordinates.lng),
        color: '#ff0080',
        size: 1.0,
        type: 'selected'
      }];
    });
  };

  const validateCoordinates = () => {
    const newErrors = {};
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.lat = 'Latitude must be between -90 and 90';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.lng = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleManualCoordinatesSubmit = () => {
    if (validateCoordinates()) {
      const lat = parseFloat(manualCoords.lat);
      const lng = parseFloat(manualCoords.lng);
      
      setSelectedCoordinates({ lat: lat.toFixed(4), lng: lng.toFixed(4) });
      
      // Add or update user marker
      setMarkers(prev => {
        const filtered = prev.filter(marker => marker.name !== 'Selected Location');
        return [...filtered, {
          name: 'Selected Location',
          lat,
          lng,
          color: '#ff0080',
          size: 1.0,
          type: 'selected'
        }];
      });

      // Animate globe to the coordinates
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 2000);
      }
    }
  };

  const handleQuickLocationSelect = (location) => {
    setSelectedCoordinates({ lat: location.lat.toFixed(4), lng: location.lng.toFixed(4) });
    setManualCoords({ lat: location.lat.toFixed(4), lng: location.lng.toFixed(4) });
    
    // Animate to location
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: location.lat, lng: location.lng, altitude: 1.5 }, 2000);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedCoordinates) {
      // Store selected coordinates for use in other components
      localStorage.setItem('impactLocation', JSON.stringify(selectedCoordinates));
      navigate('/simulation/scenario-setup');
    }
  };

  const clearSelection = () => {
    setSelectedCoordinates(null);
    setManualCoords({ lat: '', lng: '' });
    setMarkers(prev => prev.filter(marker => marker.name !== 'Selected Location'));
    setErrors({});
  };

  return (
    <div className="globe-screen">
      <div className="globe-container">
        <div className="globe-header">
          <Link to="/simulation/scenario-setup" className="back-btn">
            ← Back to Scenario Setup
          </Link>
          <h1 className="globe-title">Select Impact Location</h1>
          <p className="globe-subtitle">Click anywhere on the globe (land or ocean) or enter coordinates manually</p>
        </div>

        <div className="globe-content">
          <div className="globe-wrapper">
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              
              pointsData={markers}
              pointAltitude={0.02}
              pointColor="color"
              pointRadius={(d) => d.size || 0.5}
              pointResolution={64}
              
              onGlobeClick={handleGlobeClick}
              
              // Globe settings
              width={800}
              height={600}
              backgroundColor="rgba(0,0,0,0)"
              
              // Animation settings
              animateIn={true}
              
              // Labels
              pointLabel={(d) => `
                <div class="globe-tooltip">
                  <strong>${d.name}</strong><br/>
                  ${d.type ? `<em>${d.type === 'ocean' ? '🌊 Ocean Location' : d.type === 'land' ? '🏙️ Land Location' : '📍 Selected Location'}</em><br/>` : ''}
                  Lat: ${d.lat.toFixed(4)}°<br/>
                  Lng: ${d.lng.toFixed(4)}°
                </div>
              `}
            />
          </div>

          <div className="controls-panel">
            <div className="coordinate-input-section">
              <h3>Manual Coordinates</h3>
              <div className="coordinate-inputs">
                <div className="input-group">
                  <label htmlFor="latitude">Latitude (-90 to 90)</label>
                  <input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    placeholder="e.g., 40.7128"
                    value={manualCoords.lat}
                    onChange={(e) => setManualCoords(prev => ({ ...prev, lat: e.target.value }))}
                    className={errors.lat ? 'error' : ''}
                  />
                  {errors.lat && <span className="error-message">{errors.lat}</span>}
                </div>
                
                <div className="input-group">
                  <label htmlFor="longitude">Longitude (-180 to 180)</label>
                  <input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    placeholder="e.g., -74.0060"
                    value={manualCoords.lng}
                    onChange={(e) => setManualCoords(prev => ({ ...prev, lng: e.target.value }))}
                    className={errors.lng ? 'error' : ''}
                  />
                  {errors.lng && <span className="error-message">{errors.lng}</span>}
                </div>
                
                <button 
                  className="set-coordinates-btn"
                  onClick={handleManualCoordinatesSubmit}
                >
                  Set Location
                </button>
              </div>
            </div>

            {/* Move selection-confirmation above quick-locations-section */}
            {selectedCoordinates && (
              <div className="selection-confirmation">
                <div className="selected-info">
                  <h3>Selected Impact Location</h3>
                  <p>Latitude: {selectedCoordinates.lat}°</p>
                  <p>Longitude: {selectedCoordinates.lng}°</p>
                </div>
                <div className="confirmation-actions">
                  <button className="clear-btn" onClick={clearSelection}>
                    Clear Selection
                  </button>
                  <button className="confirm-btn" onClick={handleConfirmLocation}>
                    Confirm Location →
                  </button>
                </div>
              </div>
            )}

            <div className="quick-locations-section">
              <h3>Quick Locations</h3>
              
              <div className="location-category">
                <h4 className="category-title">🏙️ Land Locations</h4>
                <div className="quick-locations-grid">
                  {quickLocations.filter(loc => loc.type === 'land').map((location, index) => (
                    <button
                      key={index}
                      className="quick-location-btn land-location"
                      onClick={() => handleQuickLocationSelect(location)}
                      style={{ borderColor: location.color }}
                    >
                      <span className="location-name">{location.name}</span>
                      <span className="location-coords">
                        {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="location-category">
                <h4 className="category-title">🌊 Ocean Locations</h4>
                <div className="quick-locations-grid">
                  {quickLocations.filter(loc => loc.type === 'ocean').map((location, index) => (
                    <button
                      key={index}
                      className="quick-location-btn ocean-location"
                      onClick={() => handleQuickLocationSelect(location)}
                      style={{ borderColor: location.color }}
                    >
                      <span className="location-name">{location.name}</span>
                      <span className="location-coords">
                        {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeScreen;