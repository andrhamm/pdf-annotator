import { Box, Typography } from '@mui/material';

import React from 'react';

/**
 * Visualizes and allows adjustment of content margins.
 * 
 * Margin values follow CSS convention:
 * - top: positive from top (increases downward)
 * - right: negative from right (increases leftward)
 * - bottom: negative from bottom (increases upward)
 * - left: positive from left (increases rightward)
 */
const BoxModelVisualizer = ({ dimensions, margins, onMarginDragStart, pdfSize }) => {
  const pageWidth = pdfSize?.width || dimensions.width;
  const pageHeight = pdfSize?.height || dimensions.height;
  
  // Visual offset for right/bottom margins for fine-tuning
  const VISUAL_OFFSET = 3; // offset applied to right and bottom margin positions
  
  // Simple helper for showing margin labels
  const shouldShowLabel = (side, value) => {
    return (side === 'top' || side === 'left') ? value > 0 : value < 0;
  };

  const labelStyle = {
    position: 'absolute',
    color: '#666',
    fontSize: '12px',
    fontFamily: 'monospace',
    pointerEvents: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: '0 2px',
    zIndex: 5
  };

  return (
    <Box 
      id="margin-visualizer"
      sx={{ 
        position: 'absolute', 
        inset: 0, 
        pointerEvents: 'none',
        width: `${pageWidth}px`,
        height: `${pageHeight}px`
      }}
    >
      {/* TOP MARGIN LINE */}
      <Box
        id="margin-line-top"
        onMouseDown={(e) => onMarginDragStart(e, 'top')}
        sx={{
          position: 'absolute',
          top: `${margins.top}px`,
          left: 0,
          right: 0,
          height: '6px',
          cursor: 'ns-resize',
          transform: 'translateY(-50%)',
          pointerEvents: 'auto',
          zIndex: 10,
          '&:hover': { '& .blue-hover': { opacity: 0.4 } }
        }}
      >
        {/* Red line */}
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'red',
          opacity: 0.8,
          zIndex: 2
        }} />
        
        {/* Blue hover area */}
        <Box className="blue-hover" sx={{ 
          position: 'absolute',
          top: '1px',
          left: 0,
          right: 0,
          height: '5px',
          backgroundColor: '#0084ff',
          opacity: 0,
          transition: 'opacity 0.2s',
          zIndex: 1
        }} />
      </Box>

      {/* RIGHT MARGIN LINE - Always apply visual offset */}
      <Box
        id="margin-line-right"
        onMouseDown={(e) => onMarginDragStart(e, 'right')}
        sx={{
          position: 'absolute',
          top: 0,
          right: `${Math.abs(margins.right) + VISUAL_OFFSET}px`,
          bottom: 0,
          width: '6px',
          cursor: 'ew-resize',
          transform: 'translateX(50%)',
          pointerEvents: 'auto',
          zIndex: 10,
          '&:hover': { '& .blue-hover': { opacity: 0.4 } }
        }}
      >
        {/* Red line */}
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: 'red',
          opacity: 0.8,
          zIndex: 2
        }} />
        
        {/* Blue hover area */}
        <Box className="blue-hover" sx={{ 
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '5px',
          backgroundColor: '#0084ff',
          opacity: 0,
          transition: 'opacity 0.2s',
          zIndex: 1
        }} />
      </Box>

      {/* BOTTOM MARGIN LINE */}
      <Box
        id="margin-line-bottom"
        onMouseDown={(e) => onMarginDragStart(e, 'bottom')}
        sx={{
          position: 'absolute',
          bottom: `${Math.abs(margins.bottom) + VISUAL_OFFSET}px`,
          left: 0,
          right: 0,
          height: '6px',
          cursor: 'ns-resize',
          transform: 'translateY(50%)',
          pointerEvents: 'auto',
          zIndex: 10,
          '&:hover': { '& .blue-hover': { opacity: 0.4 } }
        }}
      >
        {/* Red line */}
        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '1px',
          backgroundColor: 'red',
          opacity: 0.8,
          zIndex: 2
        }} />
        
        {/* Blue hover area */}
        <Box className="blue-hover" sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '5px',
          backgroundColor: '#0084ff',
          opacity: 0,
          transition: 'opacity 0.2s',
          zIndex: 1
        }} />
      </Box>

      {/* LEFT MARGIN LINE */}
      <Box
        id="margin-line-left"
        onMouseDown={(e) => onMarginDragStart(e, 'left')}
        sx={{
          position: 'absolute',
          top: 0,
          left: `${margins.left}px`,
          bottom: 0,
          width: '6px',
          cursor: 'ew-resize',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          zIndex: 10,
          '&:hover': { '& .blue-hover': { opacity: 0.4 } }
        }}
      >
        {/* Red line */}
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '1px',
          backgroundColor: 'red',
          opacity: 0.8,
          zIndex: 2
        }} />
        
        {/* Blue hover area */}
        <Box className="blue-hover" sx={{ 
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '5px',
          backgroundColor: '#0084ff',
          opacity: 0,
          transition: 'opacity 0.2s',
          zIndex: 1
        }} />
      </Box>

      {/* LABELS - Only show for non-zero margins */}
      {shouldShowLabel('top', margins.top) && (
        <Typography sx={{
          ...labelStyle,
          top: `${margins.top / 2}px`,
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          {Math.round(margins.top)}px
        </Typography>
      )}

      {shouldShowLabel('right', margins.right) && (
        <Typography sx={{
          ...labelStyle,
          right: `${Math.abs(margins.right) / 2}px`,
          top: '50%',
          transform: 'translate(50%, -50%)'
        }}>
          {Math.abs(Math.round(margins.right))}px
        </Typography>
      )}

      {shouldShowLabel('bottom', margins.bottom) && (
        <Typography sx={{
          ...labelStyle,
          bottom: `${Math.abs(margins.bottom) / 2}px`,
          left: '50%',
          transform: 'translate(-50%, 50%)'
        }}>
          {Math.abs(Math.round(margins.bottom))}px
        </Typography>
      )}

      {shouldShowLabel('left', margins.left) && (
        <Typography sx={{
          ...labelStyle,
          left: `${margins.left / 2}px`,
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          {Math.round(margins.left)}px
        </Typography>
      )}

      {/* Dimensions label */}
      <Typography sx={{
        ...labelStyle,
        right: 10,
        bottom: 10,
      }}>
        {Math.round(pageWidth)}×{Math.round(pageHeight)}
      </Typography>
    </Box>
  );
};

export default BoxModelVisualizer;
