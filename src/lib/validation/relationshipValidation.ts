import type { MappingDataset, EntityType, RelationshipType } from '../../types';

export interface RelationshipDraft {
  type: RelationshipType;
  sourceType: EntityType;
  sourceId: string;
  targetType: EntityType;
  targetId: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  cyclePath?: string[];
}

export interface RelationshipTypeDefinition {
  type: RelationshipType;
  label: string;
  description: string;
  sourceType: EntityType;
  targetType: EntityType;
  sourceLabel: string;
  targetLabel: string;
  verb: string;
}

export const RELATIONSHIP_TYPE_DEFINITIONS: Record<RelationshipType, RelationshipTypeDefinition> = {
  aligns: {
    type: 'aligns',
    label: 'Module Outcome Alignment',
    description: 'Connects a teaching module to a learning outcome it delivers or covers.',
    sourceType: 'module',
    targetType: 'outcome',
    sourceLabel: 'Teaching Module',
    targetLabel: 'Aligned Learning Outcome',
    verb: 'delivers / aligns to'
  },
  assesses: {
    type: 'assesses',
    label: 'Assessment Outcome Mapping',
    description: 'Maps an assessment task to a specific learning outcome it evaluates.',
    sourceType: 'assessment',
    targetType: 'outcome',
    sourceLabel: 'Assessment Task',
    targetLabel: 'Evaluated Learning Outcome',
    verb: 'evaluates'
  },
  develops: {
    type: 'develops',
    label: 'Module Skill Development',
    description: 'Maps a module to a graduate skill or professional attribute it develops.',
    sourceType: 'module',
    targetType: 'skill',
    sourceLabel: 'Teaching Module',
    targetLabel: 'Developed Skill / Attribute',
    verb: 'develops'
  },
  prerequisite: {
    type: 'prerequisite',
    label: 'Module Prerequisite',
    description: 'Specifies that a module requires prior completion of another module.',
    sourceType: 'module',
    targetType: 'module',
    sourceLabel: 'Dependent Course / Module',
    targetLabel: 'Required Prior Module',
    verb: 'requires prior completion of'
  }
};

/**
 * Checks whether an entity with given ID exists in the dataset under the expected EntityType.
 */
export const checkEntityExists = (
  dataset: MappingDataset,
  type: EntityType,
  id: string
): boolean => {
  switch (type) {
    case 'module':
      return dataset.modules.some(m => m.id === id);
    case 'outcome':
      return dataset.outcomes.some(o => o.id === id);
    case 'assessment':
      return dataset.assessments.some(a => a.id === id);
    case 'skill':
      return dataset.skills.some(s => s.id === id);
    default:
      return false;
  }
};

/**
 * Detects whether introducing a prerequisite relationship (sourceModuleId requires targetModuleId)
 * would create a direct or transitive dependency cycle.
 *
 * In CAME prerequisite semantics:
 * sourceId = module that depends on targetId
 * targetId = prerequisite module that must be completed first
 *
 * A cycle occurs if targetModuleId already directly or indirectly depends on sourceModuleId.
 */
export const detectPrerequisiteCycle = (
  dataset: MappingDataset,
  sourceModuleId: string,
  targetModuleId: string
): { hasCycle: boolean; cyclePath?: string[] } => {
  // Self-prerequisite check
  if (sourceModuleId === targetModuleId) {
    const mod = dataset.modules.find(m => m.id === sourceModuleId);
    const code = mod ? mod.code : sourceModuleId;
    return {
      hasCycle: true,
      cyclePath: [code, code]
    };
  }

  // Gather existing module-to-module prerequisite relationships
  const prereqEdges = dataset.relationships.filter(
    r => r.type === 'prerequisite' && r.sourceType === 'module' && r.targetType === 'module'
  );

  // Build adjacency list: node -> array of prerequisites it requires
  const adj = new Map<string, string[]>();
  prereqEdges.forEach(r => {
    if (!adj.has(r.sourceId)) adj.set(r.sourceId, []);
    adj.get(r.sourceId)!.push(r.targetId);
  });

  // Breadth-first search from targetModuleId to see if it reaches sourceModuleId
  const visited = new Set<string>();
  const queue: Array<{ current: string; path: string[] }> = [
    { current: targetModuleId, path: [targetModuleId] }
  ];
  visited.add(targetModuleId);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current === sourceModuleId) {
      const moduleMap = new Map(dataset.modules.map(m => [m.id, m.code]));
      const fullPath = [sourceModuleId, ...path].map(id => moduleMap.get(id) || id);
      return {
        hasCycle: true,
        cyclePath: fullPath
      };
    }

    const nextNodes = adj.get(current) || [];
    for (const next of nextNodes) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ current: next, path: [...path, next] });
      }
    }
  }

  return { hasCycle: false };
};

/**
 * Checks whether an identical relationship already exists in the dataset.
 */
export const isDuplicateRelationship = (
  dataset: MappingDataset,
  draft: RelationshipDraft
): boolean => {
  return dataset.relationships.some(
    r =>
      r.type === draft.type &&
      r.sourceId === draft.sourceId &&
      r.sourceType === draft.sourceType &&
      r.targetId === draft.targetId &&
      r.targetType === draft.targetType
  );
};

/**
 * Comprehensive validation for relationship creation.
 * Returns isValid: true or a user-facing error message explaining why creation was rejected.
 */
export const validateRelationshipCreation = (
  dataset: MappingDataset,
  draft: RelationshipDraft
): ValidationResult => {
  const def = RELATIONSHIP_TYPE_DEFINITIONS[draft.type];
  if (!def) {
    return { isValid: false, error: `Unsupported relationship type: '${draft.type}'.` };
  }

  if (!draft.sourceId || !draft.targetId) {
    return { isValid: false, error: 'Both source and target entities must be selected.' };
  }

  // Type combination check
  if (draft.sourceType !== def.sourceType || draft.targetType !== def.targetType) {
    return {
      isValid: false,
      error: `Invalid entity combination for ${def.label}. Source must be a ${def.sourceLabel} and target must be a ${def.targetLabel}.`
    };
  }

  // Source entity existence check
  if (!checkEntityExists(dataset, draft.sourceType, draft.sourceId)) {
    return {
      isValid: false,
      error: `Selected source entity (${def.sourceLabel}) could not be found in the active curriculum.`
    };
  }

  // Target entity existence check
  if (!checkEntityExists(dataset, draft.targetType, draft.targetId)) {
    return {
      isValid: false,
      error: `Selected target entity (${def.targetLabel}) could not be found in the active curriculum.`
    };
  }

  // Self-referencing prerequisite check
  if (draft.type === 'prerequisite' && draft.sourceId === draft.targetId) {
    const mod = dataset.modules.find(m => m.id === draft.sourceId);
    const code = mod ? mod.code : draft.sourceId;
    return {
      isValid: false,
      error: `Self-referencing prerequisite is not allowed: Module '${code}' cannot require itself as a prerequisite.`
    };
  }

  // Prerequisite cycle check
  if (draft.type === 'prerequisite') {
    const cycleCheck = detectPrerequisiteCycle(dataset, draft.sourceId, draft.targetId);
    if (cycleCheck.hasCycle) {
      const pathStr = cycleCheck.cyclePath?.join(' → ') || `${draft.sourceId} → ${draft.targetId}`;
      return {
        isValid: false,
        error: `Prerequisite dependency cycle detected: ${pathStr}. Module prerequisites must form an acyclic study pathway.`,
        cyclePath: cycleCheck.cyclePath
      };
    }
  }

  // Duplicate check
  if (isDuplicateRelationship(dataset, draft)) {
    return {
      isValid: false,
      error: `Duplicate relationship: This ${def.label.toLowerCase()} link already exists.`
    };
  }

  return { isValid: true };
};
