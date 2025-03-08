import { customAlphabet } from 'nanoid';

const generateId = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);

export const createStorageKey = (file, numPages) => {
  const sanitizedName = file.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `pdf_${sanitizedName}_${numPages}_${generateId()}`;
};

export const saveAppState = (key, state) => {
  const storageData = {
    fileName: state.fileName,
    fileSize: state.fileSize,
    numPages: state.numPages,
    currentPage: state.currentPage,
    scale: state.scale,
    margins: state.margins,
    contentAreas: state.contentAreas,
    pageMetadata: state.pageMetadata,
    firstSaved: state.firstSaved || new Date().toISOString(),
    lastSaved: new Date().toISOString()
  };

  localStorage.setItem(key, JSON.stringify(storageData));
  return storageData;
};

export const loadAppState = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const getStoredFiles = () => {
  return Object.keys(localStorage)
    .filter(key => key.startsWith('pdf_'))
    .map(key => {
      const data = loadAppState(key);
      return {
        key,
        ...data
      };
    })
    .sort((a, b) => new Date(b.lastSaved) - new Date(a.lastSaved));
};
