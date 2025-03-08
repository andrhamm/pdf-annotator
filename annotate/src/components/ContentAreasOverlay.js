import { Box, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

const ContentAreasOverlay = ({ areas, onAreaUpdate, hoveredAreaId, editingAreaId, drawMode, onAddArea, onStartEdit, onFinishEdit }) => {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [drawStart, setDrawStart] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewBox, setPreviewBox] = useState(null);

  const handleMouseDown = (e, area) => {
    // Prevent interaction if we're editing a different area
    if (editingAreaId && editingAreaId !== area.id) return;

    e.preventDefault();
    e.stopPropagation();
    setDragging(area.id);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialX: area.x,
      initialY: area.y
    });
    document.body.style.userSelect = 'none';
  };

  const handleResizeStart = (e, area, handle) => {
    // Prevent interaction if we're editing a different area
    if (editingAreaId && editingAreaId !== area.id) return;

    e.preventDefault();
    e.stopPropagation();
    setResizing({ id: area.id, handle });
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      initialWidth: area.width,
      initialHeight: area.height,
      initialX: area.x,
      initialY: area.y
    });
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;

    if (dragging && dragStart) {
      const container = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / container.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / container.height) * 100;
      
      const updates = {
        x: dragStart.initialX + deltaX,
        y: dragStart.initialY + deltaY
      };
      onAreaUpdate(dragging, updates);
    } else if (resizing && resizeStart) {
      const container = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - resizeStart.x) / container.width) * 100;
      const deltaY = ((e.clientY - resizeStart.y) / container.height) * 100;
      
      const updates = {};
      const minSize = 0.5; // Reduced from 5 to 0.5 percent

      switch (resizing.handle) {
        case 'e':
          updates.width = Math.max(minSize, resizeStart.initialWidth + deltaX);
          break;
        case 'w':
          updates.width = Math.max(minSize, resizeStart.initialWidth - deltaX);
          updates.x = resizeStart.initialX + deltaX;
          break;
        case 's':
          updates.height = Math.max(minSize, resizeStart.initialHeight + deltaY);
          break;
        case 'n':
          updates.height = Math.max(minSize, resizeStart.initialHeight - deltaY);
          updates.y = resizeStart.initialY + deltaY;
          break;
        case 'se':
          updates.width = Math.max(minSize, resizeStart.initialWidth + deltaX);
          updates.height = Math.max(minSize, resizeStart.initialHeight + deltaY);
          break;
        case 'sw':
          updates.width = Math.max(minSize, resizeStart.initialWidth - deltaX);
          updates.x = resizeStart.initialX + deltaX;
          updates.height = Math.max(minSize, resizeStart.initialHeight + deltaY);
          break;
        case 'ne':
          updates.width = Math.max(minSize, resizeStart.initialWidth + deltaX);
          updates.height = Math.max(minSize, resizeStart.initialHeight - deltaY);
          updates.y = resizeStart.initialY + deltaY;
          break;
        case 'nw':
          updates.width = Math.max(minSize, resizeStart.initialWidth - deltaX);
          updates.x = resizeStart.initialX + deltaX;
          updates.height = Math.max(minSize, resizeStart.initialHeight - deltaY);
          updates.y = resizeStart.initialY + deltaY;
          break;
      }

      onAreaUpdate(resizing.id, updates);
    }
  };

  const handleMouseUp = () => {
    if (dragging || resizing) {
      document.body.style.userSelect = '';
      setDragging(null);
      setDragStart(null);
      setResizing(null);
      setResizeStart(null);
    }
  };

  const handleContainerMouseDown = (e) => {
    // Exit edit mode if clicking outside any content area
    if (editingAreaId && e.target === containerRef.current) {
      e.preventDefault();
      e.stopPropagation();
      onFinishEdit();
      return;
    }

    // Prevent drawing if we're editing an area
    if (!drawMode || editingAreaId) return;
    
    // Prevent when clicking on existing areas
    if (e.target !== containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - container.left) / container.width) * 100;
    const y = ((e.clientY - container.top) / container.height) * 100;
    
    setDrawStart({ x, y });
    setIsDrawing(true);
  };

  const handleContainerMouseMove = (e) => {
    if (isDrawing && drawStart) {
      const container = containerRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - container.left) / container.width) * 100;
      const currentY = ((e.clientY - container.top) / container.height) * 100;

      // Create temporary preview box
      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);

      // Update preview box dimensions
      setPreviewBox({
        x: Math.min(drawStart.x, currentX),
        y: Math.min(drawStart.y, currentY),
        width: Math.abs(currentX - drawStart.x),
        height: Math.abs(currentY - drawStart.y)
      });
    }
    if (!containerRef.current) return;

    if (dragging && dragStart) {
      const container = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / container.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / container.height) * 100;
      
      const updates = {
        x: dragStart.initialX + deltaX,
        y: dragStart.initialY + deltaY
      };
      onAreaUpdate(dragging, updates);
    } else if (resizing && resizeStart) {
      const container = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - resizeStart.x) / container.width) * 100;
      const deltaY = ((e.clientY - resizeStart.y) / container.height) * 100;
      
      const updates = {};
      const minSize = 0.5; // Reduced from 5 to 0.5 percent

      switch (resizing.handle) {
        case 'e':
          updates.width = Math.max(minSize, resizeStart.initialWidth + deltaX);
          break;
        case 'w':
          updates.width = Math.max(minSize, resizeStart.initialWidth - deltaX);
          updates.x = resizeStart.initialX + deltaX;
          break;
        case 's':
          updates.height = Math.max(minSize, resizeStart.initialHeight + deltaY);
          break;
        case 'n':
          updates.height = Math.max(minSize, resizeStart.initialHeight - deltaY);
          updates.y = resizeStart.initialY + deltaY;
          break;
        case 'se':
          updates.width = Math.max(minSize, resizeStart.initialWidth + deltaX);
          updates.height = Math.max(minSize, resizeStart.initialHeight + deltaY);
          break;
        case 'sw':
          updates.width = Math.max(minSize, resizeStart.initialWidth - deltaX);
          updates.x = resizeStart.initialX + deltaX;
          updates.height = Math.max(minSize, resizeStart.initialHeight + deltaY);
          break;
        case 'ne':
          updates.width = Math.max(minSize, resizeStart.initialWidth + deltaX);
          updates.height = Math.max(minSize, resizeStart.initialHeight - deltaY);
          updates.y = resizeStart.initialY + deltaY;
          break;
        case 'nw':
          updates.width = Math.max(minSize, resizeStart.initialWidth - deltaX);
          updates.x = resizeStart.initialX + deltaX;
          updates.height = Math.max(minSize, resizeStart.initialHeight - deltaY);
          updates.y = resizeStart.initialY + deltaY;
          break;
      }

      onAreaUpdate(resizing.id, updates);
    }
  };

  const handleContainerMouseUp = (e) => {
    if (isDrawing && drawStart) {
      const container = containerRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - container.left) / container.width) * 100;
      const currentY = ((e.clientY - container.top) / container.height) * 100;

      const x = Math.min(drawStart.x, currentX);
      const y = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);

      // Reduce minimum size for drawn areas too
      if (width > 0.5 && height > 0.5) {
        onAddArea({ x, y, width, height });
      }

      setDrawStart(null);
      setIsDrawing(false);
      setPreviewBox(null); // Clear preview box
    }
    if (dragging || resizing) {
      document.body.style.userSelect = '';
      setDragging(null);
      setDragStart(null);
      setResizing(null);
      setResizeStart(null);
    }
  };

  const handleDoubleClick = (e, area) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editingAreaId) {
      onStartEdit(area);
    }
  };

  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [dragging, dragStart, resizing, resizeStart]);

  const ResizeHandle = ({ position, area }) => (
    <Box
      onMouseDown={(e) => handleResizeStart(e, area, position)}
      sx={{
        position: 'absolute',
        width: '10px',
        height: '10px',
        backgroundColor: 'white',
        border: '2px solid rgba(255, 87, 34, 0.8)',
        borderRadius: '50%',
        cursor: position.length === 2 ? `${position}-resize` : `${position[0]}-resize`,
        ...(position.includes('n') && { top: '-5px' }),
        ...(position.includes('s') && { bottom: '-5px' }),
        ...(position.includes('w') && { left: '-5px' }),
        ...(position.includes('e') && { right: '-5px' }),
        ...(position === 'n' && { left: '50%', marginLeft: '-5px' }),
        ...(position === 's' && { left: '50%', marginLeft: '-5px' }),
        ...(position === 'e' && { top: '50%', marginTop: '-5px' }),
        ...(position === 'w' && { top: '50%', marginTop: '-5px' }),
        display: editingAreaId && editingAreaId !== area.id ? 'none' : 'block', // Hide handles for non-editing areas
      }}
    />
  );

  return (
    <Box 
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      sx={{ 
        position: 'absolute', 
        inset: 0, 
        pointerEvents: (drawMode && !editingAreaId) || editingAreaId ? 'auto' : 'none',
        cursor: drawMode && !editingAreaId ? 'crosshair' : 'default',
        zIndex: drawMode && !editingAreaId ? 1 : 0
      }}
    >
      {/* Preview Box */}
      {previewBox && (
        <Box
          sx={{
            position: 'absolute',
            left: `${previewBox.x}%`,
            top: `${previewBox.y}%`,
            width: `${previewBox.width}%`,
            height: `${previewBox.height}%`,
            border: '2px dashed rgba(100, 100, 100, 0.5)',
            backgroundColor: 'rgba(200, 200, 200, 0.2)',
            pointerEvents: 'none'
          }}
        />
      )}
      {/* Existing Areas */}
      {areas.filter(area => !area.deleted).map(area => (
        <Box
          key={area.id}
          onMouseDown={(e) => handleMouseDown(e, area)}
          onDoubleClick={(e) => handleDoubleClick(e, area)}
          sx={{
            position: 'absolute',
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            border: '2px solid',
            borderColor: hoveredAreaId === area.id ? 
              'rgba(255, 87, 34, 1)' : 
              'rgba(255, 87, 34, 0.8)',
            backgroundColor: dragging === area.id || resizing?.id === area.id ? 
              'rgba(255, 87, 34, 0.3)' : 
              hoveredAreaId === area.id ?
                'rgba(255, 87, 34, 0.2)' :
                'rgba(255, 87, 34, 0.1)',
            cursor: editingAreaId && editingAreaId !== area.id ? 'default' : 'move',
            pointerEvents: editingAreaId && editingAreaId !== area.id ? 'none' : 'auto',
            transition: 'background-color 0.2s',
            zIndex: editingAreaId === area.id ? 1000 : // Bring editing area to front
                   hoveredAreaId === area.id ? 2 : 1,
            opacity: editingAreaId && editingAreaId !== area.id ? 0.5 : 1, // Dim non-editing areas
            '&:hover': {
              backgroundColor: 'rgba(255, 87, 34, 0.2)',
            }
          }}
        >
          {/* Add index label */}
          <Typography
            sx={{
              position: 'absolute',
              top: '-20px',
              left: 0,
              backgroundColor: 'rgba(255, 87, 34, 0.9)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              pointerEvents: 'none'
            }}
          >
            {area.index + 1}
          </Typography>
          <ResizeHandle position="nw" area={area} />
          <ResizeHandle position="n" area={area} />
          <ResizeHandle position="ne" area={area} />
          <ResizeHandle position="e" area={area} />
          <ResizeHandle position="se" area={area} />
          <ResizeHandle position="s" area={area} />
          <ResizeHandle position="sw" area={area} />
          <ResizeHandle position="w" area={area} />
        </Box>
      ))}
    </Box>
  );
};

export default ContentAreasOverlay;
