/**
 * Utility for better debug logging
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level (change to adjust verbosity)
let currentLogLevel = LOG_LEVELS.INFO;

// Enable debug mode based on URL parameter or localStorage
if (typeof window !== 'undefined') {
  if (window.location.search.includes('debug=true') || 
      localStorage.getItem('pdf_debug') === 'true') {
    currentLogLevel = LOG_LEVELS.DEBUG;
    console.log('🐞 PDF Debug logging enabled');
  }
}

// Logger functions
export const logger = {
  debug: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.log(`📄 [PDF-DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.log(`📄 [PDF-INFO] ${message}`, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(`📄 [PDF-WARN] ${message}`, ...args);
    }
  },
  
  error: (message, ...args) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(`📄 [PDF-ERROR] ${message}`, ...args);
    }
  }
};

// Enable debug mode
export const enableDebug = () => {
  currentLogLevel = LOG_LEVELS.DEBUG;
  localStorage.setItem('pdf_debug', 'true');
  logger.info('Debug mode enabled');
};

// Disable debug mode
export const disableDebug = () => {
  currentLogLevel = LOG_LEVELS.INFO;
  localStorage.setItem('pdf_debug', 'false');
  logger.info('Debug mode disabled');
};

// Add console command for enabling debug
if (typeof window !== 'undefined') {
  window.enablePdfDebug = enableDebug;
  window.disablePdfDebug = disableDebug;
}

export default logger;
