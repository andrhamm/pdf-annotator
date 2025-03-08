import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';

const AREA_TYPES = [
  { value: 'text', label: 'Text Content' },
  { value: 'heading', label: 'Heading' },
  { value: 'image', label: 'Image' },
  { value: 'table', label: 'Data Table' },
  { value: 'code', label: 'Code Block' },
  { value: 'list', label: 'List' }
];

const ContentAreaEditor = ({ area, onSave, onCancel, onDelete }) => {
  const handleSave = () => {
    onSave({
      ...area,
      type: area.type
    });
  };

  const handleTypeChange = (e) => {
    onSave({
      ...area,
      type: e.target.value
    });
  };

  // Calculate pixel values based on PDF container size
  const getPixelValues = () => {
    const pdfContainer = document.querySelector('.react-pdf__Page');
    if (!pdfContainer) return null;
    
    const { width, height } = pdfContainer.getBoundingClientRect();
    return {
      x: Math.round((area.x / 100) * width),
      y: Math.round((area.y / 100) * height),
      width: Math.round((area.width / 100) * width),
      height: Math.round((area.height / 100) * height)
    };
  };

  const pixelValues = getPixelValues();

  const handleDelete = () => {
    onDelete(area); // This will trigger the confirmation in MetadataForm
    onCancel(); // Close the editor immediately
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Edit Content Area</Typography>
      </Box>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        ID: {area.id}
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: 2,
        mb: 3,
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 1,
        fontFamily: 'monospace'
      }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Percentage</Typography>
          <Typography variant="body2">x: {area.x.toFixed(1)}%</Typography>
          <Typography variant="body2">y: {area.y.toFixed(1)}%</Typography>
          <Typography variant="body2">width: {area.width.toFixed(1)}%</Typography>
          <Typography variant="body2">height: {area.height.toFixed(1)}%</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Pixels</Typography>
          {pixelValues ? (
            <>
              <Typography variant="body2">x: {pixelValues.x}px</Typography>
              <Typography variant="body2">y: {pixelValues.y}px</Typography>
              <Typography variant="body2">width: {pixelValues.width}px</Typography>
              <Typography variant="body2">height: {pixelValues.height}px</Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          )}
        </Box>
      </Box>

      <FormControl fullWidth margin="normal">
        <InputLabel>Area Type</InputLabel>
        <Select
          value={area.type}
          label="Area Type"
          onChange={handleTypeChange}
        >
          {AREA_TYPES.map(type => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        gap: 1,
        mt: 3 
      }}>
        <Button 
          onClick={handleDelete}
          variant="outlined" 
          color="error"
        >
          Delete
        </Button>
        <Button onClick={handleSave} variant="contained">
          Done
        </Button>
      </Box>
    </Box>
  );
};

export default ContentAreaEditor;
