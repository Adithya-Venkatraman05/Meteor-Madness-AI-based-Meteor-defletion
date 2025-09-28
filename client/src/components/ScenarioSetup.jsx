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
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [asteroidParameters, setAsteroidParameters] = useState({});
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [parameterErrors, setParameterErrors] = useState({});
  
  // Modal and API response state
  const [showModal, setShowModal] = useState(false);
  const [physicsResponse, setPhysicsResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

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

  // Process asteroid data directly from localStorage when component loads
  useEffect(() => {
    const processAsteroidData = () => {
      try {
        const asteroidData = localStorage.getItem('selectedAsteroidDetails');
        console.log('Raw asteroid data from localStorage:', asteroidData);
        
        if (!asteroidData) {
          console.log('No asteroid data found in localStorage');
          return;
        }

        const asteroid = JSON.parse(asteroidData);
        console.log('Parsed asteroid data:', asteroid);
        console.log('Asteroid data structure:', {
          hasData: !!asteroid.data,
          hasObject: !!asteroid.data?.object,
          hasPhysPar: !!asteroid.data?.phys_par,
          hasOrbit: !!asteroid.data?.orbit,
          objectName: asteroid.data?.object?.fullname,
          physParLength: asteroid.data?.phys_par?.length || 0,
          orbitElements: asteroid.data?.orbit?.elements?.length || 0,
          moid: asteroid.orbit?.moid || 0
        });
        
        setSelectedAsteroid(asteroid);
        setLoadingParameters(true);

        // Extract parameters directly from the SBDB data structure
        var extractedParams = extractParametersFromSBDB(asteroid);
        console.log('Extracted parameters:', extractedParams);
        setAsteroidParameters(extractedParams);
        
        // Pre-fill scenario data with extracted parameters if available
        setScenarioData(prev => ({
          ...prev,
          velocity_kms: extractedParams.typical_velocity || prev.velocity_kms,
          angle_degrees: extractedParams.typical_angle || prev.angle_degrees
        }));

      } catch (error) {
        console.error('Error processing asteroid data:', error);
        setParameterErrors({ general: 'Error processing asteroid data: ' + error.message });
      } finally {
        setLoadingParameters(false);
      }
    };

    processAsteroidData();
  }, []);

  // Function to extract parameters directly from SBDB data
  const extractParametersFromSBDB = (asteroidData) => {
    console.log('Starting parameter extraction from:', asteroidData);
    console.log('Asteroid data type:', typeof asteroidData);
    console.log('Asteroid data keys:', Object.keys(asteroidData || {}));
    
    const params = {};
    
    try {
      // Handle different possible data structures
      let dataRoot = asteroidData;
      
      // Case 1: Full API response with wrapper
      if (asteroidData.success && asteroidData.data) {
        console.log('Found API response wrapper, extracting data...');
        dataRoot = asteroidData.data;
      } 
      // Case 2: Data wrapper exists (but no success flag)
      else if (asteroidData.data && typeof asteroidData.data === 'object') {
        console.log('Found data wrapper, extracting data...');
        dataRoot = asteroidData.data;
      }
      // Case 3: Direct SBDB data (object, phys_par, orbit at top level)
      else if (asteroidData.object || asteroidData.phys_par || asteroidData.orbit) {
        console.log('Found direct SBDB data structure...');
        dataRoot = asteroidData;
      }
      // Case 4: Fallback - use asteroidData as is
      else {
        console.log('Using asteroidData as-is...');
        dataRoot = asteroidData;
      }
      
      console.log('Using data root:', dataRoot);
      console.log('Data root keys:', Object.keys(dataRoot || {}));
      
      const objData = dataRoot?.object || {};
      const physPar = dataRoot?.phys_par || [];
      const orbitData = dataRoot?.orbit || {};  
      const elements = orbitData?.elements || [];
      // Get MOID from orbit data, not from top level
      const moid = orbitData?.moid || 0;
      console.log('Data structure analysis:', {
        objData: !!objData,
        objDataKeys: Object.keys(objData),
        physParCount: physPar.length,
        orbitData: !!orbitData,
        orbitDataKeys: Object.keys(orbitData),
        elementsCount: elements.length
      });

      // Extract basic object info
      params.name = objData.fullname || objData.full_name || 'Unknown Asteroid';
      params.designation = objData.des || objData.designation || '';

      console.log('Basic info extracted:', { name: params.name, designation: params.designation });

      // Essential physical parameters we always need
      physPar.forEach((param, index) => {
        console.log(`Processing phys_par[${index}]:`, param);
        const name = param.name?.toLowerCase();
        const value = parseFloat(param.value);
        
        if (isNaN(value)) {
          console.log(`Skipping parameter ${name} - invalid value:`, param.value);
          return;
        }

        switch (name) {
          case 'diameter':
          case 'diam':
            params.diameter = value * 1000; // Convert km to meters
            console.log('Diameter extracted:', params.diameter);
            break;
          case 'h': // Absolute magnitude
          case 'abs_mag':
            params.absolute_magnitude = value;
            console.log('Absolute magnitude extracted:', params.absolute_magnitude);
            break;
          case 'albedo':
          case 'geometric_albedo':
          case 'pv':
            params.geometric_albedo = value;
            console.log('Geometric albedo extracted:', params.geometric_albedo);
            break;
          case 'density':
            params.density = value * 1000; // Convert g/cm³ to kg/m³
            console.log('Density extracted:', params.density);
            break;
          case 'mass':
            params.mass = value;
            console.log('Mass extracted:', params.mass);
            break;
          case 'rotation_period':
          case 'rot_per':
          case 'per':
            params.rotation_period = value;
            console.log('Rotation period extracted:', params.rotation_period);
            break;
          default:
            console.log('Unhandled physical parameter:', name, value);
            break;
        }
      });

      // Add MOID parameter to the extracted parameters
      if (moid > 0) {
        params.moid = moid;
        console.log('MOID extracted:', params.moid);
      }

      // Essential orbital elements we always need
      const orbitalMap = {
        'e': 'eccentricity',
        'a': 'semi_major_axis',
        'q': 'perihelion_distance',
        'ad': 'aphelion_distance', // Updated to match your data structure
        'i': 'inclination',
        'om': 'longitude_ascending_node',
        'w': 'argument_perihelion',
        'ma': 'mean_anomaly',
        'per': 'orbital_period',
        'n': 'mean_motion'
      };

      elements.forEach((element, index) => {
        console.log(`Processing orbit element[${index}]:`, element);
        const symbol = element.name;
        const value = parseFloat(element.value);
        const paramName = orbitalMap[symbol];
        
        if (paramName && !isNaN(value)) {
          params[paramName] = value;
          console.log(`Orbital parameter ${paramName} = ${value}`);
        } else {
          console.log(`Skipped orbital element: ${symbol} = ${element.value}`);
        }
      });

      // Calculate typical impact parameters based on orbital characteristics
      if (params.semi_major_axis && params.eccentricity) {
        // Estimate typical impact velocity (simplified calculation)
        const earthVelocity = 29.78; // km/s
        const asteroidVelocity = Math.sqrt(398600.4418 / (params.semi_major_axis * 149597870.7));
        params.typical_velocity = Math.sqrt(earthVelocity * earthVelocity + asteroidVelocity * asteroidVelocity);
      }

      // Estimate typical impact angle based on orbital inclination
      if (params.inclination !== undefined) {
        params.typical_angle = Math.min(90, Math.max(15, params.inclination * 0.5 + 30));
      }

      // Set default composition based on asteroid type or characteristics
      if (params.geometric_albedo !== undefined) {
        if (params.geometric_albedo > 0.2) {
          params.composition = 'METALLIC';
        } else if (params.geometric_albedo < 0.05) {
          params.composition = 'CARBONACEOUS';
        } else {
          params.composition = 'ROCKY';
        }
      } else {
        params.composition = 'ROCKY'; // Default
      }

      // Estimate density if not available
      if (!params.density && params.composition) {
        const densityMap = {
          'ROCKY': 2500,
          'METALLIC': 5000,
          'CARBONACEOUS': 1500,
          'ICY': 900
        };
        params.density = densityMap[params.composition] || 2500;
      }

      // Calculate mass if diameter is available but mass isn't
      if (params.diameter && !params.mass && params.density) {
        const radius = params.diameter / 2;
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        params.mass = volume * params.density;
        console.log('Calculated mass from diameter and density:', params.mass);
      }

      // Add some default values if critical parameters are missing
      if (!params.composition) {
        params.composition = 'ROCKY'; // Default to rocky
        console.log('Set default composition: ROCKY');
      }

      if (!params.density && params.composition) {
        const densityMap = {
          'ROCKY': 2500,
          'METALLIC': 5000,
          'CARBONACEOUS': 1500,
          'ICY': 900
        };
        params.density = densityMap[params.composition] || 2500;
        console.log('Set default density based on composition:', params.density);
      }

    } catch (error) {
      console.error('Error extracting parameters:', error);
      console.error('Error stack:', error.stack);
    }

    console.log('Final extracted parameters:', params);
    console.log('Parameters count:', Object.keys(params).length);
    return params;
  };

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

    // Validate asteroid parameters if asteroid is selected
    if (selectedAsteroid && asteroidParameters.diameter && asteroidParameters.diameter <= 0) {
      newErrors.diameter = 'Diameter must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (location) => {
    // Set the selected location and update the form data
    setSelectedLocation(location);
    setScenarioData(prev => ({
      ...prev,
      impact_location: {
        latitude: location.lat,
        longitude: location.lng
      }
    }));
    
    // Clear any existing errors for the location fields
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

  // Function to call physics engine API
  const callPhysicsAPI = async () => {
    console.log('🚀 Starting physics API call...');
    console.log('Current asteroid parameters:', asteroidParameters);
    console.log('Current scenario data:', scenarioData);
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Build API parameters from asteroid and scenario data
      const apiParams = new URLSearchParams();
      
      // Required parameters
      if (asteroidParameters.diameter) {
        apiParams.append('diameter', asteroidParameters.diameter.toString());
        console.log('✅ Diameter added:', asteroidParameters.diameter);
      } else {
        console.error('❌ No diameter found in asteroid parameters');
        throw new Error('Asteroid diameter is required for physics analysis');
      }
      
      // Optional parameters from asteroid data
      if (asteroidParameters.mass) apiParams.append('mass', asteroidParameters.mass.toString());
      if (asteroidParameters.density) apiParams.append('density', asteroidParameters.density.toString());
      if (asteroidParameters.composition) apiParams.append('composition', asteroidParameters.composition);
      if (asteroidParameters.absolute_magnitude) apiParams.append('absolute_magnitude', asteroidParameters.absolute_magnitude.toString());
      if (asteroidParameters.geometric_albedo) apiParams.append('geometric_albedo', asteroidParameters.geometric_albedo.toString());
      if (asteroidParameters.rotation_period) apiParams.append('rotation_period', asteroidParameters.rotation_period.toString());
      
      // Orbital elements
      if (asteroidParameters.eccentricity !== undefined) apiParams.append('eccentricity', asteroidParameters.eccentricity.toString());
      if (asteroidParameters.semi_major_axis) apiParams.append('semi_major_axis', asteroidParameters.semi_major_axis.toString());
      if (asteroidParameters.perihelion_distance) apiParams.append('perihelion_distance', asteroidParameters.perihelion_distance.toString());
      if (asteroidParameters.aphelion_distance) apiParams.append('aphelion_distance', asteroidParameters.aphelion_distance.toString());
      if (asteroidParameters.inclination !== undefined) apiParams.append('inclination', asteroidParameters.inclination.toString());
      if (asteroidParameters.longitude_ascending_node) apiParams.append('longitude_ascending_node', asteroidParameters.longitude_ascending_node.toString());
      if (asteroidParameters.argument_perihelion) apiParams.append('argument_perihelion', asteroidParameters.argument_perihelion.toString());
      if (asteroidParameters.mean_anomaly) apiParams.append('mean_anomaly', asteroidParameters.mean_anomaly.toString());
      if (asteroidParameters.orbital_period) apiParams.append('orbital_period', asteroidParameters.orbital_period.toString());
      if (asteroidParameters.mean_motion) apiParams.append('mean_motion', asteroidParameters.mean_motion.toString());
      if (asteroidParameters.moid !== undefined) apiParams.append('moid', asteroidParameters.moid.toString());
      
      // Impact parameters from scenario
      if (scenarioData.velocity_kms) {
        apiParams.append('velocity', (scenarioData.velocity_kms * 1000).toString()); // Convert km/s to m/s
      }
      if (scenarioData.angle_degrees) {
        apiParams.append('angle', scenarioData.angle_degrees.toString());
      }
      
      // Impact location coordinates
      if (scenarioData.impact_location.latitude !== '' && scenarioData.impact_location.latitude !== null) {
        apiParams.append('impact_latitude', scenarioData.impact_location.latitude.toString());
        console.log('✅ Impact latitude added:', scenarioData.impact_location.latitude);
      }
      if (scenarioData.impact_location.longitude !== '' && scenarioData.impact_location.longitude !== null) {
        apiParams.append('impact_longitude', scenarioData.impact_location.longitude.toString());
        console.log('✅ Impact longitude added:', scenarioData.impact_location.longitude);
      }
      
      // Default population density
      apiParams.append('population_density', '100');
      
      const apiUrl = `http://localhost:8001/physics/impact-analysis?${apiParams}`;
      console.log('🌐 API URL:', apiUrl);
      console.log('📊 API Parameters:', Object.fromEntries(apiParams));
      console.log('📍 Impact Location being sent:', {
        latitude: scenarioData.impact_location.latitude,
        longitude: scenarioData.impact_location.longitude,
        included_in_params: apiParams.has('impact_latitude') && apiParams.has('impact_longitude')
      });
      
      // Test server connectivity first
      console.log('🔍 Testing server connectivity...');
      const healthResponse = await fetch('http://localhost:8001/health');
      console.log('❤️ Health check status:', healthResponse.status);
      
      // Make API call
      console.log('📡 Making physics API call...');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `API call failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
          console.error('❌ API Error:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Physics API response:', data);
      
      setPhysicsResponse(data);
      setShowModal(true);
      console.log('🎉 Modal should be visible now');
      
    } catch (error) {
      console.error('💥 Physics API call failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        asteroidParameters,
        scenarioData
      });
      setAnalysisError(error.message || 'Failed to analyze asteroid impact');
    } finally {
      setIsAnalyzing(false);
      console.log('🏁 API call completed');
    }
  };


  

  // Direct analysis function (bypasses form submission)
  const handleDirectAnalysis = async () => {
    console.log('🎯 Direct analysis clicked');
    console.log('Current state:', {
      latitude: scenarioData.impact_location.latitude,
      longitude: scenarioData.impact_location.longitude,
      diameter: asteroidParameters.diameter,
      asteroidParametersCount: Object.keys(asteroidParameters).length
    });
    
    // Clear any previous analysis errors
    setAnalysisError(null);
    
    // Check if we have minimum required data for physics analysis
    if (!asteroidParameters.diameter) {
      console.error('❌ No diameter found in asteroid parameters');
      setAnalysisError('Asteroid diameter is required for impact analysis');
      return;
    }
    
    if (!scenarioData.impact_location.latitude || !scenarioData.impact_location.longitude) {
      console.error('❌ Missing impact location');
      setAnalysisError('Impact location (latitude and longitude) is required');
      return;
    }
    
    console.log('🚀 All checks passed, calling physics API...');
    // Call physics API for analysis
    await callPhysicsAPI();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📝 Form submitted - redirecting to direct analysis');
    await handleDirectAnalysis();
  };

  return (
    <div className="scenario-setup">
      <div className="scenario-container">
        <div className="scenario-header">
          <Link to="/simulation" className="back-btn">← Back to Mode Selection</Link>
          <h1 className="scenario-title">Scenario Setup</h1>
          <p className="scenario-subtitle">Define impact location and mitigation strategy</p>
          
          <div className="asteroid-summary">
            <h3>Selected Asteroid: {
              selectedAsteroid?.object?.fullname || 
              selectedAsteroid?.object?.full_name ||
              selectedAsteroid?.data?.object?.fullname || 
              selectedAsteroid?.data?.object?.full_name ||
              selectedAsteroid?.asteroid_name ||
              (selectedAsteroid ? 'Unknown Asteroid' : 'Loading...')
            }</h3>
            {loadingParameters ? (
              <p>🔄 Analyzing asteroid parameters from NASA SBDB...</p>
            ) : selectedAsteroid ? (
              <div className="asteroid-info">
                <p>Configure your simulation parameters below. Parameters extracted from NASA SBDB are pre-filled but can be edited.</p>
                <div className="data-status">
                  <p><strong>Data Source:</strong> NASA SBDB</p>
                  <p><strong>Parameters Found:</strong> {Object.keys(asteroidParameters).length}</p>
                  <p><strong>Search Name:</strong> {selectedAsteroid.search_name || selectedAsteroid?.object?.des || 'N/A'}</p>
                  {selectedAsteroid.success === false && (
                    <p style={{color: '#ff6b6b'}}>⚠️ Limited data available for this asteroid</p>
                  )}
                </div>
                {parameterErrors.general && (
                  <div className="parameter-error">⚠️ {parameterErrors.general}</div>
                )}
              </div>
            ) : (
              <div className="no-asteroid">
                <p>No asteroid selected. <Link to="/simulation/predefined">Select an asteroid</Link> to continue.</p>
                <button 
                  onClick={() => {
                    // Clear any stale data and force reload
                    localStorage.removeItem('selectedAsteroidDetails');
                    window.location.href = '/simulation/predefined';
                  }}
                  className="reload-btn"
                >
                  🔄 Select New Asteroid
                </button>
              </div>
            )}
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
            </div>
          </div>

          {/* Asteroid Parameters from SBDB */}
          {selectedAsteroid && (
            <div className="form-section">
              <h3 className="section-title">Asteroid Parameters</h3>
              
              <div className="essential-parameters">
                <h4>Essential Physical Properties</h4>
                <div className="parameter-grid">
                  <div className="parameter-card">
                    <label>Diameter (meters) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={asteroidParameters.diameter || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, diameter: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter diameter in meters"
                      className={asteroidParameters.diameter ? 'prefilled' : 'empty'}
                      required
                    />
                    <span className="parameter-status">
                      {asteroidParameters.diameter ? '✓ From NASA SBDB' : '⚠️ Required - Please enter'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>Composition</label>
                    <select
                      value={asteroidParameters.composition || 'ROCKY'}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, composition: e.target.value }))}
                      className={asteroidParameters.composition ? 'prefilled' : 'empty'}
                    >
                      <option value="ROCKY">Rocky (S-type)</option>
                      <option value="METALLIC">Metallic (M-type)</option>
                      <option value="CARBONACEOUS">Carbonaceous (C-type)</option>
                      <option value="ICY">Icy</option>
                    </select>
                    <span className="parameter-status">
                      {asteroidParameters.geometric_albedo ? '✓ Estimated from albedo' : '🔧 Default selection'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>Density (kg/m³)</label>
                    <input
                      type="number"
                      step="100"
                      min="500"
                      max="8000"
                      value={asteroidParameters.density || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, density: parseFloat(e.target.value) || 0 }))}
                      placeholder="Auto-calculated from composition"
                      className={asteroidParameters.density ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.density ? '🔧 Based on composition' : '⚪ Will auto-calculate'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>Mass (kg)</label>
                    <input
                      type="number"
                      step="1000000"
                      min="0"
                      value={asteroidParameters.mass || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, mass: parseFloat(e.target.value) || 0 }))}
                      placeholder="Auto-calculated from diameter & density"
                      className={asteroidParameters.mass ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.mass ? '🔧 Calculated' : '⚪ Will auto-calculate'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="optional-parameters">
                <h4>Optional Physical Properties</h4>
                <div className="parameter-grid">
                  <div className="parameter-card">
                    <label>Absolute Magnitude (H)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={asteroidParameters.absolute_magnitude || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, absolute_magnitude: parseFloat(e.target.value) || undefined }))}
                      placeholder="Optional - improves accuracy"
                      className={asteroidParameters.absolute_magnitude ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.absolute_magnitude ? '✓ From NASA SBDB' : '⚪ Optional parameter'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>Geometric Albedo</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={asteroidParameters.geometric_albedo || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, geometric_albedo: parseFloat(e.target.value) || undefined }))}
                      placeholder="0.0 - 1.0 (reflectivity)"
                      className={asteroidParameters.geometric_albedo ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.geometric_albedo ? '✓ From NASA SBDB' : '⚪ Optional parameter'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>Rotation Period (hours)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={asteroidParameters.rotation_period || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, rotation_period: parseFloat(e.target.value) || undefined }))}
                      placeholder="Spin rate in hours"
                      className={asteroidParameters.rotation_period ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.rotation_period ? '✓ From NASA SBDB' : '⚪ Optional parameter'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="orbital-elements">
                <h4>Key Orbital Elements</h4>
                <div className="parameter-grid">
                  <div className="parameter-card">
                    <label>Eccentricity</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="0.99"
                      value={asteroidParameters.eccentricity || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, eccentricity: parseFloat(e.target.value) || undefined }))}
                      placeholder="0.0 (circular) to 0.99"
                      className={asteroidParameters.eccentricity !== undefined ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.eccentricity !== undefined ? '✓ From NASA SBDB' : '⚪ Used for velocity calculation'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>Semi-major Axis (AU)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="50"
                      value={asteroidParameters.semi_major_axis || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, semi_major_axis: parseFloat(e.target.value) || undefined }))}
                      placeholder="Distance from Sun (AU)"
                      className={asteroidParameters.semi_major_axis ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.semi_major_axis ? '✓ From NASA SBDB' : '⚪ Used for velocity calculation'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>Inclination (degrees)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="180"
                      value={asteroidParameters.inclination || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, inclination: parseFloat(e.target.value) || undefined }))}
                      placeholder="Orbital tilt (degrees)"
                      className={asteroidParameters.inclination !== undefined ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.inclination !== undefined ? '✓ From NASA SBDB' : '⚪ Used for angle estimation'}
                    </span>
                  </div>

                  <div className="parameter-card">
                    <label>MOID (AU)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={asteroidParameters.moid || ''}
                      onChange={(e) => setAsteroidParameters(prev => ({ ...prev, moid: parseFloat(e.target.value) || undefined }))}
                      placeholder="Min distance to Earth orbit"
                      className={asteroidParameters.moid ? 'prefilled' : 'empty'}
                    />
                    <span className="parameter-status">
                      {asteroidParameters.moid ? '✓ From NASA SBDB' : '⚪ Threat assessment parameter'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}          {/* Impact Parameters */}
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

          {/* Simulation Summary */}
          <div className="form-section">
            <h3 className="section-title">Simulation Summary</h3>
            <div className="simulation-summary">
              <div className="summary-grid">
                <div className="summary-card">
                  <h4>Asteroid Information</h4>
                  <p><strong>Name:</strong> {selectedAsteroid?.object?.fullname || selectedAsteroid?.data?.object?.fullname || 'No asteroid selected'}</p>
                  <p><strong>Diameter:</strong> {asteroidParameters.diameter ? `${asteroidParameters.diameter.toLocaleString()} m` : 'Not specified'}</p>
                  <p><strong>Parameters Available:</strong> {Object.keys(asteroidParameters).length} from NASA SBDB</p>
                </div>
                
                <div className="summary-card">
                  <h4>Impact Location</h4>
                  <p><strong>Latitude:</strong> {scenarioData.impact_location.latitude || 'Not set'}</p>
                  <p><strong>Longitude:</strong> {scenarioData.impact_location.longitude || 'Not set'}</p>
                  <p><strong>Status:</strong> {scenarioData.impact_location.latitude && scenarioData.impact_location.longitude ? '✓ Ready' : '⚠️ Incomplete'}</p>
                </div>
                
                <div className="summary-card">
                  <h4>Impact Parameters</h4>
                  <p><strong>Velocity:</strong> {scenarioData.velocity_kms} km/s</p>
                  <p><strong>Angle:</strong> {scenarioData.angle_degrees}°</p>
                  <p><strong>Mitigation:</strong> {mitigationStrategies.find(s => s.value === scenarioData.mitigation_strategy)?.name || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            
            <button 
              type="button"
              onClick={handleDirectAnalysis}
              className="start-simulation-btn"
              disabled={!scenarioData.impact_location.latitude || !scenarioData.impact_location.longitude || isAnalyzing}
            >
              {isAnalyzing 
                ? '🔄 Analyzing Impact...' 
                : !scenarioData.impact_location.latitude || !scenarioData.impact_location.longitude 
                  ? 'Set Impact Location First' 
                  : 'Analyze Impact →'
              }
            </button>
            {analysisError && (
              <div className="analysis-error">
                ⚠️ {analysisError}
              </div>
            )}
          </div>
        </form>

        {/* Physics Analysis Results Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🌍 Impact Analysis Results</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                {!physicsResponse ? (
                  <div className="loading-state">
                    <p>🔄 Loading analysis results...</p>
                    {analysisError && (
                      <div className="error-state">
                        <p>❌ Error: {analysisError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                {/* Analysis Summary */}
                <div className="analysis-section">
                  <h3>📊 Analysis Summary</h3>
                  <div className="summary-cards">
                    <div className="summary-card energy">
                      <h4>💥 Impact Energy</h4>
                      <p className="value">{(physicsResponse.impact_analysis?.energy_calculations?.tnt_equivalent || 0).toFixed(2)} MT</p>
                      <p className="label">TNT Equivalent</p>
                    </div>
                    <div className="summary-card damage">
                      <h4>📍 Impact Type</h4>
                      <p className="value">{physicsResponse.impact_analysis?.impact_mechanics?.impact_type || 'Unknown'}</p>
                      <p className="label">{physicsResponse.impact_analysis?.impact_mechanics?.airburst_altitude_km ? 
                        `Airburst at ${(physicsResponse.impact_analysis?.impact_mechanics?.airburst_altitude_km || 0).toFixed(1)} km` : 
                        'Surface Impact'}</p>
                    </div>
                    <div className="summary-card casualties">
                      <h4>👥 Estimated Casualties</h4>
                      <p className="value">{physicsResponse.casualty_analysis?.estimated_casualties?.fatalities?.toLocaleString() || '0'}</p>
                      <p className="label">Fatalities</p>
                    </div>
                    <div className="summary-card radius">
                      <h4>🎯 Max Damage Radius</h4>
                      <p className="value">{(physicsResponse.analysis_summary?.max_impact_radius_km || 0).toFixed(1)} km</p>
                      <p className="label">Total Destruction</p>
                    </div>
                  </div>
                </div>

                {/* Orbital Classification */}
                {physicsResponse.orbital_analysis?.orbital_classification && (
                  <div className="analysis-section">
                    <h3>🛰️ Orbital Analysis</h3>
                    <div className="orbital-info">
                      <p><strong>Classification:</strong> {physicsResponse.orbital_analysis.orbital_classification}</p>
                      <p><strong>Earth Threat:</strong> {physicsResponse.orbital_analysis.earth_threat_assessment?.close_approach_risk || 'Unknown'}</p>
                      {physicsResponse.orbital_analysis.earth_threat_assessment?.potentially_hazardous && (
                        <p className="warning">⚠️ Potentially Hazardous Asteroid</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Impact Location */}
                {physicsResponse.impact_location?.coordinates && (
                  <div className="analysis-section">
                    <h3>📍 Impact Location</h3>
                    <div className="location-info">
                      <p><strong>Coordinates:</strong> {(physicsResponse.impact_location?.coordinates?.latitude || 0).toFixed(4)}°, {(physicsResponse.impact_location?.coordinates?.longitude || 0).toFixed(4)}°</p>
                      <p><strong>Region:</strong> {physicsResponse.impact_location?.coordinates?.region_type}</p>
                      {physicsResponse.impact_location?.coordinates?.nearest_city && (
                        <p><strong>Nearest City:</strong> {physicsResponse.impact_location?.coordinates?.nearest_city} ({(physicsResponse.impact_location?.coordinates?.distance_to_city_km || 0).toFixed(1)} km away)</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Damage Zones */}
                {physicsResponse.damage_analysis?.impact_radii_by_severity && (
                  <div className="analysis-section">
                    <h3>💥 Damage Zones</h3>
                    <div className="damage-zones">
                      {physicsResponse.damage_analysis?.impact_radii_by_severity?.map((zone, index) => (
                        <div key={index} className={`damage-zone ${zone.effect_type}`}>
                          <div className="zone-header">
                            <span className="zone-icon" style={{color: zone.color}}>{zone.effect_type === 'thermal' ? '🔥' : '💨'}</span>
                            <strong>{zone.description}</strong>
                          </div>
                          <div className="zone-details">
                            <span>Radius: {(zone?.radius_km || 0).toFixed(1)} km</span>
                            <span>Area: {(zone?.area_km2 || 0).toFixed(1)} km²</span>
                            <span>Severity: {zone.severity_level || 0}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Physical Impact Details */}
                <div className="analysis-section">
                  <h3>🔬 Physical Impact Details</h3>
                  <div className="impact-details">
                    <div className="detail-row">
                      <span>Kinetic Energy:</span>
                      <span>{physicsResponse.impact_analysis?.energy_calculations?.kinetic_energy_joules?.toExponential(2)} J</span>
                    </div>
                    {physicsResponse.impact_analysis?.impact_mechanics?.crater_diameter_m && (
                      <div className="detail-row">
                        <span>Crater Diameter:</span>
                        <span>{((physicsResponse.impact_analysis?.impact_mechanics?.crater_diameter_m || 0) / 1000).toFixed(1)} km</span>
                      </div>
                    )}
                    {physicsResponse.impact_analysis?.impact_mechanics?.seismic_magnitude && (
                      <div className="detail-row">
                        <span>Seismic Magnitude:</span>
                        <span>{(physicsResponse.impact_analysis?.impact_mechanics?.seismic_magnitude || 0).toFixed(1)}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span>Approach Velocity:</span>
                      <span>{((physicsResponse.asteroid_parameters?.calculated_properties?.approach_velocity_ms || 0) / 1000).toFixed(1)} km/s</span>
                    </div>
                    <div className="detail-row">
                      <span>Impact Angle:</span>
                      <span>{physicsResponse.asteroid_parameters?.calculated_properties?.impact_angle_degrees}°</span>
                    </div>
                  </div>
                </div>

                {/* Deflection Analysis */}
                {physicsResponse.deflection_analysis && (
                  <div className="analysis-section">
                    <h3>🚀 Deflection Recommendations</h3>
                    <div className="deflection-info">
                      <p><strong>Deflection Feasibility:</strong> {physicsResponse.deflection_analysis.deflection_feasible ? '✅ Possible' : '❌ Not Feasible'}</p>
                      {physicsResponse.deflection_analysis.recommended_strategies?.length > 0 && (
                        <div>
                          <p><strong>Recommended Strategies:</strong></p>
                          <ul>
                            {physicsResponse.deflection_analysis?.recommended_strategies?.map((strategy, index) => (
                              <li key={index}>{strategy}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
              
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>
                  Close Analysis
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    // Save data and navigate to globe view
                    const simulationData = {
                      ...scenarioData,
                      asteroid_parameters: asteroidParameters,
                      selected_asteroid: selectedAsteroid,
                      physics_analysis: physicsResponse
                    };
                    localStorage.setItem('simulationData', JSON.stringify(simulationData));
                    const coordinates = {
                      lat: parseFloat(scenarioData.impact_location.latitude),
                      lng: parseFloat(scenarioData.impact_location.longitude)
                    };
                    localStorage.setItem('currentImpactLocation', JSON.stringify(coordinates));
                    navigate('/simulation/globe');
                  }}
                >
                  View on Globe →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioSetup;