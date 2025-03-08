import React, { useRef } from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

const FileUploader = ({ onFileChange }) => {
  const fileInputRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      onFileChange(file);
    } else {
      alert('Please select a valid PDF file');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Select a PDF file to annotate
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleButtonClick}
          startIcon={<UploadFileIcon />}
        >
          Choose PDF File
        </Button>
      </Box>
    </Paper>
  );
};

export default FileUploader;
