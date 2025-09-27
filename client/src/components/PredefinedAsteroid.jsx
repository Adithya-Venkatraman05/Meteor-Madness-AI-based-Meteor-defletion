import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './PredefinedAsteroid.css';

const PredefinedAsteroid = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [filters, setFilters] = useState({
    asteroidType: 'all',
    diameterRange: [0, 1.5],
    velocityRange: [1, 100],
    angleRange: [5, 90],
    structure: 'all'
  });

  // Enhanced NASA SBDB data with more properties for filtering
  const mockAsteroids = [
    {
      id: '99942',
      name: 'Apophis',
      fullName: '99942 Apophis (2004 MN4)',
      diameter: 0.37,
      velocity: 30.7,
      angle: 18,
      closeApproach: '2029-04-13',
      hazardous: true,
      type: 'stony',
      structure: 'monolithic',
      popularity: 10,
      description: 'Near-Earth asteroid that will pass close to Earth in 2029'
    },
    {
      id: '101955',
      name: 'Bennu',
      fullName: '101955 Bennu (1999 RQ36)',
      diameter: 0.49,
      velocity: 27.7,
      angle: 6,
      closeApproach: '2135-09-25',
      hazardous: true,
      type: 'carbonaceous',
      structure: 'rubble-pile',
      popularity: 9,
      description: 'Carbon-rich asteroid studied by OSIRIS-REx mission'
    },
    {
      id: '1566',
      name: 'Icarus',
      fullName: '1566 Icarus',
      diameter: 1.4,
      velocity: 67.3,
      angle: 75,
      closeApproach: '2026-06-16',
      hazardous: false,
      type: 'stony',
      structure: 'monolithic',
      popularity: 7,
      description: 'Apollo-type asteroid with highly eccentric orbit'
    },
    {
      id: '4179',
      name: 'Toutatis',
      fullName: '4179 Toutatis',
      diameter: 2.5,
      velocity: 13.1,
      angle: 45,
      closeApproach: '2028-11-05',
      hazardous: false,
      type: 'stony',
      structure: 'contact-binary',
      popularity: 6,
      description: 'Elongated asteroid with complex rotation'
    },
    {
      id: '433',
      name: 'Eros',
      fullName: '433 Eros',
      diameter: 16.8,
      velocity: 19.4,
      angle: 30,
      closeApproach: '2032-01-31',
      hazardous: false,
      type: 'stony',
      structure: 'monolithic',
      popularity: 8,
      description: 'Large S-type asteroid, first asteroid orbited by spacecraft'
    },
    {
      id: '25143',
      name: 'Itokawa',
      fullName: '25143 Itokawa',
      diameter: 0.35,
      velocity: 19.2,
      angle: 8,
      closeApproach: '2030-07-22',
      hazardous: false,
      type: 'stony',
      structure: 'rubble-pile',
      popularity: 5,
      description: 'Small near-Earth asteroid visited by Hayabusa spacecraft'
    },
    {
      id: '1P',
      name: 'Halley',
      fullName: '1P/Halley',
      diameter: 11.0,
      velocity: 70.6,
      angle: 90,
      closeApproach: '2061-07-28',
      hazardous: false,
      type: 'comet',
      structure: 'icy-nucleus',
      popularity: 9,
      description: 'Famous periodic comet with 76-year orbital period'
    },
    {
      id: '16',
      name: 'Psyche',
      fullName: '16 Psyche',
      diameter: 220,
      velocity: 15.8,
      angle: 60,
      closeApproach: '2029-05-20',
      hazardous: false,
      type: 'metallic',
      structure: 'solid-metal',
      popularity: 7,
      description: 'Large metallic asteroid, possibly the core of a protoplanet'
    },
    {
      id: '2867',
      name: 'Steins',
      fullName: '2867 Steins',
      diameter: 5.3,
      velocity: 31.4,
      angle: 25,
      closeApproach: '2027-09-05',
      hazardous: false,
      type: 'stony',
      structure: 'monolithic',
      popularity: 4,
      description: 'Diamond-shaped asteroid in the main belt'
    },
    {
      id: '67P',
      name: 'Churyumov-Gerasimenko',
      fullName: '67P/Churyumov-Gerasimenko',
      diameter: 4.1,
      velocity: 38.5,
      angle: 85,
      closeApproach: '2029-11-02',
      hazardous: false,
      type: 'comet',
      structure: 'icy-nucleus',
      popularity: 6,
      description: 'Duck-shaped comet studied by ESA\'s Rosetta mission'
    }
  ];

  // Filter and sort asteroids
  const getFilteredAsteroids = () => {
    let filtered = mockAsteroids.filter(asteroid => {
      // Search query filter
      const matchesSearch = !searchQuery || 
        asteroid.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asteroid.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asteroid.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Asteroid type filter
      const matchesType = filters.asteroidType === 'all' || asteroid.type === filters.asteroidType;

      // Diameter range filter
      const matchesDiameter = asteroid.diameter >= filters.diameterRange[0] && 
                             asteroid.diameter <= filters.diameterRange[1];

      // Velocity range filter
      const matchesVelocity = asteroid.velocity >= filters.velocityRange[0] && 
                             asteroid.velocity <= filters.velocityRange[1];

      // Angle range filter
      const matchesAngle = asteroid.angle >= filters.angleRange[0] && 
                          asteroid.angle <= filters.angleRange[1];

      // Structure filter
      const matchesStructure = filters.structure === 'all' || asteroid.structure === filters.structure;

      return matchesSearch && matchesType && matchesDiameter && matchesVelocity && matchesAngle && matchesStructure;
    });

    // If no search query or filters are applied, show most popular
    if (!searchQuery && 
        filters.asteroidType === 'all' && 
        filters.diameterRange[0] === 0 && 
        filters.diameterRange[1] === 1.5 && 
        filters.velocityRange[0] === 1 && 
        filters.velocityRange[1] === 100 && 
        filters.angleRange[0] === 5 && 
        filters.angleRange[1] === 90 && 
        filters.structure === 'all') {
      filtered = filtered.sort((a, b) => b.popularity - a.popularity).slice(0, 5);
    } else {
      // Sort by popularity when filters are applied
      filtered = filtered.sort((a, b) => b.popularity - a.popularity);
    }

    return filtered;
  };

  const filteredAsteroids = getFilteredAsteroids();

  const handleAsteroidSelect = (asteroid) => {
    setSelectedAsteroid(asteroid);
  };

  const handleConfirm = () => {
    if (selectedAsteroid) {
      // Store selected asteroid data (you might want to use context or state management)
      localStorage.setItem('selectedAsteroid', JSON.stringify(selectedAsteroid));
      navigate('/simulation/scenario-setup');
    }
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

  const handleVelocityRangeChange = (newRange) => {
    setFilters(prev => ({
      ...prev,
      velocityRange: newRange
    }));
  };

  const handleAngleRangeChange = (newRange) => {
    setFilters(prev => ({
      ...prev,
      angleRange: newRange
    }));
  };

  const resetFilters = () => {
    setFilters({
      asteroidType: 'all',
      diameterRange: [0, 1.5],
      velocityRange: [1, 100],
      angleRange: [5, 90],
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
          <div className="search-box">
            <input
              type="text"
              placeholder="Search asteroids by name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
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

            {/* Velocity Range Filter */}
            <div className="control-item">
              <label>Velocity: <span className="value">{filters.velocityRange[0]} - {filters.velocityRange[1]} km/s</span></label>
              <div className="dual-range-container">
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="0.1"
                  value={filters.velocityRange[0]}
                  onChange={(e) => handleVelocityRangeChange([parseFloat(e.target.value), filters.velocityRange[1]])}
                  className="compact-slider range-min"
                />
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="0.1"
                  value={filters.velocityRange[1]}
                  onChange={(e) => handleVelocityRangeChange([filters.velocityRange[0], parseFloat(e.target.value)])}
                  className="compact-slider range-max"
                />
              </div>
              <div className="range-labels">
                <span>1 km/s</span>
                <span>100 km/s</span>
              </div>
            </div>

            {/* Angle Range Filter */}
            <div className="control-item">
              <label>Angle: <span className="value">{filters.angleRange[0]} - {filters.angleRange[1]}°</span></label>
              <div className="dual-range-container">
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="1"
                  value={filters.angleRange[0]}
                  onChange={(e) => handleAngleRangeChange([parseFloat(e.target.value), filters.angleRange[1]])}
                  className="compact-slider range-min"
                />
                <input
                  type="range"
                  min="5"
                  max="90"
                  step="1"
                  value={filters.angleRange[1]}
                  onChange={(e) => handleAngleRangeChange([filters.angleRange[0], parseFloat(e.target.value)])}
                  className="compact-slider range-max"
                />
              </div>
              <div className="range-labels">
                <span>5° grazing</span>
                <span>90° head-on</span>
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

          <div className="filter-results">
            <span>{filteredAsteroids.length} asteroids found</span>
          </div>
        </div>

        <div className="asteroids-grid">
          {filteredAsteroids.map((asteroid) => (
            <div
              key={asteroid.id}
              className={`asteroid-card ${selectedAsteroid?.id === asteroid.id ? 'selected' : ''}`}
              onClick={() => handleAsteroidSelect(asteroid)}
            >
              <div className="asteroid-header-info">
                <h3>{asteroid.name}</h3>
                <div className="badges">
                  <span className={`hazard-badge ${asteroid.hazardous ? 'hazardous' : 'safe'}`}>
                    {asteroid.hazardous ? 'PHO' : 'Safe'}
                  </span>
                  <span className={`type-badge ${asteroid.type}`}>
                    {asteroid.type.charAt(0).toUpperCase() + asteroid.type.slice(1)}
                  </span>
                </div>
              </div>
              
              <p className="asteroid-full-name">{asteroid.fullName}</p>
              
              <div className="asteroid-stats">
                <div className="stat">
                  <label>Diameter:</label>
                  <span>{asteroid.diameter} km</span>
                </div>
                <div className="stat">
                  <label>Type:</label>
                  <span>{asteroid.type.charAt(0).toUpperCase() + asteroid.type.slice(1)}</span>
                </div>
                <div className="stat">
                  <label>Structure:</label>
                  <span>{asteroid.structure.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <div className="stat">
                  <label>Next Close Approach:</label>
                  <span>{asteroid.closeApproach}</span>
                </div>
              </div>
              
              <p className="asteroid-description">{asteroid.description}</p>
            </div>
          ))}
        </div>

        {selectedAsteroid && (
          <div className="selection-confirmation">
            <div className="selected-info">
              <h3>Selected: {selectedAsteroid.name}</h3>
              <p>Continue to scenario setup with this asteroid</p>
            </div>
            <button className="confirm-btn" onClick={handleConfirm}>
              Continue to Scenario Setup →
            </button>
          </div>
        )}

        {filteredAsteroids.length === 0 && searchQuery && (
          <div className="no-results">
            <p>No asteroids found matching "{searchQuery}"</p>
            <p>Try searching for: Apophis, Bennu, Icarus, Toutatis, or Eros</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredefinedAsteroid;