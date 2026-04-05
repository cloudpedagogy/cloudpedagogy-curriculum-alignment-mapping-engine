import { useState, useCallback, useEffect } from 'react';
import type { MappingDataset, Module, Relationship } from '../../types';
import { loadDataset, saveDataset, clearDataset } from '../../lib/storage';
import { demoDataset } from '../../data/demo';

export const useMappingEngine = () => {
  const [dataset, setDataset] = useState<MappingDataset | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize dataset from storage
  useEffect(() => {
    const stored = loadDataset();
    if (stored) {
      setDataset(stored);
    }
    setIsLoaded(true);
  }, []);

  const updateDataset = useCallback((newDataset: MappingDataset | null) => {
    if (newDataset) {
      saveDataset(newDataset);
    } else {
      clearDataset();
    }
    setDataset(newDataset);
  }, []);

  const loadDemo = useCallback(() => {
    updateDataset(demoDataset);
  }, [updateDataset]);

  const resetData = useCallback(() => {
    updateDataset(null);
  }, [updateDataset]);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        updateDataset(json);
      } catch (error) {
        console.error('Failed to parse imported file', error);
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }, [updateDataset]);

  const exportData = useCallback(() => {
    if (!dataset) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataset, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${dataset.name.toLowerCase().replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [dataset]);

  // Structural Editing Methods
  const addModule = useCallback((module: Module) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      modules: [...dataset.modules, module]
    });
  }, [dataset, updateDataset]);

  const removeModule = useCallback((moduleId: string) => {
    if (!dataset) return;
    // Also remove any relationships linked to this module
    updateDataset({
      ...dataset,
      modules: dataset.modules.filter(m => m.id !== moduleId),
      relationships: dataset.relationships.filter(r => r.sourceId !== moduleId && r.targetId !== moduleId)
    });
  }, [dataset, updateDataset]);

  const addRelationship = useCallback((rel: Relationship) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      relationships: [...dataset.relationships, rel]
    });
  }, [dataset, updateDataset]);

  const removeRelationship = useCallback((relId: string) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      relationships: dataset.relationships.filter(r => r.id !== relId)
    });
  }, [dataset, updateDataset]);

  const removeAssessment = useCallback((assessmentId: string) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      assessments: dataset.assessments.filter(a => a.id !== assessmentId),
      relationships: dataset.relationships.filter(r => r.sourceId !== assessmentId && r.targetId !== assessmentId)
    });
  }, [dataset, updateDataset]);

  const removeOutcome = useCallback((outcomeId: string) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      outcomes: dataset.outcomes.filter(o => o.id !== outcomeId),
      relationships: dataset.relationships.filter(r => r.sourceId !== outcomeId && r.targetId !== outcomeId)
    });
  }, [dataset, updateDataset]);

  return {
    dataset,
    isLoaded,
    loadDemo,
    resetData,
    importData,
    exportData,
    addModule,
    removeModule,
    addRelationship,
    removeRelationship,
    removeAssessment,
    removeOutcome,
    updateDataset
  };
};
