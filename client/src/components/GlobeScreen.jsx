import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Globe from 'react-globe.gl';
import * as turf from '@turf/turf';
import './GlobeScreen.css';

const GlobeScreen = () => {
  const navigate = useNavigate();
  const globeRef = useRef();
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [markers, setMarkers] = useState([]);
  const [errors, setErrors] = useState({});
  const [impactRadius, setImpactRadius] = useState(50); // Default 50 km radius
  const [impactPolygons, setImpactPolygons] = useState([]);

  // Predefined locations for quick selection (including ocean locations)
  const quickLocations = [
    { name: 'New York, USA', lat: 40.7128, lng: -74.0060, color: '#ff6b35', type: 'land', size: 0.2 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278, color: '#4ecdc4', type: 'land', size: 0.2 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, color: '#45b7d1', type: 'land', size: 0.2 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, color: '#96ceb4', type: 'land', size: 0.2 },
    { name: 'Pacific Ocean (Central)', lat: 0, lng: -140, color: '#0984e3', type: 'ocean', size: 0.2 },
    { name: 'Atlantic Ocean (Mid)', lat: 30, lng: -40, color: '#74b9ff', type: 'ocean', size: 0.2 },
    { name: 'Indian Ocean', lat: -20, lng: 80, color: '#00b894', type: 'ocean', size: 0.2 },
    { name: 'Arctic Ocean', lat: 85, lng: 0, color: '#81ecec', type: 'ocean', size: 0.2 },
    { name: 'Southern Ocean', lat: -60, lng: 0, color: '#00cec9', type: 'ocean', size: 0.2 },
    { name: 'Mediterranean Sea', lat: 35, lng: 15, color: '#6c5ce7', type: 'ocean', size: 0.2 },
    { name: 'Caribbean Sea', lat: 15, lng: -75, color: '#fd79a8', type: 'ocean', size: 0.2 },
    { name: 'Bermuda Triangle', lat: 25, lng: -70, color: '#fdcb6e', type: 'ocean', size: 0.2 }
  ];

  // Function to create impact area circle
  const createImpactArea = (lat, lng, radiusKm) => {
    try {
      // Validate inputs
      if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm) || radiusKm <= 0) {
        console.log('Invalid inputs for impact area:', { lat, lng, radiusKm });
        return [];
      }

      // Clamp values to valid ranges
      const clampedLat = Math.max(-85, Math.min(85, lat)); // Avoid poles
      const clampedLng = ((lng + 180) % 360) - 180; // Normalize longitude
      
      console.log('Creating impact area:', { clampedLat, clampedLng, radiusKm });
      
      const center = turf.point([clampedLng, clampedLat]);
      
      // Limit radius to prevent globe wrapping (max 500km for safety)
      const effectiveRadius = Math.min(radiusKm, 500);
      
      const circle = turf.circle(center, effectiveRadius, {
        steps: 32,
        units: 'kilometers'
      });
      
      // Ensure coordinates are valid and don't wrap around globe
      const coords = circle.geometry.coordinates[0];
      
      // Validate the circle coordinates don't wrap around the globe
      const coordSpan = {
        minLat: Math.min(...coords.map(c => c[1])),
        maxLat: Math.max(...coords.map(c => c[1])),
        minLng: Math.min(...coords.map(c => c[0])),
        maxLng: Math.max(...coords.map(c => c[0]))
      };

      // Check for longitude wrapping (crossing 180/-180 boundary)
      const lngSpan = coordSpan.maxLng - coordSpan.minLng;
      const latSpan = coordSpan.maxLat - coordSpan.minLat;
      
      console.log('Coordinate spans:', { lngSpan, latSpan });
      
      if (lngSpan > 180 || latSpan > 90) {
        console.warn('Circle wraps around globe, skipping to prevent full coverage');
        return [];
      }

      // Additional check: if the circle is too large relative to coordinate system, skip it
      if (lngSpan > 60 || latSpan > 30) {
        console.warn('Circle too large, may cause rendering issues');
        return [];
      }

      // Filter and validate coordinates - be more restrictive
      const expectedRadius = effectiveRadius / 111; // Convert km to degrees (rough)
      const validCoords = coords.filter((coord, index) => {
        const [lon, latCoord] = coord;
        const isValid = lon >= -180 && lon <= 180 && latCoord >= -90 && latCoord <= 90;
        
        // Distance from center should be approximately the radius
        const distanceFromCenter = Math.sqrt(
          Math.pow(latCoord - clampedLat, 2) + 
          Math.pow((lon - clampedLng) * Math.cos(clampedLat * Math.PI / 180), 2)
        );
        
        const isReasonableDistance = distanceFromCenter <= expectedRadius * 1.2; // Allow 20% tolerance
        
        return isValid && isReasonableDistance;
      });

      // Ensure we have enough points for a valid polygon
      if (validCoords.length < 8) {
        console.warn('Not enough valid coordinates for safe polygon, got:', validCoords.length);
        return [];
      }

      // Ensure polygon is closed
      const firstCoord = validCoords[0];
      const lastCoord = validCoords[validCoords.length - 1];
      if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
        validCoords.push([...firstCoord]);
      }

      return [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [validCoords]
        },
        properties: {
          name: 'Impact Area',
          radius: effectiveRadius,
          centerLat: clampedLat,
          centerLng: clampedLng
        }
      }];
    } catch (error) {
      console.error('Error creating impact area:', error);
      return [];
    }
  };

  // Function to calculate dynamic pin size based on impact radius
  const calculatePinSize = (radiusKm) => {
    // Pin should be smaller than the impact radius but visible
    // Scale: larger radius = larger pin, but with reasonable limits
    const baseSize = Math.min(0.5, radiusKm / 200); // Scale factor
    const minSize = 0.1; // Minimum visible size
    const maxSize = 0.4; // Maximum size to prevent overly large pins
    return Math.max(minSize, Math.min(maxSize, baseSize));
  };

  // Function to create arrow/line data pointing to small impact areas
  const createPointerArcs = () => {
    // Disable arcs since we're using the emoji pointer directly next to coordinates
    return [];
  };

  // Function to create label data for small impact areas
  const createPointerLabels = () => {
    // Removed pointer emoji as requested
    return [];
  };

  useEffect(() => {
    // Initialize with quick locations
    setMarkers(quickLocations);
    
    // Check for existing coordinates from ScenarioSetup
    const savedCoords = localStorage.getItem('currentImpactLocation');
    if (savedCoords) {
      try {
        const coordinates = JSON.parse(savedCoords);
        if (coordinates.lat && coordinates.lng) {
          const existingLat = parseFloat(coordinates.lat);
          const existingLng = parseFloat(coordinates.lng);
          
          // Set the coordinates
          setSelectedCoordinates({ lat: existingLat.toFixed(4), lng: existingLng.toFixed(4) });
          setManualCoords({ lat: existingLat.toFixed(4), lng: existingLng.toFixed(4) });
          
          // Add marker for existing coordinates
          setMarkers(prev => {
            const filtered = prev.filter(marker => marker.name !== 'Selected Location');
            return [...filtered, {
              name: 'Selected Location',
              lat: existingLat,
              lng: existingLng,
              color: '#ff0080',
              size: calculatePinSize(impactRadius),
              type: 'selected'
            }];
          });

          // Create impact area for existing coordinates
          const impactArea = createImpactArea(existingLat, existingLng, impactRadius);
          setImpactPolygons(impactArea);
          
          // Animate globe to the coordinates after a short delay to ensure globe is loaded
          setTimeout(() => {
            if (globeRef.current) {
              globeRef.current.pointOfView({ lat: existingLat, lng: existingLng, altitude: 1.5 }, 1000);
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

  // Update markers and pointers when impact radius changes
  useEffect(() => {
    if (selectedCoordinates) {
      // Update selected location marker size
      setMarkers(prev => {
        const updated = prev.map(marker => {
          if (marker.name === 'Selected Location') {
            return { ...marker, size: calculatePinSize(impactRadius) };
          }
          return marker;
        });
        return updated;
      });

      // Update impact area
      const lat = parseFloat(selectedCoordinates.lat);
      const lng = parseFloat(selectedCoordinates.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const impactArea = createImpactArea(lat, lng, impactRadius);
        setImpactPolygons(impactArea);
      }
    }
  }, [impactRadius, selectedCoordinates]);

  const handleGlobeClick = (coords, event) => {
    const { lat: clickLat, lng: clickLng } = coords;
    const newCoordinates = { lat: clickLat.toFixed(4), lng: clickLng.toFixed(4) };
    
    setSelectedCoordinates(newCoordinates);
    setManualCoords({ lat: clickLat.toFixed(4), lng: clickLng.toFixed(4) });
    
    // Add or update user marker
    setMarkers(prev => {
      const filtered = prev.filter(marker => marker.name !== 'Selected Location');
      return [...filtered, {
        name: 'Selected Location',
        lat: parseFloat(newCoordinates.lat),
        lng: parseFloat(newCoordinates.lng),
        color: '#ff0080',
        size: calculatePinSize(impactRadius),
        type: 'selected'
      }];
    });

    // Create impact area
    const impactLat = parseFloat(newCoordinates.lat);
    const impactLng = parseFloat(newCoordinates.lng);
    if (!isNaN(impactLat) && !isNaN(impactLng)) {
      const impactArea = createImpactArea(impactLat, impactLng, impactRadius);
      setImpactPolygons(impactArea);
    }
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
      const manualLat = parseFloat(manualCoords.lat);
      const manualLng = parseFloat(manualCoords.lng);
      
      setSelectedCoordinates({ lat: manualLat.toFixed(4), lng: manualLng.toFixed(4) });
      
      // Add or update user marker
      setMarkers(prev => {
        const filtered = prev.filter(marker => marker.name !== 'Selected Location');
        return [...filtered, {
          name: 'Selected Location',
          lat: manualLat,
          lng: manualLng,
          color: '#ff0080',
          size: calculatePinSize(impactRadius),
          type: 'selected'
        }];
      });

      // Create impact area
      const impactArea = createImpactArea(manualLat, manualLng, impactRadius);
      setImpactPolygons(impactArea);

      // Animate globe to the coordinates
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: manualLat, lng: manualLng, altitude: 1.5 }, 2000);
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

  const handleRadiusChange = (newRadius) => {
    setImpactRadius(newRadius);
    
    // Update marker size based on new radius
    if (selectedCoordinates) {
      setMarkers(prev => {
        return prev.map(marker => {
          if (marker.name === 'Selected Location') {
            return { ...marker, size: calculatePinSize(newRadius) };
          }
          return marker;
        });
      });
    }
    
    // Update impact area if coordinates are selected
    if (selectedCoordinates) {
      const radiusLat = parseFloat(selectedCoordinates.lat);
      const radiusLng = parseFloat(selectedCoordinates.lng);
      if (!isNaN(radiusLat) && !isNaN(radiusLng)) {
        const impactArea = createImpactArea(radiusLat, radiusLng, newRadius);
        setImpactPolygons(impactArea);
      }
    }
  };

  const clearSelection = () => {
    setSelectedCoordinates(null);
    setManualCoords({ lat: '', lng: '' });
    setMarkers(prev => prev.filter(marker => marker.name !== 'Selected Location'));
    setImpactPolygons([]);
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
              
              pointsData={[...markers, ...createPointerLabels()]}
              pointAltitude={0.01}
              pointColor="color"
              pointRadius={(d) => d.size || 0.2}
              pointResolution={32}
              
              // Arcs for pointing to small impact areas
              arcsData={createPointerArcs()}
              arcColor="color"
              arcStroke={3}
              arcDashLength={0.3}
              arcDashGap={0.1}
              arcDashAnimateTime={2000}
              arcLabel={(d) => `Pointing to ${impactRadius}km impact zone`}
              
              // Polygons for impact area - show valid impact circles
              polygonsData={impactPolygons.filter(p => p && p.geometry && p.geometry.coordinates && p.geometry.coordinates[0] && p.geometry.coordinates[0].length > 8)}
              polygonAltitude={0.005}
              polygonCapColor={() => 'rgba(255, 50, 50, 0.7)'}
              polygonSideColor={() => 'rgba(255, 100, 100, 0.4)'}
              polygonStrokeColor={() => '#cc0000'}
              polygonStrokeWidth={2}
              polygonsTransitionDuration={500}
              polygonLabel={(d) => `
                <div class="globe-tooltip">
                  <strong>${d.properties.name}</strong><br/>
                  Impact Radius: ${d.properties.radius} km<br/>
                  Center: ${d.properties.centerLat?.toFixed(4)}°, ${d.properties.centerLng?.toFixed(4)}°<br/>
                  Area: ${Math.round(Math.PI * Math.pow(d.properties.radius, 2))} km²
                </div>
              `}
              
              onGlobeClick={handleGlobeClick}
              
              // Globe settings
              width={800}
              height={600}
              backgroundColor="rgba(0,0,0,0)"
              
              // Animation settings
              animateIn={true}
              
              // Labels for points and pointers
              pointLabel={(d) => {
                if (d.type === 'pointer-label') {
                  return `<div class="pointer-label-tooltip" style="background: #FF4400; color: white; padding: 6px; border-radius: 5px; font-weight: bold; text-align: center; border: 2px solid #CC3300; font-size: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">Small Impact Zone<br/>${impactRadius}km radius</div>`;
                }
                if (d.type === 'pointer') {
                  return `<div class="pointer-tooltip" style="background: orange; color: white; padding: 5px; border-radius: 3px;">${d.label}</div>`;
                }
                return `
                  <div class="globe-tooltip">
                    <strong>${d.name}</strong><br/>
                    ${d.type ? `<em>${d.type === 'ocean' ? '🌊 Ocean Location' : d.type === 'land' ? '🏙️ Land Location' : d.type === 'selected' ? '📍 Selected Location' : 'Impact Point'}</em><br/>` : ''}
                    Lat: ${d.lat.toFixed(4)}°<br/>
                    Lng: ${d.lng.toFixed(4)}°
                  </div>
                `;
              }}
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

            <div className="impact-radius-section">
              <h3>Impact Radius</h3>
              <div className="radius-control">
                <div className="input-group">
                  <label htmlFor="impact-radius">Radius (km): <span className="radius-value">{impactRadius}</span></label>
                  <input
                    id="impact-radius"
                    type="range"
                    min="1"
                    max="200"
                    step="1"
                    value={impactRadius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                    className="radius-slider"
                  />
                  <div className="radius-range">
                    <span>1 km</span>
                    <span>200 km</span>
                  </div>
                </div>
                
                <div className="radius-input">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    step="1"
                    value={impactRadius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value) || 1)}
                    className="radius-number-input"
                    placeholder="Enter radius"
                  />
                  <span className="radius-unit">km</span>
                </div>
                
                {selectedCoordinates && (
                  <div className="impact-info">
                    <p><strong>Impact Area:</strong> {Math.round(Math.PI * Math.pow(impactRadius, 2))} km²</p>
                    <p><strong>Diameter:</strong> {impactRadius * 2} km</p>
                  </div>
                )}
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