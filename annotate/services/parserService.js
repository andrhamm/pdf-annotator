/**
 * Parse a PDF page with specified margins
 */
export async function parsePageWithMargins(pdfPath, pageNumber, margins) {
  try {
    const response = await fetch('/api/parse-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfPath, pageNumber, margins }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Parse a full PDF with specified options
 */
export async function parsePDF(pdfPath, options = {}) {
  try {
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfPath, ...options }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}
