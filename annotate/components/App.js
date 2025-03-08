import { AppBar, Box, Container, IconButton, Snackbar, Toolbar, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { createNewSave, findSavesForFile, loadSave, updateSave } from '../utils/saveManager';

import Alert from '@mui/material/Alert';
import { ContentArea } from '../types/ContentArea';
import FileMenu from './FileMenu';
import FileUploader from './FileUploader';
import MetadataForm from './MetadataForm';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PDFViewer from './PDFViewer';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveSelector from './SaveSelector';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { parsePageWithMargins } from '../services/parserService';
import { useLocalStorage } from '../hooks/useLocalStorage';

function App() {
    const [pdfFile, setPdfFile] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(null);
    const [pageMetadata, setPageMetadata] = useState({});
    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("info");
    const [openAlert, setOpenAlert] = useState(false);
    const [scale, setScale] = useState(1.0);
    const [margins, setMargins] = useState({
      top: 72, // 1 inch in pixels
      right: 72,
      bottom: 72,
      left: 72
    });
    const [showMargins, setShowMargins] = useState(true);
    const [marginPresets, setMarginPresets] = useLocalStorage('marginPresets', {
      'Default (1 inch)': { top: 72, right: -72, bottom: -72, left: 72 },
      'No Margins': { top: 0, right: 0, bottom: 0, left: 0 },
      'Wide': { top: 72, right: -144, bottom: -72, left: 144 },
    });
    const [contentAreas, setContentAreas] = useState({});
    const [hoveredContentAreaId, setHoveredContentAreaId] = useState(null);
    const [isEditingContentArea, setIsEditingContentArea] = useState(false);
    const [editingAreaId, setEditingAreaId] = useState(null);
    const [storageKey, setStorageKey] = useState(null);
    const [saveId, setSaveId] = useState(null);
    const [showSaveSelector, setShowSaveSelector] = useState(false);
    const [saveOptions, setSaveOptions] = useState(null);
    const [drawMode, setDrawMode] = useState(false);
  
    const saveNewPreset = (name, margins) => {
      setMarginPresets({
        ...marginPresets,
        [name]: { ...margins }
      });
    };
  
    const handleMarginsChange = (newMargins) => {
      setMargins(newMargins);
      // Optionally save to metadata here
      const currentMetadata = pageMetadata[currentPage] || {};
      setPageMetadata(prev => ({
        ...prev,
        [currentPage]: {
          ...currentMetadata,
          margins: newMargins
        }
      }));
    };
  
    const handleAddContentArea = (pageNumber) => {
      const newArea = new ContentArea();
      
      setContentAreas(prev => {
        const currentAreas = prev[pageNumber]?.filter(a => !a.deleted) || [];
        const nextIndex = Math.max(-1, ...currentAreas.map(a => a.index)) + 1;
        newArea.index = nextIndex;
        
        const updatedAreas = {
          ...prev,
          [pageNumber]: [...(prev[pageNumber] || []), newArea]
        };
        setEditingAreaId(newArea.id);
        setIsEditingContentArea(true);
        return updatedAreas;
      });
    };
  
    const updateAreaIndices = (areas) => {
      let currentIndex = 0;
      areas.forEach(area => {
        if (!area.deleted) {
          area.index = currentIndex++;
        }
      });
      return areas;
    };
  
    const handleUpdateContentArea = (pageNumber, areaId, updates) => {
      setContentAreas(prev => {
        const areas = prev[pageNumber].map(area => 
          area.id === areaId ? { ...area, ...updates } : area
        );
        return {
          ...prev,
          [pageNumber]: updateAreaIndices(areas)
        };
      });
    };
  
    const handleAddAreaFromDraw = ({ x, y, width, height }) => {
      const newArea = new ContentArea();
      newArea.x = x;
      newArea.y = y;
      newArea.width = width;
      newArea.height = height;
      
      setContentAreas(prev => {
        const currentAreas = prev[currentPage]?.filter(a => !a.deleted) || [];
        const nextIndex = Math.max(-1, ...currentAreas.map(a => a.index)) + 1;
        newArea.index = nextIndex;
        
        return {
          ...prev,
          [currentPage]: [...(prev[currentPage] || []), newArea]
        };
      });
    };
  
    const handleReorderContentAreas = (pageNumber, startIndex, endIndex) => {
      setContentAreas(prev => {
        const areas = [...(prev[pageNumber] || [])];
        const [removed] = areas.splice(startIndex, 1);
        areas.splice(endIndex, 0, removed);
        
        // Update indices based on their position in the array
        areas.forEach((area, idx) => {
          if (!area.deleted) {
            area.index = idx;
          }
        });
  
        return {
          ...prev,
          [pageNumber]: areas
        };
      });
    };
  
    // Get current editing area
    const getCurrentEditingArea = () => {
      if (!editingAreaId || !contentAreas[currentPage]) return null;
      return contentAreas[currentPage].find(area => area.id === editingAreaId);
    };
  
    // Add global error handling for unhandled promise rejections
    useEffect(() => {
      const handleUnhandledRejection = (event) => {
        console.error("Unhandled promise rejection:", event.reason);
        showAlert("PDF processing error. Try refreshing the page.", "error");
      };
  
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      
      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, []);
  
    const showAlert = (message, severity = "info") => {
      setAlertMessage(message);
      setAlertSeverity(severity);
      setOpenAlert(true);
    };
  
    const handleFileChange = (file) => {
      try {
        setStorageKey(null); // Reset storage key
        setPdfFile(file);
        setCurrentPage(1);
        setNumPages(null);
        setPageMetadata({});
        setContentAreas({});
        showAlert(`Loading PDF: ${file.name}`, "info");
      } catch (err) {
        console.error("Error handling file change:", err);
        showAlert("Error loading PDF file", "error");
      }
    };
  
    const handleCloseFile = () => {
      setStorageKey(null);
      setPdfFile(null);
      setCurrentPage(1);
      setNumPages(null);
      setPageMetadata({});
    };
  
    const handlePageChange = (pageNumber) => {
      if (isEditingContentArea) return; // Prevent page changes while editing
      setCurrentPage(pageNumber);
      // If we have saved metadata for this page, load it
      if (pageMetadata[pageNumber]) {
        console.log(`Loading metadata for page ${pageNumber}:`, pageMetadata[pageNumber]);
      }
    };
  
    const handleDocumentLoadSuccess = ({ numPages }) => {
      setNumPages(numPages);
      const { exactMatch, otherSaves } = findSavesForFile(pdfFile.name, numPages);
      
      if (exactMatch || otherSaves.length > 0) {
        setSaveOptions({ exactMatch, otherSaves });
        setShowSaveSelector(true);
      } else {
        // No existing saves, create new one
        const newSaveId = createNewSave(pdfFile.name, numPages);
        setSaveId(newSaveId);
        showAlert(`PDF loaded successfully with ${numPages} pages`);
      }
    };
  
    const handleSaveSelection = (selectedSaveId) => {
      setShowSaveSelector(false);
      
      if (selectedSaveId) {
        // Load existing save
        const savedState = loadSave(selectedSaveId);
        if (savedState) {
          setCurrentPage(savedState.currentPage);
          setScale(savedState.scale);
          setSaveId(selectedSaveId);
          showAlert('Previous save loaded successfully');
        }
      } else {
        // Create new save
        const newSaveId = createNewSave(pdfFile.name, numPages);
        setSaveId(newSaveId);
        showAlert(`New save created for ${pdfFile.name}`);
      }
    };
  
    // Save state when important things change
    useEffect(() => {
      if (!saveId) return;
  
      const state = {
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        numPages,
        currentPage,
        scale,
        firstSaved: new Date().toISOString()
      };
  
      updateSave(saveId, state);
    }, [saveId, currentPage, scale]);
  
    const handleSaveMetadata = async (pageNumber, metadata) => {
      setPageMetadata(prevState => ({
        ...prevState,
        [pageNumber]: metadata
      }));
  
      // Call parser with current PDF and margins
      if (pdfFile) {
        try {
          const result = await parsePageWithMargins(
            pdfFile.path, // Note: This might need adjustment for browser security
            pageNumber,
            margins
          );
          console.log('Parser output:', result);
        } catch (error) {
          showAlert('Error running parser: ' + error.message, 'error');
        }
      }
  
      showAlert(`Metadata saved for page ${pageNumber}`, "success");
    };
  
    const handleZoomIn = () => {
      setScale(prevScale => Math.min(prevScale + 0.2, 2.5));
    };
  
    const handleZoomOut = () => {
      setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
    };
  
    const handleResetZoom = () => {
      setScale(1.0);
    };
  
    const handleStartEditingArea = (area) => {
      setEditingAreaId(area.id);
      setIsEditingContentArea(true);
    };
  
    const handleFinishEditingArea = () => {
      setEditingAreaId(null);
      setIsEditingContentArea(false);
    };
  
    const handleDrawModeChange = (checked) => {
      setDrawMode(checked);
    };
  
    const handleSaveAreaEdit = (updatedArea) => {
      // Ensure we update with complete area state
      handleUpdateContentArea(currentPage, updatedArea.id, updatedArea);
      handleFinishEditingArea();
    };
  
    return (
      <div id="app-root" className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar id="app-header" position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>PDF Annotation Tool</Typography>
            <FileMenu 
              onFileChange={handleFileChange} 
              currentFile={pdfFile}
              onCloseFile={handleCloseFile}
              saveId={saveId}
            />
          </Toolbar>
        </AppBar>
        
        <Box 
          id="app-main-content"
          component="main" 
          sx={{ 
            flex: 1,
            display: 'flex',
            overflow: 'hidden', // Prevent double scrollbars
            bgcolor: 'background.default'
          }}
        >
          {!pdfFile ? (
            <Container id="file-upload-container" maxWidth="xl" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box>
                <FileUploader onFileChange={handleFileChange} />
              </Box>
            </Container>
          ) : (
            <Box 
              id="editor-layout"
              sx={{ 
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 900px', // Changed from 450px to 900px
                gap: 2,
                p: 2,
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}
            >
              <Box id="pdf-section" sx={{ 
                height: '100%', 
                overflow: 'hidden',
                minWidth: 0 // Add this to prevent overflow in grid
              }}>
                <PDFViewer
                  file={pdfFile}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  onDocumentLoadSuccess={handleDocumentLoadSuccess}
                  scale={scale}
                  margins={margins}
                  onMarginsChange={handleMarginsChange}
                  showMargins={showMargins}
                  contentAreas={contentAreas[currentPage] || []} // Add this
                  onUpdateContentArea={(areaId, updates) =>  // Add this
                    handleUpdateContentArea(currentPage, areaId, updates)}
                  hoveredAreaId={hoveredContentAreaId}
                  editingAreaId={editingAreaId}
                  drawMode={drawMode}
                  onAddArea={handleAddAreaFromDraw}
                  onStartEditingArea={handleStartEditingArea}
                  onFinishEditingArea={handleFinishEditingArea}
                />
              </Box>
              
              <Box 
                id="sidebar-section"
                sx={{ 
                  width: '900px', // Changed from 450px to 900px
                  height: '100%',
                  overflow: 'auto',
                  bgcolor: 'background.paper',
                  borderLeft: 1,
                  borderColor: 'divider',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* PDF Controls */}
                <Box id="document-controls" sx={{ 
                  p: 2, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  opacity: isEditingContentArea ? 0.5 : 1,
                  pointerEvents: isEditingContentArea ? 'none' : 'auto'
                }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Document Controls
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage <= 1}
                        size="small"
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                      
                      <Typography sx={{ mx: 2 }} variant="body2">
                        Page {currentPage} of {numPages || '?'}
                      </Typography>
                      
                      <IconButton 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={!numPages || currentPage >= numPages}
                        size="small"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Box>
  
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton onClick={handleZoomOut} disabled={scale <= 0.5} size="small">
                        <ZoomOutIcon />
                      </IconButton>
                      <IconButton 
                        onClick={handleResetZoom}
                        size="small"
                        disabled={scale === 1.0}
                        sx={{ mx: 0.5 }}
                      >
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ mx: 1 }}>
                        {Math.round(scale * 100)}%
                      </Typography>
                      <IconButton onClick={handleZoomIn} disabled={scale >= 2.5} size="small">
                        <ZoomInIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
  
                {/* Metadata Form */}
                <Box id="metadata-section" sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                  <MetadataForm
                    pageNumber={currentPage}
                    totalPages={numPages}
                    existingMetadata={pageMetadata[currentPage] || {}}
                    onSave={(metadata) => handleSaveMetadata(currentPage, metadata)}
                    margins={margins}
                    onMarginsChange={setMargins}
                    showMargins={showMargins}
                    onShowMarginsChange={setShowMargins}
                    marginPresets={marginPresets}
                    onSavePreset={saveNewPreset}
                    contentAreas={contentAreas[currentPage] || []}
                    onAddContentArea={() => handleAddContentArea(currentPage)}
                    onUpdateContentArea={(areaId, updates) => 
                      handleUpdateContentArea(currentPage, areaId, updates)}
                    onAreaHover={setHoveredContentAreaId}
                    hoveredAreaId={hoveredContentAreaId} // Add this prop
                    onStartEditingArea={handleStartEditingArea}
                    onFinishEditingArea={handleFinishEditingArea}
                    currentArea={getCurrentEditingArea()}
                    drawMode={drawMode}
                    onDrawModeChange={handleDrawModeChange}
                    onSaveArea={handleSaveAreaEdit}
                    editingAreaId={editingAreaId}
                    onReorderContentAreas={(startIndex, endIndex) => 
                      handleReorderContentAreas(currentPage, startIndex, endIndex)}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
  
        <Snackbar
          open={openAlert}
          autoHideDuration={6000}
          onClose={() => setOpenAlert(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setOpenAlert(false)} 
            severity={alertSeverity}
            sx={{ width: '100%' }}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
        <SaveSelector
          open={showSaveSelector}
          exactMatch={saveOptions?.exactMatch}
          otherSaves={saveOptions?.otherSaves}
          onSelect={handleSaveSelection}
          onCancel={() => {
            setShowSaveSelector(false);
            handleCloseFile();
          }}
        />
      </div>
    );
  }
  
  export default App;
  