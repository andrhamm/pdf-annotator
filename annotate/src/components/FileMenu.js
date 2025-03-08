import { Box, Button, IconButton, Typography } from '@mui/material';
import React, { useRef } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

const FileMenu = ({ onFileChange, currentFile, onCloseFile, saveId }) => {
  const fileInputRef = useRef(null);

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileChange(file);
    }
  };

  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  // Format save ID for display - only show the part after the underscore
  const formatSaveId = (id) => {
    if (!id) return '';
    const parts = id.split('_');
    return parts.length > 1 ? parts[1] : id;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {currentFile ? (
        <>
          <Typography 
            variant="body1" 
            color="inherit"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <DescriptionIcon fontSize="small" />
            {currentFile.name}
            {saveId && (
              <Box component="span" sx={{ opacity: 0.8, fontFamily: 'monospace' }}>
                [{formatSaveId(saveId)}]
              </Box>
            )}
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={onCloseFile}
            size="small"
            sx={{ ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <Button
          color="inherit"
          variant="outlined"
          onClick={openFileSelector}
          startIcon={<FolderOpenIcon />}
          size="small"
        >
          Open PDF
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
    </Box>
  );
};

export default FileMenu;
