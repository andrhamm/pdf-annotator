import { nanoid } from 'nanoid';

const LOCAL_STORAGE_KEY = 'pdf_annotation_saves';

// Format a timestamp for display
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

// Create a new save with basic info - Using nanoid instead of uuid for shorter IDs
export function createNewSave(fileName, pageCount) {
  // Use nanoid for shorter, more readable save IDs
  const saveId = `save_${nanoid(6)}`;
  const now = new Date().toISOString();
  
  const saves = getSaves();
  saves.push({
    id: saveId,
    fileName,
    pageCount,
    createdAt: now,
    updatedAt: now,
    data: {
      currentPage: 1,
      scale: 1.0,
      metadata: {},
      contentAreas: {}
    }
  });
  
  saveSaves(saves);
  return saveId;
}

// Load a save by ID
export function loadSave(saveId) {
  const saves = getSaves();
  const save = saves.find(s => s.id === saveId);
  
  if (!save) return null;
  
  // Update last accessed time
  save.updatedAt = new Date().toISOString();
  saveSaves(saves);
  
  return save.data;
}

// Update an existing save
export function updateSave(saveId, data) {
  const saves = getSaves();
  const saveIndex = saves.findIndex(s => s.id === saveId);
  
  if (saveIndex === -1) return false;
  
  saves[saveIndex].data = {
    ...saves[saveIndex].data,
    ...data
  };
  saves[saveIndex].updatedAt = new Date().toISOString();
  
  saveSaves(saves);
  return true;
}

// Find saves for a specific file
export function findSavesForFile(fileName, pageCount) {
  const saves = getSaves();
  
  // First look for exact matches
  const exactMatches = saves.filter(save => 
    save.fileName === fileName && save.pageCount === pageCount
  );
  
  // Then look for other saves that might be compatible
  const otherMatches = saves.filter(save => 
    save.fileName !== fileName || save.pageCount !== pageCount
  );
  
  return {
    exactMatch: exactMatches.length > 0 ? { 
      fileName, 
      pageCount,
      saves: exactMatches 
    } : null,
    otherSaves: otherMatches.map(save => ({
      fileName: save.fileName,
      pageCount: save.pageCount,
      saves: [save]
    }))
  };
}

// Helper function to get saves from local storage
function getSaves() {
  try {
    const saves = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saves ? JSON.parse(saves) : [];
  } catch (error) {
    console.error('Error loading saves from localStorage', error);
    return [];
  }
}

// Helper function to save saves to local storage
function saveSaves(saves) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saves));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage', error);
    return false;
  }
}
