import type { MappingDataset } from '../../types';

const STORAGE_KEY = 'curriculum_mapping_dataset';

export const saveDataset = (dataset: MappingDataset): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  } catch (error) {
    console.error('Failed to save dataset to localStorage', error);
  }
};

export const loadDataset = (): MappingDataset | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load dataset from localStorage', error);
    if (typeof window !== 'undefined' && window.alert) {
      window.alert('Warning: Saved curriculum data in local storage could not be parsed. Please verify your data or import a backup JSON file.');
    }
    return null;
  }
};

export const clearDataset = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
