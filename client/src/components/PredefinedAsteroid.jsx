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
            backgroundColor: '#000102ff',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '20px'
          }}>
            {/* Header Information */}
            <div className="asteroid-header" style={{
              borderBottom: '2px solid #dee2e6',
              paddingBottom: '16px',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: '0 0 8px 0', color: '#b4b4b4ff' }}>
                {asteroidDetails.object?.fullname || asteroidDetails.object?.shortname || 'Unknown Asteroid'}
              </h2>
              <div className="asteroid-badges" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {asteroidDetails.object?.neo && (
                  <span style={{
                    backgroundColor: '#b4b4b4ff',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>NEO</span>
                )}
                {asteroidDetails.object?.pha && (
                  <span style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>PHA</span>
                )}
                {asteroidDetails.object?.orbit_class && (
                  <span style={{
                    backgroundColor: '#afafafff',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>{asteroidDetails.object.orbit_class.name}</span>
                )}
              </div>
              <p style={{ margin: '8px 0 0 0', color: '#6c757d' }}>
                ID: {asteroidDetails.object?.des || asteroidDetails.object?.spkid || 'N/A'}
              </p>
            </div>

            {/* Physical Parameters */}
            {asteroidDetails.phys_par && asteroidDetails.phys_par.length > 0 && (
              <div className="physical-parameters" style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#495057', marginBottom: '16px' }}>Physical Parameters</h3>
                <div className="params-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '12px'
                }}>
                  {asteroidDetails.phys_par.map((param, index) => (
                    <div key={index} className="param-item" style={{
                      backgroundColor: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                        {param.title || param.name}
                      </div>
                      <div style={{ fontSize: '16px', color: '#495057', marginBottom: '4px' }}>
                        {param.value} {param.units && <span style={{ color: '#6c757d' }}>({param.units})</span>}
                      </div>
                      {param.sigma && (
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          σ: {param.sigma}
                        </div>
                      )}
                      {param.desc && (
                        <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
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
                <h3 style={{ color: '#495057', marginBottom: '16px' }}>Orbital Elements</h3>
                <div className="orbit-info" style={{
                  backgroundColor: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div><strong>Epoch:</strong> {asteroidDetails.orbit.epoch}</div>
                    <div><strong>MOID:</strong> {asteroidDetails.orbit.moid} AU</div>
                    <div><strong>Condition Code:</strong> {asteroidDetails.orbit.condition_code}</div>
                    <div><strong>Observations Used:</strong> {asteroidDetails.orbit.n_obs_used}</div>
                    <div><strong>Data Arc:</strong> {asteroidDetails.orbit.data_arc} days</div>
                    <div><strong>RMS:</strong> {asteroidDetails.orbit.rms}</div>
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
                        backgroundColor: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                          {element.title} ({element.label})
                        </div>
                        <div style={{ fontSize: '16px', color: '#495057', marginBottom: '4px' }}>
                          {element.value} {element.units && <span style={{ color: '#6c757d' }}>({element.units})</span>}
                        </div>
                        {element.sigma && (
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
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
                <h3 style={{ color: '#495057', marginBottom: '16px' }}>Data Quality & Provenance</h3>
                <div className="quality-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}>
                  <div className="quality-item" style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>First Observation</div>
                    <div style={{ color: '#495057' }}>{asteroidDetails.orbit.first_obs || 'N/A'}</div>
                  </div>
                  <div className="quality-item" style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Last Observation</div>
                    <div style={{ color: '#495057' }}>{asteroidDetails.orbit.last_obs || 'N/A'}</div>
                  </div>
                  <div className="quality-item" style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Solution Date</div>
                    <div style={{ color: '#495057' }}>{asteroidDetails.orbit.soln_date || 'N/A'}</div>
                  </div>
                  <div className="quality-item" style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Producer</div>
                    <div style={{ color: '#495057' }}>{asteroidDetails.orbit.producer || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Continue to Scenario Setup Button */}
            <div className="action-section" style={{
              textAlign: 'center',
              paddingTop: '16px',
              borderTop: '1px solid #dee2e6'
            }}>
              <button
                onClick={() => {
                  // Store the detailed asteroid data for scenario setup
                  handleAsteroidSelect(asteroidDetails);
                }}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
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
    </div>
  );
};

export default PredefinedAsteroid;