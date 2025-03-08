import React, { useEffect, useState } from 'react';

const PDFWrapper = ({ children }) => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  
  useEffect(() => {
    // Check if pdfjs is available
    const loadPdf = async () => {
      try {
        // Test-import PDF.js
        await import('react-pdf');
        console.log('PDF.js loaded successfully');
        setPdfLoaded(true);
      } catch (err) {
        console.error('Error loading PDF.js:', err);
        setPdfError(err.toString());
      }
    };
    
    loadPdf();
  }, []);
  
  if (pdfError) {
    return (
      <div style={{ padding: '20px', border: '1px solid red', borderRadius: '5px', margin: '20px' }}>
        <h3>PDF Rendering Error</h3>
        <p>There was an error loading the PDF rendering library:</p>
        <pre style={{ background: '#f7f7f7', padding: '10px', overflow: 'auto' }}>
          {pdfError}
        </pre>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
  
  if (!pdfLoaded) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading PDF components...
      </div>
    );
  }
  
  return children;
};

export default PDFWrapper;
