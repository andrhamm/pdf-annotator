import * as Yup from 'yup';

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Field, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';

import ContentAreaEditor from './ContentAreaEditor';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { StrictModeDroppable } from './StrictModeDroppable'; // We'll create this

// Validation schema for the form
const MetadataSchema = Yup.object().shape({
  pageType: Yup.string()
    .required('Page type is required'),
  tags: Yup.array()
    .of(Yup.string())
    .max(10, 'Maximum 10 tags allowed'),
 });

const MetadataForm = ({ 
  margins, 
  onMarginsChange, 
  pageNumber, 
  totalPages, 
  existingMetadata, 
  onSave, 
  showMargins, 
  onShowMarginsChange,
  marginPresets,
  onSavePreset,
  contentAreas,
  onAddContentArea,
  onUpdateContentArea,
  onAreaHover,
  hoveredAreaId, // Add this prop
  onStartEditingArea,
  onFinishEditingArea,
  currentArea,
  drawMode,
  onDrawModeChange,
  editingAreaId, // Add this prop
  onReorderContentAreas
}) => {
  const [newPresetDialogOpen, setNewPresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingArea, setEditingArea] = useState(null);
  const [deleteConfirmArea, setDeleteConfirmArea] = useState(null);

  // Auto-enter edit mode for new areas
  useEffect(() => {
    // Find any newly added area (it will be the last one in the list)
    const newArea = contentAreas[contentAreas.length - 1];
    if (newArea && !editingArea) {
      handleEditArea(newArea);
    }
  }, [contentAreas.length]); // Only run when the number of areas changes

  useEffect(() => {
    // When editingAreaId changes, set the editing area
    if (editingAreaId) {
      const area = contentAreas.find(area => area.id === editingAreaId);
      if (area) {
        setEditingArea(area);
      }
    } else {
      setEditingArea(null);
    }
  }, [editingAreaId, contentAreas]);

  const handleClearMargins = () => {
    // Set all margins to 0
    onMarginsChange({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    });
  };

  const handlePresetChange = (event) => {
    const presetName = event.target.value;
    if (presetName === 'save_new') {
      setNewPresetDialogOpen(true);
    } else if (presetName) {
      onMarginsChange(marginPresets[presetName]);
    }
  };

  const handleSaveNewPreset = () => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim(), margins);
      setNewPresetName('');
      setNewPresetDialogOpen(false);
    }
  };

  const handleEditArea = (area) => {
    setEditingArea(area);
    onStartEditingArea(area);
  };

  const handleDeleteClick = (area) => {
    setDeleteConfirmArea(area);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmArea) {
      onUpdateContentArea(deleteConfirmArea.id, { deleted: true });
      setDeleteConfirmArea(null);
      // If we're deleting while editing, close the editor
      if (editingArea && editingArea.id === deleteConfirmArea.id) {
        setEditingArea(null);
        onFinishEditingArea();
      }
    }
  };

  const handleSaveAreaEdit = (updatedArea) => {
    onUpdateContentArea(updatedArea.id, updatedArea);
    setEditingArea(null);
    onFinishEditingArea();
  };

  const handleCancelEdit = () => {
    setEditingArea(null);
    onFinishEditingArea();
  };

  const handleAreaMouseEnter = (areaId) => {
    onAreaHover(areaId);
  };

  const handleAreaMouseLeave = () => {
    onAreaHover(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorderContentAreas(result.source.index, result.destination.index);
  };

  // Initial values for the form
  const initialValues = {
    pageType: '',
    tags: [],
    ...existingMetadata
  };

  // Page types for the dropdown
  const pageTypes = [
    'Title Page',
    'Table of Contents',
    'Chapter Start',
    'Image Page',
    'Map',
    'Data/Table',
    'Index',
    'Appendix',
    'Other',
  ];

  // Handle form submission
  const handleSubmit = (values, { setSubmitting }) => {
    onSave(values);
    setSubmitting(false);
  };

  // Handle tag input
  const handleTagInput = (e, setFieldValue, values) => {
    if (e.key === 'Enter' && e.target.value) {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (tag && !values.tags.includes(tag)) {
        setFieldValue('tags', [...values.tags, tag]);
      }
      e.target.value = '';
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove, setFieldValue, values) => {
    setFieldValue(
      'tags',
      values.tags.filter(tag => tag !== tagToRemove)
    );
  };

  // Prevent form events from bubbling up and affecting other components
  const handleFormClick = (e) => {
    // Stop propagation to prevent affecting the PDF viewer
    e.stopPropagation();
  };

  // Format margin display value
  const getMarginDisplay = (side, value) => {
    // For right/bottom margins, show the value as negative
    // For top/left margins, show the value as positive
    if (side === 'right' || side === 'bottom') {
      return value; // This is already negative
    }
    return value; // This is already positive
  };

  const handleMarginChange = (edge, value) => {
    // Ensure integer values
    const intValue = parseInt(value, 10) || 0;
    
    // Apply constraints based on edge type
    let validValue = intValue;
    if (edge === 'right' || edge === 'bottom') {
      // Right and bottom can only be 0 or negative
      validValue = Math.min(0, intValue);
    } else {
      // Top and left can only be 0 or positive
      validValue = Math.max(0, intValue);
    }
    
    onMarginsChange({
      ...margins,
      [edge]: validValue
    });
  };

  if (editingArea) {
    return (
      <Paper elevation={1} sx={{ p: 2 }} onClick={handleFormClick}>
        <ContentAreaEditor
          area={currentArea || editingArea} // Use currentArea for live updates
          onSave={handleSaveAreaEdit}
          onCancel={handleCancelEdit}
          onDelete={handleDeleteClick} // Add this prop to reuse existing delete logic
        />
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2 }} onClick={handleFormClick}>
      <Typography variant="h6" gutterBottom>
        Metadata for Page {pageNumber} {totalPages ? `of ${totalPages}` : ''}
      </Typography>
      
      <Formik
        initialValues={initialValues}
        validationSchema={MetadataSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, errors, touched, values, setFieldValue }) => (
          <Form onClick={handleFormClick}>

            <Box mb={3}>
              <FormControl fullWidth variant="outlined" margin="normal">
                <InputLabel id="page-type-label">Page Type</InputLabel>
                <Field
                  as={Select}
                  labelId="page-type-label"
                  label="Page Type"
                  name="pageType"
                  error={touched.pageType && Boolean(errors.pageType)}
                >
                  {pageTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Field>
                {touched.pageType && errors.pageType && (
                  <Typography color="error" variant="caption">{errors.pageType}</Typography>
                )}
              </FormControl>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Add tags (press Enter after each tag)"
                onKeyDown={(e) => handleTagInput(e, setFieldValue, values)}
                margin="normal"
              />
              <Box display="flex" flexWrap="wrap" mt={1} gap={1}>
                {values.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag, setFieldValue, values)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              {touched.tags && errors.tags && (
                <Typography color="error" variant="caption">{errors.tags}</Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: 2 
              }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Content Margins (pixels)
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showMargins}
                      onChange={(e) => onShowMarginsChange(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Show"
                  sx={{ mr: 0 }}
                />
              </Box>

              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                mb: 2 
              }}>
                <FormControl size="small" sx={{ flexGrow: 1 }}>
                  <Select
                    value=""
                    onChange={handlePresetChange}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select Preset
                    </MenuItem>
                    <MenuItem value="save_new">
                      💾 Save Current as Preset...
                    </MenuItem>
                    <Divider />
                    {Object.keys(marginPresets).map(name => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearMargins}
                  sx={{ minWidth: 'auto' }}
                >
                  Clear
                </Button>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  key="top"
                  label="Top"
                  type="number"
                  size="small"
                  value={Math.round(margins.top)}
                  onChange={(e) => handleMarginChange('top', e.target.value)}
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      max: 200,
                      style: { textAlign: 'right' }
                    }
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  key="right"
                  label="Right"
                  type="number"
                  size="small"
                  value={getMarginDisplay('right', margins.right)}
                  onChange={(e) => handleMarginChange('right', e.target.value)}
                  InputProps={{
                    inputProps: { 
                      min: -200,
                      max: 0,
                      style: { textAlign: 'right' }
                    }
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  key="bottom"
                  label="Bottom"
                  type="number"
                  size="small"
                  value={getMarginDisplay('bottom', margins.bottom)}
                  onChange={(e) => handleMarginChange('bottom', e.target.value)}
                  InputProps={{
                    inputProps: { 
                      min: -200,
                      max: 0,
                      style: { textAlign: 'right' }
                    }
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  key="left"
                  label="Left"
                  type="number"
                  size="small"
                  value={Math.round(margins.left)}
                  onChange={(e) => handleMarginChange('left', e.target.value)}
                  InputProps={{
                    inputProps: { 
                      min: 0,
                      max: 200,
                      style: { textAlign: 'right' }
                    }
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ mb: 1 }}
                />
              </Box>

              {/* New Preset Dialog */}
              <Dialog 
                open={newPresetDialogOpen} 
                onClose={() => setNewPresetDialogOpen(false)}
              >
                <DialogTitle>Save New Margin Preset</DialogTitle>
                <DialogContent>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Preset Name"
                    fullWidth
                    variant="outlined"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setNewPresetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNewPreset} variant="contained">
                    Save
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: 2 
              }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Content Areas
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={drawMode}
                        onChange={(e) => onDrawModeChange(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Draw Mode"
                    sx={{ mr: 0 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onAddContentArea}
                    disabled={drawMode}
                  >
                    Add Area
                  </Button>
                </Box>
              </Box>

              <DragDropContext onDragEnd={handleDragEnd}>
                <StrictModeDroppable droppableId="content-areas-list">
                  {(provided) => (
                    <Box
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{ 
                        minHeight: '100px',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      {contentAreas.filter(area => !area.deleted).map((area, index) => (
                        <Draggable 
                          key={area.id} 
                          draggableId={area.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onMouseEnter={() => onAreaHover(area.id)}
                              onMouseLeave={handleAreaMouseLeave}
                              sx={{ 
                                p: 1,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: hoveredAreaId === area.id ? 'primary.main' : 'divider',
                                bgcolor: snapshot.isDragging ? 'action.selected' : 
                                        hoveredAreaId === area.id ? 'action.hover' : 'background.paper',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                position: 'relative', // Important for dragging
                                '&:hover .area-actions': {
                                  opacity: 1
                                }
                              }}
                            >
                              <Typography sx={{ 
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}>
                                {area.index + 1}
                              </Typography>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                                  {area.id}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {area.type}
                                </Typography>
                              </Box>
                              <Box 
                                className="area-actions" 
                                sx={{ 
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  display: 'flex',
                                  gap: 1
                                }}
                              >
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditArea(area)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteClick(area)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </StrictModeDroppable>
              </DragDropContext>

              {/* Delete Confirmation Dialog */}
              <Dialog
                open={Boolean(deleteConfirmArea)}
                onClose={() => setDeleteConfirmArea(null)}
              >
                <DialogTitle>Delete Content Area</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to delete "{deleteConfirmArea?.name}"? This action cannot be undone.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button 
                    onClick={() => setDeleteConfirmArea(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleDeleteConfirm}
                    variant="contained"
                    color="error"
                    autoFocus
                  >
                    Delete
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>

            <Box display="flex" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={<SaveIcon />}
              >
                Save Metadata
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default MetadataForm;
