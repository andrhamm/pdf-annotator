const API_URL = 'http://localhost:3001/api';

export const parsePageWithMargins = async (pdfPath, pageNumber, margins) => {
  try {
    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfPath,
        pageNumber,
        margins,
      }),
    });

    if (!response.ok) {
      throw new Error(`Parser request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Parser service error:', error);
    throw error;
  }
};
