import React, { useEffect, useState } from 'react';

const DiagnosticLoader = ({ children }) => {
  const [loadingState, setLoadingState] = useState('initializing');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    try {
      setLoadingState('loading');
      // Check if we can access necessary browser APIs
      if (typeof window !== 'undefined') {
        console.log('Browser environment detected');
        
        // Check for basic browser capabilities
        if (!window.File || !window.FileReader || !window.Blob) {
          throw new Error('Your browser does not support the File and Blob APIs needed for PDF processing');
        }
        
        setLoadingState('ready');
      }
    } catch (err) {
      console.error('Error during initialization:', err);
      setError(err.toString());
      setLoadingState('error');
    }
  }, []);
  
  if (loadingState === 'initializing' || loadingState === 'loading') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading application...
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          State: {loadingState}
        </div>
      </div>
    );
  }
  
  if (loadingState === 'error') {
    return (
      <div style={{ padding: '20px', backgroundColor: '#ffeeee', borderRadius: '5px' }}>
        <h2>Error Loading Application</h2>
        <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>
        <button 
          style={{ marginTop: '15px', padding: '8px 16px', cursor: 'pointer' }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return children;
};

export default DiagnosticLoader;
