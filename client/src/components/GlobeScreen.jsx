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
  
  // Physics analysis state
  const [physicsResponse, setPhysicsResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [asteroidParameters, setAsteroidParameters] = useState({});
  const [scenarioData, setScenarioData] = useState({
    velocity_kms: 25.0,
    angle_degrees: 45
  });
  
  // Tab management
  const [activeTab, setActiveTab] = useState('results');
  
  // Editable parameters for rerun simulation
  const [editableParams, setEditableParams] = useState({
    diameter: '',
    mass: '',
    density: '',
    composition: '',
    velocity_kms: 25.0,
    angle_degrees: 45,
    impact_latitude: '',
    impact_longitude: '',
    population_density: 100
  });

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
      let angularDistance = radiusKm / earthRadius;
      
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
        
        // Validate final coordinates
        if (Math.abs(normalizedLng) <= 180 && Math.abs(clampedLat) <= 90) {
          points.push([normalizedLng, clampedLat]);
        } else {
          console.warn('Invalid final coordinates:', { normalizedLng, clampedLat });
        }
      }
      
      // Ensure the polygon is closed by making the last point equal to the first
      if (points.length > 0) {
        points.push([...points[0]]);
      }
      
      console.log(`🗺️ Generated ${points.length} points for ${radiusKm}km radius at [${centerLat}, ${centerLng}]`);
      console.log('📍 Sample points:', points.slice(0, 3));
      
      return [points]; // Return as array of polygon rings (GeoJSON format)
    } catch (error) {
      console.error('Error generating circle coordinates:', error);
      return [];
    }
  };

  useEffect(() => {
    // Initialize with quick locations
    setMarkers(quickLocations);
    
    // Load stored asteroid parameters
    const storedParams = localStorage.getItem('asteroidParameters');
    if (storedParams) {
      try {
        setAsteroidParameters(JSON.parse(storedParams));
      } catch (error) {
        console.error('Error loading asteroid parameters:', error);
      }
    }
    
    // Load simulation data from ScenarioSetup (includes physics response)
    const simulationData = localStorage.getItem('simulationData');
    console.log('🔍 Raw simulation data from localStorage:', simulationData);
    if (simulationData) {
      try {
        const data = JSON.parse(simulationData);
        console.log('📊 Parsed simulation data from ScenarioSetup:', data);
        console.log('🧪 Physics analysis exists:', !!data.physics_analysis);
        console.log('📍 Impact location exists:', !!data.impact_location);
        
        // Set physics response if available
        if (data.physics_analysis) {
          console.log('✅ Loading physics analysis from ScenarioSetup');
          setPhysicsResponse(data.physics_analysis);
        }
        
        // Set coordinate data if available
        if (data.impact_location?.latitude && data.impact_location?.longitude) {
          const coordinates = {
            lat: parseFloat(data.impact_location.latitude).toFixed(4),
            lng: parseFloat(data.impact_location.longitude).toFixed(4)
          };
          setSelectedCoordinates(coordinates);
          setManualCoords(coordinates);
          
          // Add marker for the location
          setMarkers(prev => {
            const filtered = prev.filter(marker => marker.name !== 'Selected Location');
            return [...filtered, {
              name: 'Selected Location',
              lat: parseFloat(coordinates.lat),
              lng: parseFloat(coordinates.lng),
              color: '#ff0080',
              size: 0.1,
              type: 'selected'
            }];
          });
          
          // Update visualization with all damage zones including thermal burns
          if (data.physics_analysis?.damage_analysis?.impact_radii_by_severity) {
            const lat = parseFloat(coordinates.lat);
            const lng = parseFloat(coordinates.lng);
            console.log('� Calling updateHazardousAreaVisualization with all zones from coordinates section');
            updateHazardousAreaVisualization(lat, lng, data.physics_analysis.damage_analysis.impact_radii_by_severity);
          } else {
            console.log('❌ No damage analysis found in physics data');
          }
        }
        
        // Set asteroid parameters if available
        if (data.asteroid_parameters) {
          setAsteroidParameters(data.asteroid_parameters);
          
          // Populate editable parameters for rerun simulation
          setEditableParams(prev => ({
            ...prev,
            diameter: data.asteroid_parameters.diameter || '',
            mass: data.asteroid_parameters.mass || '',
            density: data.asteroid_parameters.density || '',
            composition: data.asteroid_parameters.composition || '',
            velocity_kms: data.velocity_kms || 25.0,
            angle_degrees: data.angle_degrees || 45,
            impact_latitude: data.impact_location?.latitude || '',
            impact_longitude: data.impact_location?.longitude || ''
          }));
        }
        
        // Set scenario data if available
        if (data.velocity_kms || data.angle_degrees) {
          setScenarioData({
            velocity_kms: data.velocity_kms || 25.0,
            angle_degrees: data.angle_degrees || 45
          });
        }
        
      } catch (error) {
        console.error('Error loading simulation data:', error);
      }
    }
    
    // Load current impact location (fallback)
    const currentLocation = localStorage.getItem('currentImpactLocation');
    if (currentLocation && !simulationData) {
      try {
        const coords = JSON.parse(currentLocation);
        setSelectedCoordinates({ 
          lat: coords.lat.toFixed(4), 
          lng: coords.lng.toFixed(4) 
        });
        setManualCoords({ 
          lat: coords.lat.toFixed(4), 
          lng: coords.lng.toFixed(4) 
        });
      } catch (error) {
        console.error('Error loading current location:', error);
      }
    }
  }, []);
  
  // Position globe to show impact coordinates when they're loaded
  useEffect(() => {
    if (selectedCoordinates && globeRef.current) {
      const lat = parseFloat(selectedCoordinates.lat);
      const lng = parseFloat(selectedCoordinates.lng);
      
      // Animate globe to the impact coordinates with a good viewing altitude
      setTimeout(() => {
        if (globeRef.current) {
          globeRef.current.pointOfView({ 
            lat: lat, 
            lng: lng, 
            altitude: 1.5 
          }, 2000); // 2 second animation
        }
      }, 500); // Small delay to ensure globe is fully initialized
    }
  }, [selectedCoordinates]);
  
  // Debug circleData changes
  useEffect(() => {
    console.log('🔄 circleData updated:', circleData);
    console.log('📏 circleData length:', circleData.length);
    if (circleData.length > 0) {
      console.log('🎯 First polygon properties:', circleData[0].properties);
      console.log('📐 First polygon coordinates sample:', circleData[0].geometry.coordinates[0]?.slice(0, 3));
      console.log('🗺️ Full polygon structure:', JSON.stringify(circleData[0], null, 2));
    }
  }, [circleData]);
  
  // Test function to create a simple visible polygon
  
  
  // Note: Physics analysis is now loaded from ScenarioSetup via localStorage
  // If user wants to re-analyze, they can do so manually

  // Update circle when radius changes (with debounce)
  useEffect(() => {
    if (selectedCoordinates && !physicsResponse) {
      const timeoutId = setTimeout(() => {
        updateCircleVisualization(
          parseFloat(selectedCoordinates.lat),
          parseFloat(selectedCoordinates.lng),
          impactRadius
        );
      }, 100); // 100ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [impactRadius, selectedCoordinates, physicsResponse]);

  // Function to perform physics analysis
  const performPhysicsAnalysis = async () => {
    if (!selectedCoordinates || !asteroidParameters.diameter) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const apiParams = new URLSearchParams();
      
      // Required parameters
      apiParams.append('diameter', asteroidParameters.diameter.toString());
      
      // Optional parameters from asteroid data
      if (asteroidParameters.mass) apiParams.append('mass', asteroidParameters.mass.toString());
      if (asteroidParameters.density) apiParams.append('density', asteroidParameters.density.toString());
      if (asteroidParameters.composition) apiParams.append('composition', asteroidParameters.composition);
      
      // Impact parameters
      if (scenarioData.velocity_kms) apiParams.append('velocity', (scenarioData.velocity_kms * 1000).toString());
      if (scenarioData.angle_degrees) apiParams.append('angle', scenarioData.angle_degrees.toString());
      
      // Impact location coordinates
      apiParams.append('impact_latitude', selectedCoordinates.lat.toString());
      apiParams.append('impact_longitude', selectedCoordinates.lng.toString());
      apiParams.append('population_density', editableParams.population_density.toString());
      
      const apiUrl = `http://localhost:8001/physics/impact-analysis?${apiParams}`;
      console.log('🌐 Physics API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Physics analysis response:', data);
      
      setPhysicsResponse(data);
      
      // Update visualization with damage zones
      if (data.damage_analysis?.impact_radii_by_severity) {
        updateHazardousAreaVisualization(parseFloat(selectedCoordinates.lat), parseFloat(selectedCoordinates.lng), data.damage_analysis.impact_radii_by_severity);
      }
      
    } catch (error) {
      console.error('💥 Physics analysis failed:', error);
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Function to update hazardous area visualization with multiple damage zones
  const updateHazardousAreaVisualization = (lat, lng, damageZones) => {
    console.log('🎯 updateHazardousAreaVisualization called with:', { lat, lng, zoneCount: damageZones?.length });
    console.log('🔍 Damage zones data:', damageZones);
    
    try {
      const polygons = [];
      
      // If no damage zones provided, create a fallback thermal zone
      if (!damageZones || damageZones.length === 0) {
        console.log('⚠️ No damage zones provided, creating fallback thermal zone');
        const fallbackRadius = 50; // 50km default radius for visibility
        const circleCoords = generateCircleCoordinates(lat, lng, fallbackRadius);
        
        if (circleCoords && circleCoords.length > 0 && circleCoords[0].length > 3) {
          polygons.push({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: circleCoords
            },
            properties: {
              name: 'Thermal Burns Hazard Zone (Fallback)',
              radius: fallbackRadius,
              severity: 5,
              color: '#ff6b35',
              effectType: 'thermal',
              description: 'Estimated thermal burns hazard area'
            }
          });
        }
      } else {
        damageZones.forEach((zone, index) => {
          let radiusKm = zone.radius_km || 0;
          
          console.log(`📊 Processing zone ${index + 1}:`, { 
            description: zone.description, 
            effect_type: zone.effect_type, 
            original_radius_km: zone.radius_km,
            capped_radius_km: radiusKm,
            color: zone.color 
          });
          
          if (radiusKm > 0) {
            const circleCoords = generateCircleCoordinates(lat, lng, radiusKm);
            
            if (circleCoords && circleCoords.length > 0 && circleCoords[0].length > 3) {
              const polygon = {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: circleCoords
                },
                properties: {
                  name: zone.description || `Damage Zone ${index + 1}`,
                  radius: radiusKm,
                  severity: zone.severity_level || 0,
                  color: zone.effect_type === 'thermal' || zone.type === 'thermal_burns' ? '#ff6b35' : zone.color || '#ff3333',
                  effectType: zone.effect_type || zone.type || 'unknown',
                  description: zone.description || 'Damage zone'
                }
              };
              
              console.log(`✅ Added polygon for zone ${index + 1}:`, polygon.properties.name);
              polygons.push(polygon);
            } else {
              console.log(`❌ Failed to generate coordinates for zone ${index + 1}`);
            }
          } else {
            console.log(`⚠️ Zone ${index + 1} has invalid radius: ${radiusKm}`);
          }
        });
      }
      
      console.log('🎭 Final polygons array:', { count: polygons.length, polygons });
      console.log('🌍 Setting circleData for Globe component:', polygons);
      setCircleData(polygons);
    } catch (error) {
      console.error('💥 Error updating hazardous area visualization:', error);
      setCircleData([]);
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
    
    // Update editable parameters with new coordinates
    setEditableParams(prev => ({
      ...prev,
      impact_latitude: lat.toFixed(4),
      impact_longitude: lng.toFixed(4)
    }));
    
    // Add or update user marker
    setMarkers(prev => {
      const filtered = prev.filter(marker => marker.name !== 'Selected Location');
      return [...filtered, {
        name: 'Selected Location',
        lat: parseFloat(newCoordinates.lat),
        lng: parseFloat(newCoordinates.lng),
        color: '#ff0080',
        size: 0.3,
        type: 'selected'
      }];
    });
    
    // Clear physics response when coordinates change
    setPhysicsResponse(null);
    setAnalysisError(null);
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
          size: 0.3,
          type: 'selected'
        }];
      });

      // Clear physics response when coordinates change
      setPhysicsResponse(null);
      setAnalysisError(null);

      // Animate globe to the coordinates
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 2000);
      }
    }
  };

  const handleQuickLocationSelect = (location) => {
    setSelectedCoordinates({ lat: location.lat.toFixed(4), lng: location.lng.toFixed(4) });
    setManualCoords({ lat: location.lat.toFixed(4), lng: location.lng.toFixed(4) });
    
    // Update editable parameters with new coordinates
    setEditableParams(prev => ({
      ...prev,
      impact_latitude: location.lat.toFixed(4),
      impact_longitude: location.lng.toFixed(4)
    }));
    
    // Clear physics response when coordinates change
    setPhysicsResponse(null);
    setAnalysisError(null);
    
    // Animate to location
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: location.lat, lng: location.lng, altitude: 1.5 }, 2000);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedCoordinates) {
      // Store selected coordinates for use in other components
      const impactData = {
        ...selectedCoordinates,
        radius: impactRadius,
        affectedArea: Math.round(Math.PI * impactRadius * impactRadius)
      };
      localStorage.setItem('impactLocation', JSON.stringify(impactData));
      navigate('/simulation/scenario-setup');
    }
  };

  const clearSelection = () => {
    setSelectedCoordinates(null);
    setManualCoords({ lat: '', lng: '' });
    setMarkers(prev => prev.filter(marker => marker.name !== 'Selected Location'));
    setCircleData([]);
    setErrors({});
    setPhysicsResponse(null);
    setAnalysisError(null);
  };

  return (
    <div className="globe-screen">
      <div className="globe-container">
        <div className="globe-header">
          <Link to="/simulation/scenario-setup" className="back-btn">
            ← Back to Scenario Setup
          </Link>
          <h1 className="globe-title">Impact Analysis Visualization</h1>
          <p className="globe-subtitle">Select location and view real-time physics analysis</p>
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
              
              // Hazardous area visualization with multiple damage zones
              polygonsData={circleData}
              polygonAltitude={0.01} // Fixed altitude for better visibility
              polygonCapColor={(d) => {
                const color = d.properties?.color || '#ff3333';
                return color.includes('rgba') ? color : `${color}60`; // Add more opacity for better visibility
              }}
              polygonSideColor={(d) => {
                const color = d.properties?.color || '#ff3333';
                return color.includes('rgba') ? color : `${color}40`; // Add more opacity for better visibility
              }}
              polygonStrokeColor={(d) => d.properties?.color || '#ff3333'}
              polygonsTransitionDuration={500}
              polygonLabel={(d) => `
                <div class="globe-tooltip">
                  <strong>${d.properties?.name || 'Damage Zone'}</strong><br/>
                  ${d.properties?.description || ''}<br/>
                  Radius: ${d.properties?.radius || 0} km<br/>
                  Severity: ${d.properties?.severity || 0}<br/>
                  Effect: ${d.properties?.effectType || 'Unknown'}<br/>
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

          <div className="sidebar-panel">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                📊 Impact Results
              </button>
              <button 
                className={`tab-btn ${activeTab === 'rerun' ? 'active' : ''}`}
                onClick={() => setActiveTab('rerun')}
              >
                🔄 Rerun Simulation
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'results' && (
                <div className="results-tab">
                  {/* Loading State */}
                  {isAnalyzing && (
                    <div className="analysis-loading">
                      <h3>🔬 Analyzing Impact...</h3>
                      <p>Calculating physics simulation...</p>
                    </div>
                  )}
                  
                  {/* Error State */}
                  {analysisError && (
                    <div className="analysis-error">
                      <h3>❌ Analysis Error</h3>
                      <p>{analysisError}</p>
                    </div>
                  )}
                  
                  {/* Results Display */}
                  {physicsResponse && !isAnalyzing ? (
                    <div className="compact-physics-results">
                      {/* Energy Analysis */}
                      <div className="compact-result-section">
                        <h4>💥 Impact Energy</h4>
                        <div className="metric-item">
                          <span className="label">TNT Equivalent:</span>
                          <span className="value">{(physicsResponse.impact_analysis?.energy_calculations?.tnt_equivalent_megatons || 0).toFixed(2)} MT</span>
                        </div>
                        <div className="metric-item">
                          <span className="label">Kinetic Energy:</span>
                          <span className="value">{physicsResponse.impact_analysis?.energy_calculations?.kinetic_energy_joules?.toExponential(2)} J</span>
                        </div>
                      </div>
                      
                      {/* Impact Mechanics */}
                      <div className="compact-result-section">
                        <h4>🎯 Impact Details</h4>
                        <div className="metric-item">
                          <span className="label">Type:</span>
                          <span className="value impact-type-badge">{physicsResponse.impact_analysis?.impact_mechanics?.impact_type || 'Unknown'}</span>
                        </div>
                        {physicsResponse.impact_analysis?.impact_mechanics?.airburst_altitude_km && (
                          <div className="metric-item">
                            <span className="label">Airburst Altitude:</span>
                            <span className="value">{(physicsResponse.impact_analysis.impact_mechanics.airburst_altitude_km || 0).toFixed(1)} km</span>
                          </div>
                        )}
                        {physicsResponse.impact_analysis?.impact_mechanics?.crater_diameter_m && (
                          <div className="metric-item">
                            <span className="label">Crater Diameter:</span>
                            <span className="value">{((physicsResponse.impact_analysis.impact_mechanics.crater_diameter_m || 0) / 1000).toFixed(1)} km</span>
                          </div>
                        )}
                        {physicsResponse.impact_analysis?.impact_mechanics?.seismic_magnitude && (
                          <div className="metric-item">
                            <span className="label">Seismic Magnitude:</span>
                            <span className="value">{(physicsResponse.impact_analysis.impact_mechanics.seismic_magnitude || 0).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Damage Zones */}
                      {physicsResponse.damage_analysis?.impact_radii_by_severity && (
                        <div className="compact-result-section">
                          <h4>💥 Damage Zones</h4>
                          <div className="compact-damage-zones">
                            {physicsResponse.damage_analysis.impact_radii_by_severity.map((zone, index) => ( // Show only first 3 zones
                              <div key={index} className="compact-zone-item" style={{borderLeft: `3px solid ${zone.color || '#ff3333'}`}}>
                                <div className="zone-title">
                                  <span className="zone-icon">{zone.effect_type === 'thermal' ? '🔥' : '💨'}</span>
                                  <span className="zone-name">{zone.description}</span>
                                </div>
                                <div className="zone-stats">
                                  <span className="stat">{(zone.radius_km || 0).toFixed(1)} km</span>
                                  <span className="stat">{zone.severity_level || 0}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Casualty Summary */}
                      {physicsResponse.casualty_analysis?.estimated_casualties && (
                        <div className="compact-result-section">
                          <h4>👥 Casualties</h4>
                          <div className="casualty-summary">
                            <div className="casualty-item fatal">
                              <span className="number">{(physicsResponse.casualty_analysis.estimated_casualties.fatalities || 0) > 1000 ? 
                                (physicsResponse.casualty_analysis.estimated_casualties.fatalities / 1000).toFixed(1) + 'K' : 
                                physicsResponse.casualty_analysis.estimated_casualties.fatalities || '0'}</span>
                              <span className="type">Fatal</span>
                            </div>
                            <div className="casualty-item severe">
                              <span className="number">{(physicsResponse.casualty_analysis.estimated_casualties.severe_injuries || 0) > 1000 ? 
                                (physicsResponse.casualty_analysis.estimated_casualties.severe_injuries / 1000).toFixed(1) + 'K' : 
                                physicsResponse.casualty_analysis.estimated_casualties.severe_injuries || '0'}</span>
                              <span className="type">Severe</span>
                            </div>
                            <div className="casualty-item light">
                              <span className="number">{(physicsResponse.casualty_analysis.estimated_casualties.light_injuries || 0) > 1000 ? 
                                (physicsResponse.casualty_analysis.estimated_casualties.light_injuries / 1000).toFixed(1) + 'K' : 
                                physicsResponse.casualty_analysis.estimated_casualties.light_injuries || '0'}</span>
                              <span className="type">Light</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : !isAnalyzing && (
                    <div className="no-results">
                      <div className="no-results-icon">📊</div>
                      <h3>No Analysis Results</h3>
                      <p>Run a physics simulation to see impact analysis results here.</p>
                      <button 
                        className="switch-tab-btn"
                        onClick={() => setActiveTab('rerun')}
                      >
                        Go to Rerun Simulation →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rerun' && (
                <div className="rerun-tab">
                  <div className="rerun-content">
                    <h3>� Simulation Parameters</h3>
                    <p className="rerun-description">Modify parameters and rerun the physics simulation</p>
                    
                    {/* Location Parameters */}
                    <div className="param-group">
                      <h4>📍 Impact Location</h4>
                      <div className="param-row">
                        <div className="param-input">
                          <label>Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            min="-90"
                            max="90"
                            value={editableParams.impact_latitude}
                            onChange={(e) => setEditableParams(prev => ({...prev, impact_latitude: e.target.value}))}
                            placeholder="e.g., 40.7128"
                          />
                        </div>
                        <div className="param-input">
                          <label>Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            min="-180"
                            max="180"
                            value={editableParams.impact_longitude}
                            onChange={(e) => setEditableParams(prev => ({...prev, impact_longitude: e.target.value}))}
                            placeholder="e.g., -74.0060"
                          />
                        </div>
                      </div>
                      <div className="quick-location-shortcuts">
                        <label>Quick Locations:</label>
                        <div className="location-shortcuts-grid">
                          {quickLocations.slice(0, 6).map((location, index) => (
                            <button
                              key={index}
                              className="location-shortcut-btn"
                              onClick={() => {
                                setEditableParams(prev => ({
                                  ...prev,
                                  impact_latitude: location.lat.toFixed(4),
                                  impact_longitude: location.lng.toFixed(4)
                                }));
                                handleQuickLocationSelect(location);
                              }}
                              title={`${location.lat.toFixed(2)}°, ${location.lng.toFixed(2)}°`}
                            >
                              {location.name.split(',')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Asteroid Parameters */}
                    <div className="param-group">
                      <h4>🪨 Asteroid Properties</h4>
                      <div className="param-input">
                        <label>Diameter (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={editableParams.diameter}
                          onChange={(e) => setEditableParams(prev => ({...prev, diameter: e.target.value}))}
                          placeholder="e.g., 100"
                        />
                      </div>
                      <div className="param-input">
                        <label>Mass (kg)</label>
                        <input
                          type="number"
                          step="1000"
                          min="1"
                          value={editableParams.mass}
                          onChange={(e) => setEditableParams(prev => ({...prev, mass: e.target.value}))}
                          placeholder="e.g., 1000000"
                        />
                      </div>
                      <div className="param-input">
                        <label>Density (kg/m³)</label>
                        <input
                          type="number"
                          step="100"
                          min="100"
                          value={editableParams.density}
                          onChange={(e) => setEditableParams(prev => ({...prev, density: e.target.value}))}
                          placeholder="e.g., 2700"
                        />
                      </div>
                      <div className="param-input">
                        <label>Composition</label>
                        <select
                          value={editableParams.composition}
                          onChange={(e) => setEditableParams(prev => ({...prev, composition: e.target.value}))}
                        >
                          <option value="">Select composition</option>
                          <option value="stony">Stony</option>
                          <option value="iron">Iron</option>
                          <option value="carbonaceous">Carbonaceous</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Impact Parameters */}
                    <div className="param-group">
                      <h4>💥 Impact Conditions</h4>
                      <div className="param-input">
                        <label>Velocity (km/s)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="11"
                          max="72"
                          value={editableParams.velocity_kms}
                          onChange={(e) => setEditableParams(prev => ({...prev, velocity_kms: parseFloat(e.target.value)}))}
                        />
                      </div>
                      <div className="param-input">
                        <label>Angle (degrees)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="90"
                          value={editableParams.angle_degrees}
                          onChange={(e) => setEditableParams(prev => ({...prev, angle_degrees: parseFloat(e.target.value)}))}
                        />
                      </div>
                      <div className="param-input">
                        <label>Population Density (people/km²)</label>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={editableParams.population_density}
                          onChange={(e) => setEditableParams(prev => ({...prev, population_density: parseFloat(e.target.value)}))}
                        />
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="rerun-actions">
                      <button 
                        className="rerun-btn"
                        onClick={() => {
                          // Update coordinates if changed
                          if (editableParams.impact_latitude && editableParams.impact_longitude) {
                            const newCoords = {
                              lat: parseFloat(editableParams.impact_latitude).toFixed(4),
                              lng: parseFloat(editableParams.impact_longitude).toFixed(4)
                            };
                            setSelectedCoordinates(newCoords);
                            setManualCoords(newCoords);
                          }
                          
                          // Update asteroid parameters
                          const updatedAsteroidParams = {
                            ...asteroidParameters,
                            diameter: parseFloat(editableParams.diameter) || asteroidParameters.diameter,
                            mass: parseFloat(editableParams.mass) || asteroidParameters.mass,
                            density: parseFloat(editableParams.density) || asteroidParameters.density,
                            composition: editableParams.composition || asteroidParameters.composition
                          };
                          setAsteroidParameters(updatedAsteroidParams);
                          
                          // Update scenario data
                          setScenarioData({
                            velocity_kms: editableParams.velocity_kms,
                            angle_degrees: editableParams.angle_degrees
                          });
                          
                          // Run analysis with updated parameters
                          performPhysicsAnalysis();
                          
                          // Switch to results tab
                          setActiveTab('results');
                        }}
                        disabled={isAnalyzing || !editableParams.diameter || !editableParams.impact_latitude || !editableParams.impact_longitude}
                      >
                        {isAnalyzing ? '🔬 Running...' : '🚀 Run Simulation'}
                      </button>
                      
                      <button 
                        className="reset-btn"
                        onClick={() => {
                          // Reset to original values
                          const originalData = JSON.parse(localStorage.getItem('simulationData') || '{}');
                          if (originalData.asteroid_parameters) {
                            setEditableParams({
                              diameter: originalData.asteroid_parameters.diameter || '',
                              mass: originalData.asteroid_parameters.mass || '',
                              density: originalData.asteroid_parameters.density || '',
                              composition: originalData.asteroid_parameters.composition || '',
                              velocity_kms: originalData.velocity_kms || 25.0,
                              angle_degrees: originalData.angle_degrees || 45,
                              impact_latitude: originalData.impact_location?.latitude || '',
                              impact_longitude: originalData.impact_location?.longitude || '',
                              population_density: 100
                            });
                          }
                        }}
                      >
                        🔄 Reset to Original
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* API Parameters Display */}
        {selectedCoordinates && (
          <div className="api-parameters-display">
            <h3>🖥️ Analysis Parameters {physicsResponse ? '(From ScenarioSetup Analysis)' : ''}</h3>
            <div className="parameters-grid">
              <div className="parameter-group">
                <h4>🌍 Location</h4>
                <p>Latitude: {selectedCoordinates.lat}°</p>
                <p>Longitude: {selectedCoordinates.lng}°</p>
              </div>
              
              {asteroidParameters.diameter && (
                <div className="parameter-group">
                  <h4>🪨 Asteroid Properties</h4>
                  <p>Diameter: {asteroidParameters.diameter}m</p>
                  {asteroidParameters.mass && <p>Mass: {asteroidParameters.mass.toExponential(2)} kg</p>}
                  {asteroidParameters.density && <p>Density: {asteroidParameters.density} kg/m³</p>}
                  {asteroidParameters.composition && <p>Composition: {asteroidParameters.composition}</p>}
                </div>
              )}
              
              <div className="parameter-group">
                <h4>💥 Impact Parameters</h4>
                <p>Velocity: {scenarioData.velocity_kms} km/s</p>
                <p>Angle: {scenarioData.angle_degrees}°</p>
                <p>Population Density: 100 people/km²</p>
              </div>
              
              {asteroidParameters.eccentricity !== undefined && (
                <div className="parameter-group">
                  <h4>🛰️ Orbital Elements</h4>
                  {asteroidParameters.eccentricity !== undefined && <p>Eccentricity: {asteroidParameters.eccentricity}</p>}
                  {asteroidParameters.semi_major_axis && <p>Semi-major Axis: {asteroidParameters.semi_major_axis} AU</p>}
                  {asteroidParameters.inclination !== undefined && <p>Inclination: {asteroidParameters.inclination}°</p>}
                  {asteroidParameters.moid !== undefined && <p>MOID: {asteroidParameters.moid} AU</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobeScreen;