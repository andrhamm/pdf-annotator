/**
 * Utility functions for working with PDFs
 */

/**
 * Export all metadata as a JSON file
 */
export const exportMetadataToJSON = (metadata, filename = 'pdf-metadata.json') => {
  const data = JSON.stringify(metadata, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import metadata from a JSON file
 */
export const importMetadataFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const metadata = JSON.parse(event.target.result);
        resolve(metadata);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Create an object URL for a PDF file and handle proper cleanup
 * 
 * @param {File} file PDF file to create a URL for
 * @returns {string} Object URL for the file
 */
export const createPdfObjectUrl = (file) => {
  if (!file) return null;
  return URL.createObjectURL(file);
};

/**
 * Clean up an object URL
 * 
 * @param {string} url The object URL to revoke
 */
export const revokePdfObjectUrl = (url) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};
