import { useEffect, useState } from 'react';

export function useLocalStorage(key, initialValue) {
  // Initialize state with a function to avoid running on server
  const [storedValue, setStoredValue] = useState(() => initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.log('Error reading from localStorage:', error);
      setStoredValue(initialValue);
    }
  }, [key]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}
