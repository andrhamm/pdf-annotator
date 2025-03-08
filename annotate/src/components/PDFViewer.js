import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import React, { useEffect, useRef, useState } from 'react';

import BoxModelVisualizer from './BoxModelVisualizer';
import ContentAreasOverlay from './ContentAreasOverlay';
import RefreshIcon from '@mui/icons-material/Refresh';

// Add simple logger
const logger = {
  info: (message, data) => {
    console.info(`[INFO] ${message}`, data || '');
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

// The version needs to match exactly what react-pdf uses internally
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = ({ file, currentPage, onDocumentLoadSuccess, scale = 1.0, margins, onMarginsChange, showMargins, contentAreas = [], onUpdateContentArea, hoveredAreaId, editingAreaId, drawMode, onAddArea, onStartEditingArea, onFinishEditingArea }) => {
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [activeMargin, setActiveMargin] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height - 32);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Add observer for PDF page size changes
  useEffect(() => {
    if (!pageRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setPdfDimensions({ width, height });
      }
    });

    // Observe the PDF page element
    const pageElement = pageRef.current.querySelector('.react-pdf__Page');
    if (pageElement) {
      resizeObserver.observe(pageElement);
    }

    return () => resizeObserver.disconnect();
  }, [currentPage, scale]); // Recreate observer when page or scale changes

  // Calculate PDF page size to ensure consistent dimensions
  const getPdfPageSize = () => {
    const pageElement = pageRef.current?.querySelector('.react-pdf__Page');
    if (!pageElement) return { width: 0, height: 0 };
    
    const { width, height } = pageElement.getBoundingClientRect();
    return { width, height };
  };

  // Handle document load success
  const handleDocumentLoadSuccess = ({ numPages }) => {
    logger.info('PDF document loaded successfully', { numPages });
    setLoading(false);
    setNumPages(numPages);
    onDocumentLoadSuccess({ numPages });
  };

  // Handle document load error
  const handleDocumentLoadError = (error) => {
    logger.error("PDF loading error:", error);
    setLoading(false);
    setError(`Failed to load PDF: ${error.message}`);
  };

  const handleMarginMouseDown = (e, side) => {
    e.preventDefault();
    setActiveMargin(side);
    const container = pageRef.current?.querySelector('.react-pdf__Page');
    if (!container) return;
    
    const { width, height } = container.getBoundingClientRect();
    setDragStartPosition({
      x: e.clientX,
      y: e.clientY,
      initialMargin: margins[side],
      containerWidth: width,
      containerHeight: height
    });
  };

  // Simplified margin validation that prevents opposite margins from crossing
  const validateMargins = (newMargins) => {
    const pdfSize = getPdfPageSize();
    const { width, height } = pdfSize;
    
    if (width === 0 || height === 0) return newMargins;
    
    const minGap = 20; // Minimum gap between margins
    
    return {
      // Top: 0 to PDF height (stopping before bottom margin)
      top: Math.max(0, Math.min(newMargins.top, height + newMargins.bottom - minGap)),
      
      // Right: negative from right edge (stopping before left margin)
      right: Math.min(0, Math.max(newMargins.right, -width + newMargins.left + minGap)),
      
      // Bottom: negative from bottom edge (stopping before top margin)
      bottom: Math.min(0, Math.max(newMargins.bottom, -height + newMargins.top + minGap)),
      
      // Left: 0 to PDF width (stopping before right margin)
      left: Math.max(0, Math.min(newMargins.left, width + newMargins.right - minGap))
    };
  };

  // Fixed handleMouseMove function to correct right and bottom margin movement
  const handleMouseMove = (e) => {
    if (!activeMargin || !dragStartPosition) return;
    const { initialMargin } = dragStartPosition;

    // Calculate raw delta based on mouse movement - adjusted for scale
    const delta = ((e.clientX - dragStartPosition.x) / scale);
    const deltaY = ((e.clientY - dragStartPosition.y) / scale);

    const newMargins = { ...margins };
    
    switch (activeMargin) {
      case 'left':
        // Left: Dragging right increases the value (positive)
        newMargins.left = initialMargin + delta;
        break;
      case 'right':
        // Right: Dragging left decreases the value (more negative)
        // We use the opposite of delta here 
        newMargins.right = initialMargin + delta;
        break;
      case 'top':
        // Top: Dragging down increases the value (positive)
        newMargins.top = initialMargin + deltaY;
        break;
      case 'bottom':
        // Bottom: Dragging up decreases the value (more negative)
        // We use the opposite of deltaY here
        newMargins.bottom = initialMargin + deltaY;
        break;
    }

    // Validate margins and ensure they don't cross
    const validatedMargins = {
      top: Math.max(0, newMargins.top),
      right: Math.min(0, newMargins.right),
      bottom: Math.min(0, newMargins.bottom),
      left: Math.max(0, newMargins.left)
    };

    // Check if margins would cross
    const pdfSize = getPdfPageSize();
    const minGap = 20;

    if (validatedMargins.top + Math.abs(validatedMargins.bottom) > pdfSize.height - minGap) {
      if (activeMargin === 'top') {
        validatedMargins.top = pdfSize.height - Math.abs(validatedMargins.bottom) - minGap;
      } else if (activeMargin === 'bottom') {
        validatedMargins.bottom = -(pdfSize.height - validatedMargins.top - minGap);
      }
    }

    if (validatedMargins.left + Math.abs(validatedMargins.right) > pdfSize.width - minGap) {
      if (activeMargin === 'left') {
        validatedMargins.left = pdfSize.width - Math.abs(validatedMargins.right) - minGap;
      } else if (activeMargin === 'right') {
        validatedMargins.right = -(pdfSize.width - validatedMargins.left - minGap);
      }
    }

    // Only update if something changed
    if (JSON.stringify(validatedMargins) !== JSON.stringify(margins)) {
      onMarginsChange(validatedMargins);
    }
  };

  const handleMouseUp = () => {
    setActiveMargin(null);
    setDragStartPosition(null);
  };

  useEffect(() => {
    if (activeMargin) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeMargin, dragStartPosition]);

  return (
    <Paper 
      ref={containerRef}
      elevation={1} 
      id="pdf-container"
      sx={{ 
        width: "840px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        minHeight: '100%'
      }}
    >
      {/* Show loading indicator */}
      {loading && (
        <Box 
          id="pdf-loading-indicator"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.8)"
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading PDF...
          </Typography>
        </Box>
      )}
      
      {/* Show error message if any */}
      {error && (
        <Box 
          id="pdf-error-display"
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 3
          }}
        >
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            startIcon={<RefreshIcon />} 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Application
          </Button>
        </Box>
      )}

      {/* Document viewer */}
      {file && !error && (
        <Box 
          id="pdf-viewer-wrapper"
          sx={{ 
            position: 'relative',
            width: "840px",
            display: 'flex',
            flexDirection: 'column',
            flex: 1
          }}>
          <Box 
            ref={pageRef}
            id="pdf-page-container"
            sx={{ 
              position: 'relative',
              width: "840px",
              transform: `scale(${scale})`,
              transformOrigin: 'top center'
            }}
          >
            <Document
              id="pdf-document"
              file={file}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
            >
              {numPages > 0 && (
                <Page
                  key={`page_${currentPage}`}
                  pageNumber={currentPage}
                  width={840}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              )}
            </Document>
            <Box 
              id="pdf-overlays-container"
              sx={{ 
                position: 'absolute',
                inset: 0,
                overflow: 'hidden' // Ensure content is clipped to PDF bounds
              }}
            >
              {showMargins && (
                <BoxModelVisualizer 
                  dimensions={pdfDimensions} 
                  margins={margins}
                  onMarginDragStart={handleMarginMouseDown}
                  activeMargin={activeMargin}
                  pdfSize={getPdfPageSize()} // Add this to pass exact dimensions
                />
              )}
              <ContentAreasOverlay 
                areas={contentAreas}
                onAreaUpdate={onUpdateContentArea}
                hoveredAreaId={hoveredAreaId}
                editingAreaId={editingAreaId}
                drawMode={drawMode}
                onAddArea={onAddArea}
                onStartEdit={onStartEditingArea}
                onFinishEdit={onFinishEditingArea}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default PDFViewer;
