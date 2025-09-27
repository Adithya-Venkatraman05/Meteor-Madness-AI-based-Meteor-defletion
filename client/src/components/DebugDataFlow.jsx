import React, { useState, useEffect } from 'react';

const DebugDataFlow = () => {
  const [asteroidData, setAsteroidData] = useState(null);
  const [rawData, setRawData] = useState('');

  useEffect(() => {
    // Get the raw data from localStorage
    const rawAsteroidData = localStorage.getItem('selectedAsteroidDetails');
    setRawData(rawAsteroidData || 'No data found');
    
    if (rawAsteroidData) {
      try {
        const parsed = JSON.parse(rawAsteroidData);
        setAsteroidData(parsed);
      } catch (error) {
        console.error('Error parsing asteroid data:', error);
      }
    }
  }, []);

  const clearData = () => {
    localStorage.removeItem('selectedAsteroidDetails');
    localStorage.removeItem('selectedAsteroid');
    setAsteroidData(null);
    setRawData('Data cleared');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h2>Debug: Asteroid Data Flow</h2>
      
      <button onClick={clearData} style={{ marginBottom: '20px', padding: '8px 16px' }}>
        Clear localStorage Data
      </button>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Raw Data from localStorage:</h3>
        <pre style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px'
        }}>
          {rawData}
        </pre>
      </div>

      {asteroidData && (
        <div>
          <h3>Parsed Data Structure:</h3>
          <div style={{ background: '#f8f8f8', padding: '10px', borderRadius: '4px' }}>
            <p><strong>Success:</strong> {String(asteroidData.success)}</p>
            <p><strong>Asteroid Name:</strong> {asteroidData.asteroid_name}</p>
            <p><strong>Search Name:</strong> {asteroidData.search_name}</p>
            <p><strong>Has Data:</strong> {String(!!asteroidData.data)}</p>
            
            {asteroidData.data && (
              <div style={{ marginLeft: '20px' }}>
                <h4>Data Object:</h4>
                <p><strong>Has Object:</strong> {String(!!asteroidData.data.object)}</p>
                <p><strong>Has phys_par:</strong> {String(!!asteroidData.data.phys_par)} ({asteroidData.data.phys_par?.length || 0} items)</p>
                <p><strong>Has orbit:</strong> {String(!!asteroidData.data.orbit)}</p>
                
                {asteroidData.data.object && (
                  <div style={{ marginLeft: '20px' }}>
                    <h5>Object Data:</h5>
                    <p><strong>Full Name:</strong> {asteroidData.data.object.fullname}</p>
                    <p><strong>Designation:</strong> {asteroidData.data.object.des}</p>
                  </div>
                )}
                
                {asteroidData.data.phys_par && asteroidData.data.phys_par.length > 0 && (
                  <div style={{ marginLeft: '20px' }}>
                    <h5>Physical Parameters ({asteroidData.data.phys_par.length}):</h5>
                    {asteroidData.data.phys_par.map((param, index) => (
                      <p key={index}><strong>{param.name}:</strong> {param.value} {param.units}</p>
                    ))}
                  </div>
                )}
                
                {asteroidData.data.orbit && (
                  <div style={{ marginLeft: '20px' }}>
                    <h5>Orbital Data:</h5>
                    <p><strong>Has elements:</strong> {String(!!asteroidData.data.orbit.elements)} ({asteroidData.data.orbit.elements?.length || 0} items)</p>
                    {asteroidData.data.orbit.elements && asteroidData.data.orbit.elements.length > 0 && (
                      <div style={{ marginLeft: '20px' }}>
                        <h6>Elements:</h6>
                        {asteroidData.data.orbit.elements.map((element, index) => (
                          <p key={index}><strong>{element.name}:</strong> {element.value} {element.units}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugDataFlow;