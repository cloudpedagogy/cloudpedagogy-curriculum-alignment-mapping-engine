import type { MappingDataset } from '../../types';

export interface AlignmentSignals {
  outcomeSignals: {
    unmapped: string[];       // ID of outcomes not linked to any module
    unassessed: string[];     // ID of outcomes not linked to any assessment
    overConcentrated: Array<{ id: string; moduleCount: number }>; // Outcomes in >= 3 modules
  };
  skillSignals: {
    weaklyRepresented: string[]; // ID of skills linked to 0 or 1 module
  };
  assessmentSignals: {
    assessmentDenseModules: Array<{ id: string; assessmentCount: number; outcomeCount: number }>; // Modules with high assessment count relative to outcomes
  };
}

export const analyzeAlignment = (dataset: MappingDataset): AlignmentSignals => {
  const { modules, outcomes, assessments, skills, relationships } = dataset;

  const getTargetIds = (sourceType: string, targetType: string, relType: string) => 
    new Set(relationships
      .filter(r => r.sourceType === sourceType && r.targetType === targetType && r.type === relType)
      .map(r => r.targetId));


  // 1. Outcome Signals
  const mappedOutcomeIds = getTargetIds('module', 'outcome', 'aligns');
  const assessedOutcomeIds = getTargetIds('assessment', 'outcome', 'assesses');

  const overConcentrated: AlignmentSignals['outcomeSignals']['overConcentrated'] = [];
  outcomes.forEach(outcome => {
    const moduleCount = relationships.filter(r => 
      r.targetId === outcome.id && r.sourceType === 'module' && r.type === 'aligns'
    ).length;
    if (moduleCount >= 3) {
      overConcentrated.push({ id: outcome.id, moduleCount });
    }
  });

  // 2. Skill Signals
  const weaklyRepresented: string[] = [];
  skills.forEach(skill => {
    const moduleCount = relationships.filter(r => 
      r.targetId === skill.id && r.sourceType === 'module' && r.type === 'develops'
    ).length;
    if (moduleCount <= 1) {
      weaklyRepresented.push(skill.id);
    }
  });

  // 3. Assessment Signals
  const assessmentDenseModules: AlignmentSignals['assessmentSignals']['assessmentDenseModules'] = [];
  modules.forEach(module => {
    const assessmentCount = relationships.filter(r => 
      r.sourceId === module.id && r.targetType === 'assessment' && r.type === 'aligns'
    ).length || assessments.filter(a => a.moduleId === module.id).length; // Fallback to implicit if explicit missing

    const outcomeCount = relationships.filter(r => 
      r.sourceId === module.id && r.targetType === 'outcome' && r.type === 'aligns'
    ).length || outcomes.filter(o => o.moduleId === module.id).length;

    // Use a simple heuristic: if assessment count is 2x or more than outcomes, or > 4 total
    if (assessmentCount > outcomeCount && assessmentCount > 2) {
      assessmentDenseModules.push({ id: module.id, assessmentCount, outcomeCount });
    }
  });

  return {
    outcomeSignals: {
      unmapped: outcomes.filter(o => !mappedOutcomeIds.has(o.id)).map(o => o.id),
      unassessed: outcomes.filter(o => !assessedOutcomeIds.has(o.id)).map(o => o.id),
      overConcentrated
    },
    skillSignals: {
      weaklyRepresented
    },
    assessmentSignals: {
      assessmentDenseModules
    }
  };
};
