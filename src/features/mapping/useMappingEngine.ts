import { useState, useCallback } from 'react';
import type { MappingDataset, Module, Programme, LearningOutcome, Assessment, Skill, Relationship } from '../../types';
import { loadDataset, saveDataset, clearDataset } from '../../lib/storage';
import { demoDataset } from '../../data/demo';
import {
  safeDeleteModule,
  safeDeleteAssessment,
  safeDeleteOutcome,
  safeDeleteRelationship,
  safeDeleteSkill,
  safeDeleteProgramme
} from '../../lib/data/safeDeletion';

export const useMappingEngine = () => {
  const [dataset, setDataset] = useState<MappingDataset | null>(() => loadDataset());
  const [activeProgrammeId, setActiveProgrammeId] = useState<string | null>(null);
  const isLoaded = true;

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

  // Programme Authoring Methods
  const addProgramme = useCallback((programme: Programme) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      programmes: [...(dataset.programmes || []), programme]
    });
  }, [dataset, updateDataset]);

  const updateProgramme = useCallback((programme: Programme) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      programmes: (dataset.programmes || []).map(p => p.id === programme.id ? programme : p)
    });
  }, [dataset, updateDataset]);

  const removeProgramme = useCallback((programmeId: string) => {
    if (!dataset) return;
    const updated = safeDeleteProgramme(dataset, programmeId);
    if (activeProgrammeId === programmeId) {
      setActiveProgrammeId(null);
    }
    updateDataset(updated);
  }, [dataset, activeProgrammeId, updateDataset]);

  // Module Authoring Methods
  const addModule = useCallback((module: Module, programmeIds?: string[]) => {
    if (!dataset) return;
    let updatedProgrammes = dataset.programmes;
    if (programmeIds && dataset.programmes) {
      const targetSet = new Set(programmeIds);
      updatedProgrammes = dataset.programmes.map(p => {
        if (targetSet.has(p.id) && !(p.moduleIds || []).includes(module.id)) {
          return { ...p, moduleIds: [...(p.moduleIds || []), module.id] };
        }
        return p;
      });
    }

    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      modules: [...dataset.modules, module],
      programmes: updatedProgrammes
    });
  }, [dataset, updateDataset]);

  const updateModule = useCallback((module: Module, programmeIds?: string[]) => {
    if (!dataset) return;
    const updatedModules = dataset.modules.map(m => m.id === module.id ? module : m);

    let updatedProgrammes = dataset.programmes;
    if (programmeIds && dataset.programmes) {
      const targetSet = new Set(programmeIds);
      updatedProgrammes = dataset.programmes.map(p => {
        const hasModule = (p.moduleIds || []).includes(module.id);
        const shouldHaveModule = targetSet.has(p.id);
        if (shouldHaveModule && !hasModule) {
          return { ...p, moduleIds: [...(p.moduleIds || []), module.id] };
        }
        if (!shouldHaveModule && hasModule) {
          return { ...p, moduleIds: (p.moduleIds || []).filter(id => id !== module.id) };
        }
        return p;
      });
    }

    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      modules: updatedModules,
      programmes: updatedProgrammes
    });
  }, [dataset, updateDataset]);

  const removeModule = useCallback((moduleId: string) => {
    if (!dataset) return;
    const updated = safeDeleteModule(dataset, moduleId);
    updateDataset(updated);
  }, [dataset, updateDataset]);

  // Learning Outcome Authoring Methods
  const addOutcome = useCallback((outcome: LearningOutcome) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      outcomes: [...dataset.outcomes, outcome]
    });
  }, [dataset, updateDataset]);

  const updateOutcome = useCallback((outcome: LearningOutcome) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      outcomes: dataset.outcomes.map(o => o.id === outcome.id ? outcome : o)
    });
  }, [dataset, updateDataset]);

  const removeOutcome = useCallback((outcomeId: string) => {
    if (!dataset) return;
    const updated = safeDeleteOutcome(dataset, outcomeId);
    updateDataset(updated);
  }, [dataset, updateDataset]);

  // Assessment Authoring Methods
  const addAssessment = useCallback((assessment: Assessment) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      assessments: [...dataset.assessments, assessment]
    });
  }, [dataset, updateDataset]);

  const updateAssessment = useCallback((assessment: Assessment) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      assessments: dataset.assessments.map(a => a.id === assessment.id ? assessment : a)
    });
  }, [dataset, updateDataset]);

  const removeAssessment = useCallback((assessmentId: string) => {
    if (!dataset) return;
    const updated = safeDeleteAssessment(dataset, assessmentId);
    updateDataset(updated);
  }, [dataset, updateDataset]);

  // Skill Authoring Methods
  const addSkill = useCallback((skill: Skill) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      skills: [...dataset.skills, skill]
    });
  }, [dataset, updateDataset]);

  const updateSkill = useCallback((skill: Skill) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      skills: dataset.skills.map(s => s.id === skill.id ? skill : s)
    });
  }, [dataset, updateDataset]);

  const removeSkill = useCallback((skillId: string) => {
    if (!dataset) return;
    const updated = safeDeleteSkill(dataset, skillId);
    updateDataset(updated);
  }, [dataset, updateDataset]);

  // Relationship Methods
  const addRelationship = useCallback((rel: Relationship) => {
    if (!dataset) return;
    updateDataset({
      ...dataset,
      lastUpdated: new Date().toISOString(),
      relationships: [...dataset.relationships, rel]
    });
  }, [dataset, updateDataset]);

  const removeRelationship = useCallback((relId: string) => {
    if (!dataset) return;
    const updated = safeDeleteRelationship(dataset, relId);
    updateDataset(updated);
  }, [dataset, updateDataset]);

  const selectProgramme = useCallback((id: string | null) => {
    setActiveProgrammeId(id);
  }, []);

  return {
    dataset,
    isLoaded,
    loadDemo,
    resetData,
    importData,
    exportData,
    // Programmes
    addProgramme,
    updateProgramme,
    removeProgramme,
    // Modules
    addModule,
    updateModule,
    removeModule,
    // Outcomes
    addOutcome,
    updateOutcome,
    removeOutcome,
    // Assessments
    addAssessment,
    updateAssessment,
    removeAssessment,
    // Skills
    addSkill,
    updateSkill,
    removeSkill,
    // Relationships
    addRelationship,
    removeRelationship,
    // General
    updateDataset,
    activeProgrammeId,
    selectProgramme
  };
};
