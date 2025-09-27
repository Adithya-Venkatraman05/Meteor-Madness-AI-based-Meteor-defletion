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
  const [impactRadius, setImpactRadius] = useState(50); // Default radius in km
  const [circleData, setCircleData] = useState([]);

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
  }, []);

  // Update circle when radius changes (with debounce)
  useEffect(() => {
    if (selectedCoordinates) {
      const timeoutId = setTimeout(() => {
        updateCircleVisualization(
          parseFloat(selectedCoordinates.lat),
          parseFloat(selectedCoordinates.lng),
          impactRadius
        );
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [impactRadius, selectedCoordinates]);

  // Function to generate circle coordinates for a given center and radius
  const generateCircleCoordinates = (centerLat, centerLng, radiusKm) => {
    try {
      const points = [];
      const numPoints = 64; // Number of points to create smooth circle
      
      // Validate inputs
      if (isNaN(centerLat) || isNaN(centerLng) || isNaN(radiusKm) || radiusKm <= 0) {
        console.warn('Invalid input parameters for circle generation');
        return [];
      }
      
      // Convert to radians
      const centerLatRad = centerLat * Math.PI / 180;
      const centerLngRad = centerLng * Math.PI / 180;
      
      // Earth's radius in km
      const earthRadius = 6371;
      
      // Angular distance in radians
      const angularDistance = radiusKm / earthRadius;
      
      // Prevent circles that are too large
      if (angularDistance > Math.PI) {
        console.warn('Radius too large, clamping to maximum');
        angularDistance = Math.PI * 0.9; // 90% of max possible
      }
      
      for (let i = 0; i <= numPoints; i++) {
        const bearing = (i * 2 * Math.PI) / numPoints;
        
        // Calculate destination point using spherical trigonometry
        const destLatRad = Math.asin(
          Math.sin(centerLatRad) * Math.cos(angularDistance) +
          Math.cos(centerLatRad) * Math.sin(angularDistance) * Math.cos(bearing)
        );
        
        const destLngRad = centerLngRad + Math.atan2(
          Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatRad),
          Math.cos(angularDistance) - Math.sin(centerLatRad) * Math.sin(destLatRad)
        );
        
        // Convert back to degrees
        const destLat = destLatRad * 180 / Math.PI;
        const destLng = destLngRad * 180 / Math.PI;
        
        // Validate calculated coordinates
        if (isNaN(destLat) || isNaN(destLng)) {
          console.warn('Invalid coordinates calculated, skipping point');
          continue;
        }
        
        // Normalize longitude to [-180, 180]
        const normalizedLng = ((destLng + 540) % 360) - 180;
        
        // Clamp latitude to valid range
        const clampedLat = Math.max(-90, Math.min(90, destLat));
        
        points.push([normalizedLng, clampedLat]);
      }
      
      // Ensure the polygon is closed by making the last point equal to the first
      if (points.length > 0) {
        points.push([...points[0]]);
      }
      
      return [points]; // Return as array of polygon rings (GeoJSON format)
    } catch (error) {
      console.error('Error generating circle coordinates:', error);
      return [];
    }
  };

  // Function to update circle visualization
  const updateCircleVisualization = (lat, lng, radius) => {
    try {
      if (lat !== null && lng !== null && radius > 0) {
        const circleCoords = generateCircleCoordinates(lat, lng, radius);
        
        // Validate coordinates
        if (circleCoords && circleCoords.length > 0 && circleCoords[0].length > 3) {
          const polygonFeature = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: circleCoords
            },
            properties: {
              name: 'Impact Radius',
              radius: radius
            }
          };
          
          setCircleData([polygonFeature]);
        } else {
          console.warn('Invalid circle coordinates generated');
          setCircleData([]);
        }
      } else {
        setCircleData([]);
      }
    } catch (error) {
      console.error('Error updating circle visualization:', error);
      setCircleData([]);
    }
  };

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
    
    // Update circle visualization
    updateCircleVisualization(parseFloat(newCoordinates.lat), parseFloat(newCoordinates.lng), impactRadius);
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

      // Update circle visualization
      updateCircleVisualization(lat, lng, impactRadius);

      // Animate globe to the coordinates
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 2000);
      }
    }
  };

  const handleQuickLocationSelect = (location) => {
    setSelectedCoordinates({ lat: location.lat.toFixed(4), lng: location.lng.toFixed(4) });
    setManualCoords({ lat: location.lat.toFixed(4), lng: location.lng.toFixed(4) });
    
    // Update circle visualization
    updateCircleVisualization(location.lat, location.lng, impactRadius);
    
    // Animate to location
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: location.lat, lng: location.lng, altitude: 1.5 }, 2000);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedCoordinates) {
      // Store selected coordinates and radius for use in other components
      const impactData = {
        ...selectedCoordinates,
        radius: impactRadius,
        affectedArea: Math.round(Math.PI * impactRadius * impactRadius)
      };
      localStorage.setItem('impactLocation', JSON.stringify(impactData));
      navigate('/simulation/scenario-setup');
    }
  };

  const handleRadiusChange = (newRadius) => {
    setImpactRadius(newRadius);
    // No need to call updateCircleVisualization here since useEffect will handle it
  };

  const clearSelection = () => {
    setSelectedCoordinates(null);
    setManualCoords({ lat: '', lng: '' });
    setMarkers(prev => prev.filter(marker => marker.name !== 'Selected Location'));
    setCircleData([]);
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
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              atmosphereColor="rgba(100, 200, 255, 0.6)"
              atmosphereAltitude={0.25}
              
              pointsData={markers}
              pointAltitude={0.02}
              pointColor={(d) => d.color || '#ff0000ff'}
              pointRadius={(d) => d.size || 0.1}
              pointResolution={64}
              
              // Impact radius visualization
              polygonsData={circleData}
              polygonAltitude={0.015}
              polygonCapColor={() => 'rgba(255, 50, 50, 0.4)'}
              polygonSideColor={() => 'rgba(255, 80, 80, 0.3)'}
              polygonStrokeColor={() => '#ff3333'}
              polygonsTransitionDuration={300}
              polygonLabel={(d) => `
                <div class="globe-tooltip">
                  <strong>${d.properties?.name || 'Impact Area'}</strong><br/>
                  Radius: ${d.properties?.radius || 0} km<br/>
                  Area: ~${Math.round(Math.PI * (d.properties?.radius || 0) * (d.properties?.radius || 0)).toLocaleString()} km²
                </div>
              `}
              
              onGlobeClick={handleGlobeClick}
              
              // Globe settings
              width={800}
              height={600}
              backgroundColor="rgba(0,0,0,0)"
              
              // Animation settings
              animateIn={true}
              enablePointerInteraction={true}
              
              // Enhanced visual settings
              showAtmosphere={true}
              showGlobe={true}
              enableZoom={true}
              enablePan={true}
              
              // Performance settings
              rendererConfig={{
                precision: 'highp',
                alpha: true,
                antialias: true
              }}
              
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

            <div className="radius-input-section">
              <h3>Impact Radius</h3>
              <div className="radius-controls">
                <div className="input-group">
                  <label htmlFor="radius">Radius (1 - 500 km)</label>
                  <input
                    id="radius"
                    type="range"
                    min="1"
                    max="500"
                    step="1"
                    value={impactRadius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="radius-slider"
                  />
                  <div className="radius-display">
                    <span className="radius-value">{impactRadius} km</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={impactRadius}
                      onChange={(e) => handleRadiusChange(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                      className="radius-input"
                    />
                  </div>
                </div>
                {selectedCoordinates && (
                  <div className="radius-info">
                    <p>🎯 Impact area: ~{Math.round(Math.PI * impactRadius * impactRadius).toLocaleString()} km²</p>
                  </div>
                )}
              </div>
            </div>

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

            {selectedCoordinates && (
              <div className="selection-confirmation">
                <div className="selected-info">
                  <h3>Selected Impact Location</h3>
                  <p>Latitude: {selectedCoordinates.lat}°</p>
                  <p>Longitude: {selectedCoordinates.lng}°</p>
                  <p>Impact Radius: {impactRadius} km</p>
                  <p>Affected Area: ~{Math.round(Math.PI * impactRadius * impactRadius).toLocaleString()} km²</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobeScreen;