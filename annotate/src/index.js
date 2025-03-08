import './index.css';

import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Simple cleanup if needed
window.addEventListener('beforeunload', () => {
  console.log('Page unloading');
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
