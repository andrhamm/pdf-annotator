import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

import { formatTimestamp } from '../utils/saveManager';

const SaveSelector = ({ open, exactMatch, otherSaves, onSelect, onCancel }) => {
  // Update selected save when exactMatch changes
  const [selectedSaveId, setSelectedSaveId] = useState('new');

  // Reset selection when dialog opens with new data
  useEffect(() => {
    if (exactMatch?.saves?.length > 0) {
      setSelectedSaveId(exactMatch.saves[0].id);
    } else {
      setSelectedSaveId('new');
    }
  }, [exactMatch]);

  const handleConfirm = () => {
    onSelect(selectedSaveId === 'new' ? null : selectedSaveId);
  };

  // Extract and display just the first part of the ID (before any special characters)
  const formatSaveId = (id) => {
    if (!id) return '';
    // If the ID contains an underscore, only show what comes after it
    const parts = id.split('_');
    return parts.length > 1 ? parts[1] : id;
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {exactMatch ? 'Previous Saves Found' : 'Select Save'}
      </DialogTitle>
      <DialogContent>
        {exactMatch ? (
          <Typography gutterBottom>
            This file has {exactMatch.saves.length} existing save{exactMatch.saves.length > 1 ? 's' : ''}.
            You can select an existing save or create a new one.
          </Typography>
        ) : (
          <Typography gutterBottom>
            No exact match found. You can create a new save or select an existing one.
          </Typography>
        )}

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Save</InputLabel>
          <Select
            value={selectedSaveId}
            onChange={(e) => setSelectedSaveId(e.target.value)}
            label="Select Save"
          >
            <MenuItem value="new">Create New Save</MenuItem>
            
            {exactMatch?.saves.length > 0 && [
              <MenuItem key="exact-divider" divider disabled>Existing Saves</MenuItem>,
              ...exactMatch.saves.map(save => (
                <MenuItem key={save.id} value={save.id}>
                  [{formatSaveId(save.id)}] - {formatTimestamp(save.updatedAt)}
                </MenuItem>
              ))
            ]}

            {otherSaves?.length > 0 && [
              <MenuItem key="divider" divider disabled>Other Files' Saves</MenuItem>,
              ...otherSaves.flatMap(file => 
                file.saves.map(save => (
                  <MenuItem key={save.id} value={save.id}>
                    [{formatSaveId(save.id)}] - {file.fileName} ({file.pageCount} pages)
                  </MenuItem>
                ))
              )
            ]}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          {selectedSaveId === 'new' ? 'Create New Save' : 'Load Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveSelector;
