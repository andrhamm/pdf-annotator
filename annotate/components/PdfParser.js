import React, { useState } from 'react';
import { Button, Box, CircularProgress, TextField, Typography, Alert } from '@mui/material';

const PdfParser = ({ pdfPath, onParseComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState('');
  const [detailed, setDetailed] = useState(false);
  
  const handleParse = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfPath,
          pageNumber: pageNumber || undefined,
          detailed,
          // Add other options as needed
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse PDF');
      }
      
      const data = await response.json();
      onParseComplete(data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Parse PDF
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <TextField
        label="Page Number (optional)"
        value={pageNumber}
        onChange={(e) => setPageNumber(e.target.value)}
        type="number"
        size="small"
        sx={{ mr: 2 }}
      />
      
      <Button
        variant="contained"
        onClick={handleParse}
        disabled={loading || !pdfPath}
      >
        {loading ? <CircularProgress size={24} /> : 'Parse PDF'}
      </Button>
    </Box>
  );
};

export default PdfParser;
