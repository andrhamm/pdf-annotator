import React, { Suspense, useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

// Dynamically import the App component with no SSR
const AppComponent = dynamic(
  () => import('../components/App'),
  { 
    ssr: false,
    loading: () => <div style={{ padding: '40px', textAlign: 'center' }}>Loading the PDF annotation tool...</div>
  }
);

export default function AppPage() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleError = (err) => {
      console.error("App loading error:", err);
      setError(err.message || "Failed to load the application");
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  if (error) {
    return (
      <div style={{ padding: '40px', backgroundColor: '#ffeeee', maxWidth: '800px', margin: '0 auto', borderRadius: '5px' }}>
        <h2>Application Error</h2>
        <p>There was a problem loading the PDF annotation tool:</p>
        <pre style={{ padding: '15px', background: '#f7f7f7', color: 'red', overflow: 'auto' }}>
          {error}
        </pre>
        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
          >
            Try Again
          </button>
          <a 
            href="/"
            style={{ padding: '10px 20px', background: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px' }}
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <AppComponent />
      </Suspense>
    </div>
  );
}
