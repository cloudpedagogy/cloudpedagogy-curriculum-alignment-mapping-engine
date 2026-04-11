import type { MappingDataset } from '../../types';

export interface PrerequisiteChain {
  moduleId: string;
  chain: string[]; // List of IDs in order of dependency
}

export const findPrerequisiteChains = (dataset: MappingDataset): PrerequisiteChain[] => {
  const { modules, relationships } = dataset;
  
  const prereqRels = relationships.filter(r => 
    r.type === 'prerequisite' && 
    r.sourceType === 'module' && 
    r.targetType === 'module'
  );

  const getChain = (moduleId: string, visited: Set<string> = new Set()): string[] => {
    if (visited.has(moduleId)) return []; // Circular dependency protection
    visited.add(moduleId);

    // Find what THIS module depends on (prerequisites)
    const directPrereqs = prereqRels
      .filter(r => r.sourceId === moduleId)
      .map(r => r.targetId);

    if (directPrereqs.length === 0) return [moduleId];

    // For simplicity in v1, we take the FIRST chain we find or combine them
    // Realistically, modules can have multiple chains, but we'll return a flat list of all ancestors here
    const ancestors = new Set<string>();
    directPrereqs.forEach(pr => {
      getChain(pr, visited).forEach(id => ancestors.add(id));
    });

    return [...ancestors, moduleId];
  };

  return modules.map(m => ({
    moduleId: m.id,
    chain: getChain(m.id)
  }));
};

export interface DisconnectedPath {
  moduleId: string;
  reason: string;
}

export const detectDisconnectedPathways = (dataset: MappingDataset): DisconnectedPath[] => {
  const { modules, relationships } = dataset;
  const paths: DisconnectedPath[] = [];

  const prereqRels = relationships.filter(r => 
    r.type === 'prerequisite' && 
    r.sourceType === 'module' && 
    r.targetType === 'module'
  );

  modules.forEach(module => {
    const level = parseInt(module.level) || 0;
    
    // Rule 1: High level modules (>4) with no prerequisites
    const hasPrereqs = prereqRels.some(r => r.sourceId === module.id);
    if (level > 4 && !hasPrereqs) {
      paths.push({
        moduleId: module.id,
        reason: `Level ${level} module has no defined prerequisites.`
      });
    }

    // Rule 2: Entry level modules (4) that are prerequisites for nothing
    const isPrereqFor = prereqRels.some(r => r.targetId === module.id);
    if (level === 4 && !isPrereqFor) {
      // This might be valid, so we flag it as a potential "Dead End" entry point
      // But only if there are other modules it COULD lead to
      paths.push({
        moduleId: module.id,
        reason: `Entry-level module is not a prerequisite for any further study.`
      });
    }
  });

  return paths;
};
