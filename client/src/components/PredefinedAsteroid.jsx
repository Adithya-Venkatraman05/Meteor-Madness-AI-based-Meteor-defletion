import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './PredefinedAsteroid.css';

const PredefinedAsteroid = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [asteroidDetails, setAsteroidDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const [filters, setFilters] = useState({
    asteroidType: 'all',
    diameterRange: [0, 1.5],
    structure: 'all'
  });

  // Modal state for tooltips
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal]);

  // Function to call the autocomplete API
  const fetchAutocompleteSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8001/asteroids/autocomplete?query=${encodeURIComponent(query)}&limit=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.results || []);
        setShowDropdown(true);
      } else {
        console.error('Failed to fetch autocomplete suggestions:', response.statusText);
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAutocompleteSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to fetch detailed asteroid data
  const fetchAsteroidDetails = async (asteroidName) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(
        `http://localhost:8001/asteroids/details?name=${encodeURIComponent(asteroidName)}`
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAsteroidDetails(result.data);
          return result.data;
        } else {
          console.error('No asteroid data found:', result.message);
          setAsteroidDetails(null);
          return null;
        }
      } else {
        console.error('Failed to fetch asteroid details:', response.statusText);
        setAsteroidDetails(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching asteroid details:', error);
      setAsteroidDetails(null);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    const asteroidName = suggestion.name || suggestion.display_name || '';
    setSearchQuery(asteroidName);
    setShowDropdown(false);
    setSelectedSuggestionIndex(-1);
    setSuggestions([]);
    setSelectedAsteroid(suggestion);
    
    // Fetch detailed data for the selected asteroid
    await fetchAsteroidDetails(asteroidName);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };





  const handleAsteroidSelect = (asteroidData) => {
    // Store selected asteroid data and navigate directly to scenario setup
    localStorage.setItem('selectedAsteroid', JSON.stringify(asteroidData));
    localStorage.setItem('selectedAsteroidDetails', JSON.stringify(asteroidData));
    navigate('/simulation/scenario-setup');
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleDiameterRangeChange = (newRange) => {
    setFilters(prev => ({
      ...prev,
      diameterRange: newRange
    }));
  };

  const resetFilters = () => {
    setFilters({
      asteroidType: 'all',
      diameterRange: [0, 1.5],
      structure: 'all'
    });
    setSearchQuery('');
  };

  // Function to open modal with parameter information
  const openModal = (title, description) => {
    setModalContent({ title, description });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalContent({ title: '', description: '' });
  };

  // Helper function to get tooltip explanations for physical parameters
  const getPhysicalParameterTooltip = (paramName) => {
    const tooltips = {
      'absolute magnitude': 'Brightness of the asteroid at 1 AU from both the Sun and observer. Lower H = brighter = usually larger.',
      'H': 'Brightness of the asteroid at 1 AU from both the Sun and observer. Lower H = brighter = usually larger.',
      'diameter': 'The effective size of the asteroid, typically derived from brightness and albedo.',
      'rotation period': 'Time the asteroid takes to complete one full spin on its axis.',
      'rotation': 'Time the asteroid takes to complete one full spin on its axis.',
      'geometric albedo': 'Reflectivity of the asteroid\'s surface (higher = shinier, reflects more sunlight).',
      'albedo': 'Reflectivity of the asteroid\'s surface (higher = shinier, reflects more sunlight).',
      'B-V': 'Color index (blue minus visual); indicates surface composition and age.',
      'U-B': 'Color index (ultraviolet minus blue); also helps identify asteroid composition/spectral type.',
      'extent': 'The asteroid\'s dimensions (length × width × height). Irregular shapes can affect how it tumbles through space.',
      'mass': 'How much matter the asteroid contains. Heavier asteroids are harder to deflect but carry more destructive energy.',
      'density': 'How tightly packed the asteroid\'s material is. Higher density often means solid rock/metal, lower density suggests rubble pile.',
      'slope parameter': 'How asteroid brightness changes with viewing angle. Helps determine surface composition and roughness.',
      'G': 'Phase slope parameter - describes how brightness changes with sun-earth-asteroid angle. Indicates surface properties.'
    };
    
    const key = Object.keys(tooltips).find(k => paramName.toLowerCase().includes(k.toLowerCase()));
    return key ? tooltips[key] : 'Physical property of the asteroid that affects its behavior, detectability, and potential impact effects.';
  };

  // Helper function to get tooltip explanations for orbital elements
  const getOrbitalElementTooltip = (elementLabel) => {
    const tooltips = {
      'e': 'How stretched the orbit is (0 = circular, closer to 1 = elongated).',
      'a': 'Average distance from the asteroid to the Sun (in AU).',
      'q': 'Closest point to the Sun in the orbit.',
      'i': 'Tilt of the orbit relative to the solar system\'s plane.',
      'om': 'Where the orbit crosses the reference plane from south to north.',
      'node': 'Where the orbit crosses the reference plane from south to north.',
      'omega': 'Where the orbit crosses the reference plane from south to north.',
      'w': 'Angle describing where perihelion lies within the orbit.',
      'peri': 'Angle describing where perihelion lies within the orbit.',
      'ma': 'Position of the asteroid in its orbit at the given epoch.',
      'M': 'Position of the asteroid in its orbit at the given epoch.',
      'tp': 'Exact time when the asteroid last passed its closest point to the Sun.',
      'per': 'Time to complete one orbit around the Sun.',
      'period': 'Time to complete one orbit around the Sun.',
      'n': 'Average angular speed of the asteroid along its orbit.',
      'ad': 'Farthest point from the Sun in the orbit.',
      'Q': 'Farthest point from the Sun in the orbit.',
      'epoch': 'Reference date for which these orbital elements are calculated.',
      'moid': 'Closest distance the asteroid\'s orbit comes to Earth\'s orbit (important for hazard assessment).',
      'condition_code': 'Quality of orbit determination (0 = very certain, 9 = very uncertain).',
      'n_obs_used': 'Number of observations contributing to orbit calculation.',
      'data_arc': 'Time span between the first and last observations of the asteroid.',
      'rms': 'Root mean square of orbital fit residuals; lower = more accurate orbit.'
    };
    
    return tooltips[elementLabel.toLowerCase()] || 'Orbital parameter that describes how the asteroid moves through space, affecting its predictability and approach to Earth.';
  };

  // Modal Component
  const InfoModal = () => {
    if (!showModal) return null;

    return (
      <div 
        className="modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // background: 'linear-gradient(135deg, rgba(0, 15, 35, 0.85), rgba(0, 5, 15, 0.9))',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(2px)'
        }}
        onClick={closeModal}
      >
        <div 
          className="modal-content"
          style={{
            background: 'linear-gradient(135deg, rgba(85, 83, 83, 0.82), rgba(109, 109, 109, 0.8))',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            color: '#ffffff',
            backdropFilter: 'blur(15px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeModal}
            style={{
              position: 'absolute',
              top: '15px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '25%',
              width: '35px',
              height: '35px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 75, 75, 0.2)';
              e.target.style.color = '#ff6b6b';
              e.target.style.transform = 'scale(1.1)';
              e.target.style.borderColor = 'rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = '#ffffff';
              e.target.style.transform = 'scale(1)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            x
          </button>
          
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#ffffff',
            borderBottom: '3px solid #4ecdc4',
            paddingBottom: '10px',
            paddingRight: '50px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            {modalContent.title}
          </h3>
          
          <p style={{
            margin: 0,
            fontSize: '1.1rem',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            {modalContent.description}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="predefined-asteroid">
      <div className="predefined-container">
        <div className="predefined-header">
          <Link to="/simulation" className="back-btn">← Back to Mode Selection</Link>
          <h1 className="predefined-title">Select Predefined Asteroid</h1>
        </div>

        <div className="search-section">
          <div className="search-box" style={{ position: 'relative' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search asteroids by name (e.g., Apophis, Bennu, Icarus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              className="search-input"
              autoComplete="off"
            />
            {isLoading && (
              <div className="search-loading" style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                color: '#666'
              }}>
                Searching...
              </div>
            )}
            {showDropdown && suggestions.length > 0 && (
              <div 
                ref={dropdownRef}
                className="autocomplete-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.pdes || index}
                    className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                      backgroundColor: index === selectedSuggestionIndex ? '#f0f8ff' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {suggestion.name || 'Unknown'}
                    </div>
                    {suggestion.pdes && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        ID: {suggestion.pdes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {showDropdown && suggestions.length === 0 && !isLoading && searchQuery.length >= 2 && (
              <div 
                ref={dropdownRef}
                className="autocomplete-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  padding: '16px',
                  textAlign: 'center',
                  color: '#666'
                }}
              >
                No asteroids found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        <div className="filter-section compact">
          <div className="filter-header">
            <h3 className="section-title">Filter Asteroids</h3>
            <button className="reset-filters-btn" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <div className="filter-controls-grid">
            {/* Asteroid Type Filter */}
            <div className="control-item">
              <label>Type</label>
              <select
                value={filters.asteroidType}
                onChange={(e) => handleFilterChange('asteroidType', e.target.value)}
                className="compact-select"
              >
                <option value="all">All Types</option>
                <option value="stony">Stony (S-type)</option>
                <option value="carbonaceous">Carbonaceous (C-type)</option>
                <option value="metallic">Metallic (M-type)</option>
                <option value="comet">Comet</option>
              </select>
            </div>

            {/* Diameter Range Filter */}
            <div className="control-item">
              <label>Diameter: <span className="value">{filters.diameterRange[0]} - {filters.diameterRange[1]} km</span></label>
              <div className="dual-range-container">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={filters.diameterRange[0]}
                  onChange={(e) => handleDiameterRangeChange([parseFloat(e.target.value), filters.diameterRange[1]])}
                  className="compact-slider range-min"
                />
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={filters.diameterRange[1]}
                  onChange={(e) => handleDiameterRangeChange([filters.diameterRange[0], parseFloat(e.target.value)])}
                  className="compact-slider range-max"
                />
              </div>
              <div className="range-labels">
                <span>0 km</span>
                <span>1.5 km</span>
              </div>
            </div>

            {/* Structure Filter */}
            <div className="control-item">
              <label>Structure</label>
              <select
                value={filters.structure}
                onChange={(e) => handleFilterChange('structure', e.target.value)}
                className="compact-select"
              >
                <option value="all">All Structures</option>
                <option value="monolithic">Monolithic</option>
                <option value="rubble-pile">Rubble Pile</option>
                <option value="contact-binary">Contact Binary</option>
                <option value="icy-nucleus">Icy Nucleus</option>
                <option value="solid-metal">Solid Metal</option>
              </select>
            </div>
          </div>


        </div>

        {/* Detailed Asteroid Data Display */}
        {loadingDetails && (
          <div className="loading-details" style={{
            textAlign: 'center',
            padding: '40px',
            fontSize: '18px',
            color: '#666'
          }}>
            Loading asteroid details...
          </div>
        )}

        {asteroidDetails && (
          <div className="asteroid-details" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(245, 245, 245, 0.05))',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            marginTop: '24px',
            backdropFilter: 'blur(15px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Header Information */}
            <div className="asteroid-header" style={{
              borderBottom: '2px solid rgba(78, 205, 196, 0.3)',
              paddingBottom: '20px',
              marginBottom: '24px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h2 style={{ 
                margin: '0 0 12px 0', 
                color: '#ffffff',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                {asteroidDetails.object?.fullname || asteroidDetails.object?.shortname || 'Unknown Asteroid'}
              </h2>
              <div className="asteroid-badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {asteroidDetails.object?.neo && (
                  <span style={{
                    background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                    color: '#333',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.3)'
                  }}>NEO</span>
                )}
                {asteroidDetails.object?.pha && (
                  <span style={{
                    background: 'linear-gradient(45deg, #dee2e6, #ced4da)',
                    color: '#495057',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(222, 226, 230, 0.3)'
                  }}>PHA</span>
                )}
                {asteroidDetails.object?.orbit_class && (
                  <span style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  }}>{asteroidDetails.object.orbit_class.name}</span>
                )}
              </div>
              <p style={{ 
                margin: '12px 0 0 0', 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1.1rem',
                fontWeight: '500'
              }}>
                ID: <span style={{ color: '#f8f9fa', fontWeight: 'bold' }}>{asteroidDetails.object?.des || asteroidDetails.object?.spkid || 'N/A'}</span>
              </p>
            </div>

            {/* Physical Parameters */}
            {asteroidDetails.phys_par && asteroidDetails.phys_par.length > 0 && (
              <div className="physical-parameters" style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  color: '#f8f9fa', 
                  marginBottom: '20px',
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                  paddingBottom: '8px'
                }}>Physical Parameters</h3>
                <div className="params-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '12px'
                }}>
                  {asteroidDetails.phys_par.map((param, index) => (
                    <div key={index} className="param-item" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 138, 45, 0.2)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      {/* Info Button */}
                      <div 
                        className="info-button"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: '#ffffff',
                          cursor: 'help',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => openModal(
                          param.title || param.name,
                          getPhysicalParameterTooltip(param.title || param.name)
                        )}
                      >
                        i
                      </div>
                      
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#ffffff', 
                        marginBottom: '6px',
                        fontSize: '1.1rem',
                        paddingRight: '30px'
                      }}>
                        {param.title || param.name}
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        color: '#e9ecef', 
                        marginBottom: '6px',
                        fontWeight: '600'
                      }}>
                        {param.value} {param.units && <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>({param.units})</span>}
                      </div>
                      {param.sigma && (
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                          σ: {param.sigma}
                        </div>
                      )}
                      {param.desc && (
                        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '6px' }}>
                          {param.desc}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orbital Elements */}
            {asteroidDetails.orbit && (
              <div className="orbital-elements" style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  color: '#4ecdc4', 
                  marginBottom: '20px',
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  borderBottom: '2px solid rgba(78, 205, 196, 0.3)',
                  paddingBottom: '8px'
                }}>Orbital Elements</h3>
                <div className="orbit-info" style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 138, 45, 0.2)',
                  marginBottom: '20px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', position: 'relative', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div 
                        className="info-button"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                          cursor: 'help',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => openModal('Epoch', 'Reference date for which these orbital elements are calculated.')}
                      >
                        i
                      </div>
                      <strong style={{ color: '#f8f9fa' }}>Epoch:</strong> {asteroidDetails.orbit.epoch}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', position: 'relative', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div 
                        className="info-button"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                          cursor: 'help',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => openModal('MOID (Minimum Orbit Intersection Distance)', "Closest distance the asteroid's orbit comes to Earth's orbit (important for hazard assessment).")}
                      >
                        i
                      </div>
                      <strong style={{ color: '#f8f9fa' }}>MOID:</strong> {asteroidDetails.orbit.moid} AU
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', position: 'relative', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div 
                        className="info-button"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                          cursor: 'help',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => openModal('Condition Code', 'Quality of orbit determination (0 = very certain, 9 = very uncertain).')}
                      >
                        i
                      </div>
                      <strong style={{ color: '#f8f9fa' }}>Condition Code:</strong> {asteroidDetails.orbit.condition_code}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', position: 'relative', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div 
                        className="info-button"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                          cursor: 'help',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => openModal('Observations Used', 'Number of observations contributing to orbit calculation.')}
                      >
                        i
                      </div>
                      <strong style={{ color: '#f8f9fa' }}>Observations Used:</strong> {asteroidDetails.orbit.n_obs_used}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', position: 'relative', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div 
                        className="info-button"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                          cursor: 'help',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => openModal('Data Arc', 'Time span between the first and last observations of the asteroid.')}
                      >
                        i
                      </div>
                      <strong style={{ color: '#f8f9fa' }}>Data Arc:</strong> {asteroidDetails.orbit.data_arc} days
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)', position: 'relative', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div 
                        className="info-button"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#ffffff',
                          cursor: 'help',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                          e.target.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                        onClick={() => openModal('RMS (Root Mean Square)', 'Root mean square of orbital fit residuals; lower = more accurate orbit.')}
                      >
                        i
                      </div>
                      <strong style={{ color: '#f8f9fa' }}>RMS:</strong> {asteroidDetails.orbit.rms}
                    </div>
                  </div>
                </div>
                
                {asteroidDetails.orbit.elements && (
                  <div className="elements-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '12px'
                  }}>
                    {asteroidDetails.orbit.elements.map((element, index) => (
                      <div key={index} className="element-item" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        position: 'relative'
                      }}>
                        {/* Info Button */}
                        <div 
                          className="info-button"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: '#ffffff',
                            cursor: 'help',
                            fontWeight: 'bold',
                            fontStyle: 'italic',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                            e.target.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.target.style.transform = 'scale(1)';
                          }}
                          onClick={() => openModal(
                            `${element.title} (${element.label})`,
                            getOrbitalElementTooltip(element.label)
                          )}
                        >
                          i
                        </div>
                        
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: '#ffffff', 
                          marginBottom: '6px',
                          fontSize: '1.1rem',
                          paddingRight: '30px'
                        }}>
                          {element.title} ({element.label})
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          color: '#e9ecef', 
                          marginBottom: '6px',
                          fontWeight: '600'
                        }}>
                          {element.value} {element.units && <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>({element.units})</span>}
                        </div>
                        {element.sigma && (
                          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                            σ: {element.sigma}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Data Quality Information */}
            {asteroidDetails.orbit && (
              <div className="data-quality" style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  color: '#4ecdc4', 
                  marginBottom: '20px',
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  borderBottom: '2px solid rgba(78, 205, 196, 0.3)',
                  paddingBottom: '8px'
                }}>Data Quality & Provenance</h3>
                <div className="quality-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <div className="quality-item" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(78, 205, 196, 0.2)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <div 
                      className="info-button"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#ffffff',
                        cursor: 'help',
                        fontWeight: 'bold',
                        fontStyle: 'italic',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      onClick={() => openModal('First Observation', 'When this asteroid was first spotted by astronomers. Older observations mean more reliable orbit predictions.')}
                    >
                      i
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '4px', paddingRight: '30px' }}>First Observation</div>
                    <div style={{ color: '#e9ecef', fontWeight: '600' }}>{asteroidDetails.orbit.first_obs || 'N/A'}</div>
                  </div>
                  <div className="quality-item" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(78, 205, 196, 0.2)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <div 
                      className="info-button"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#ffffff',
                        cursor: 'help',
                        fontWeight: 'bold',
                        fontStyle: 'italic',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      onClick={() => openModal('Last Observation', 'The most recent observation of this asteroid. Recent observations provide more accurate current position data.')}
                    >
                      i
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '4px', paddingRight: '30px' }}>Last Observation</div>
                    <div style={{ color: '#4ecdc4', fontWeight: '600' }}>{asteroidDetails.orbit.last_obs || 'N/A'}</div>
                  </div>
                  <div className="quality-item" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(78, 205, 196, 0.2)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <div 
                      className="info-button"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#ffffff',
                        cursor: 'help',
                        fontWeight: 'bold',
                        fontStyle: 'italic',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      onClick={() => openModal('Solution Date', 'When these orbital calculations were last updated. More recent solutions are generally more accurate.')}
                    >
                      i
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '4px', paddingRight: '30px' }}>Solution Date</div>
                    <div style={{ color: '#4ecdc4', fontWeight: '600' }}>{asteroidDetails.orbit.soln_date || 'N/A'}</div>
                  </div>
                  <div className="quality-item" style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(78, 205, 196, 0.2)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <div 
                      className="info-button"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: '#ffffff',
                        cursor: 'help',
                        fontWeight: 'bold',
                        fontStyle: 'italic',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'scale(1)';
                      }}
                      onClick={() => openModal('Producer', 'The organization or system that calculated these orbital parameters (e.g., JPL, MPC). Different producers may have slightly different accuracy.')}
                    >
                      i
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '4px', paddingRight: '30px' }}>Producer</div>
                    <div style={{ color: '#4ecdc4', fontWeight: '600' }}>{asteroidDetails.orbit.producer || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Continue to Scenario Setup Button */}
            <div className="action-section" style={{
              textAlign: 'center',
              paddingTop: '24px',
              borderTop: '2px solid rgba(255, 255, 255, 0.3)',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  // Store the detailed asteroid data for scenario setup
                  handleAsteroidSelect(asteroidDetails);
                }}
                style={{
                  background: 'linear-gradient(45deg, #f8f9fa, #e9ecef)',
                  color: '#495057',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(255, 255, 255, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(255, 255, 255, 0.3)';
                }}
              >
                Continue to Scenario Setup
              </button>
            </div>
          </div>
        )}



        {!selectedAsteroid && !loadingDetails && !searchQuery && (
          <div className="search-instructions" style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <h3>Search for an Asteroid</h3>
            <p>Type the name of an asteroid in the search box above to get detailed information from NASA's database.</p>
            <p>Try searching for: <strong>Apophis</strong>, <strong>Bennu</strong>, <strong>Icarus</strong>, <strong>Toutatis</strong>, or <strong>Eros</strong></p>
          </div>
        )}
      </div>
      
      {/* Info Modal */}
      <InfoModal />
    </div>
  );
};

export default PredefinedAsteroid;