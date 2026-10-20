import type { MappingDataset, LearningOutcome } from '../../types';

export interface ModuleDeletionImpact {
  moduleExists: boolean;
  moduleCode: string;
  moduleTitle: string;
  hasDependencies: boolean;
  ownedAssessmentsCount: number;
  ownedOutcomesCount: number;
  sharedOutcomesCount: number;
  prerequisiteRelationshipsCount: number;
  affectedProgrammesCount: number;
  summaryMessage: string;
}

export interface AssessmentDeletionImpact {
  assessmentExists: boolean;
  assessmentTitle: string;
  hasDependencies: boolean;
  mappedOutcomesCount: number;
  summaryMessage: string;
}

export interface OutcomeDeletionImpact {
  outcomeExists: boolean;
  outcomeCode: string;
  hasDependencies: boolean;
  alignedModulesCount: number;
  assessingAssessmentsCount: number;
  summaryMessage: string;
}

export interface SkillDeletionImpact {
  skillExists: boolean;
  skillName: string;
  hasDependencies: boolean;
  developsRelationshipsCount: number;
  summaryMessage: string;
}

export interface ProgrammeDeletionImpact {
  programmeExists: boolean;
  programmeName: string;
  hasDependencies: boolean;
  associatedModulesCount: number;
  summaryMessage: string;
}

/**
 * Checks whether an outcome associated with a module is shared elsewhere:
 * - Has explicit 'aligns' relationship from another module
 * - Has explicit 'assesses' relationship from an assessment belonging to another module
 */
export const isOutcomeSharedWithOtherModules = (
  dataset: MappingDataset,
  outcomeId: string,
  primaryModuleId: string
): boolean => {
  // Check if another module has an 'aligns' edge to this outcome
  const alignedByOtherModule = dataset.relationships.some(
    r => r.type === 'aligns' && r.sourceType === 'module' && r.sourceId !== primaryModuleId && r.targetId === outcomeId
  );
  if (alignedByOtherModule) return true;

  // Check if an assessment belonging to another module assesses this outcome
  const primaryAssessmentIds = new Set(
    dataset.assessments.filter(a => a.moduleId === primaryModuleId).map(a => a.id)
  );
  const assessedByOtherAssessment = dataset.relationships.some(
    r => r.type === 'assesses' && !primaryAssessmentIds.has(r.sourceId) && r.targetId === outcomeId
  );
  if (assessedByOtherAssessment) return true;

  return false;
};

/**
 * Analyzes the impact of deleting a module, identifying dependent assessments,
 * shared vs exclusively owned outcomes, prerequisite chains, and programme references.
 */
export const getModuleDeletionImpact = (
  dataset: MappingDataset,
  moduleId: string
): ModuleDeletionImpact => {
  const targetModule = dataset.modules.find(m => m.id === moduleId);
  if (!targetModule) {
    return {
      moduleExists: false,
      moduleCode: '',
      moduleTitle: '',
      hasDependencies: false,
      ownedAssessmentsCount: 0,
      ownedOutcomesCount: 0,
      sharedOutcomesCount: 0,
      prerequisiteRelationshipsCount: 0,
      affectedProgrammesCount: 0,
      summaryMessage: 'Module does not exist.'
    };
  }

  const ownedAssessments = dataset.assessments.filter(a => a.moduleId === moduleId);
  const associatedOutcomes = dataset.outcomes.filter(o => o.moduleId === moduleId);

  let sharedOutcomesCount = 0;
  let ownedOutcomesCount = 0;

  associatedOutcomes.forEach(o => {
    if (isOutcomeSharedWithOtherModules(dataset, o.id, moduleId)) {
      sharedOutcomesCount++;
    } else {
      ownedOutcomesCount++;
    }
  });

  const prereqCount = dataset.relationships.filter(
    r => r.type === 'prerequisite' && (r.sourceId === moduleId || r.targetId === moduleId)
  ).length;

  const affectedProgrammesCount = (dataset.programmes || []).filter(
    p => p.moduleIds && p.moduleIds.includes(moduleId)
  ).length;

  const hasDependencies =
    ownedAssessments.length > 0 ||
    associatedOutcomes.length > 0 ||
    prereqCount > 0 ||
    affectedProgrammesCount > 0;

  const details: string[] = [];
  if (ownedAssessments.length > 0) details.push(`${ownedAssessments.length} assessment(s)`);
  if (ownedOutcomesCount > 0) details.push(`${ownedOutcomesCount} owned outcome(s)`);
  if (sharedOutcomesCount > 0) details.push(`${sharedOutcomesCount} shared outcome(s) (will be preserved)`);
  if (prereqCount > 0) details.push(`${prereqCount} prerequisite link(s)`);
  if (affectedProgrammesCount > 0) details.push(`referenced in ${affectedProgrammesCount} programme(s)`);

  const summaryMessage = hasDependencies
    ? `Module ${targetModule.code} (${targetModule.title}) has dependencies: ${details.join(', ')}.`
    : `Module ${targetModule.code} (${targetModule.title}) is unreferenced and safe to delete.`;

  return {
    moduleExists: true,
    moduleCode: targetModule.code,
    moduleTitle: targetModule.title,
    hasDependencies,
    ownedAssessmentsCount: ownedAssessments.length,
    ownedOutcomesCount,
    sharedOutcomesCount,
    prerequisiteRelationshipsCount: prereqCount,
    affectedProgrammesCount,
    summaryMessage
  };
};

/**
 * Analyzes the impact of deleting an assessment.
 */
export const getAssessmentDeletionImpact = (
  dataset: MappingDataset,
  assessmentId: string
): AssessmentDeletionImpact => {
  const assessment = dataset.assessments.find(a => a.id === assessmentId);
  if (!assessment) {
    return {
      assessmentExists: false,
      assessmentTitle: '',
      hasDependencies: false,
      mappedOutcomesCount: 0,
      summaryMessage: 'Assessment does not exist.'
    };
  }

  const mappedOutcomes = dataset.relationships.filter(
    r => r.sourceId === assessmentId && r.type === 'assesses'
  );

  const hasDependencies = mappedOutcomes.length > 0;
  const summaryMessage = hasDependencies
    ? `Assessment '${assessment.title}' is mapped to ${mappedOutcomes.length} learning outcome(s). Removing it unlinks these mappings; outcomes will be preserved.`
    : `Assessment '${assessment.title}' has no mapped outcomes and is safe to delete.`;

  return {
    assessmentExists: true,
    assessmentTitle: assessment.title,
    hasDependencies,
    mappedOutcomesCount: mappedOutcomes.length,
    summaryMessage
  };
};

/**
 * Analyzes the impact of deleting a learning outcome.
 */
export const getOutcomeDeletionImpact = (
  dataset: MappingDataset,
  outcomeId: string
): OutcomeDeletionImpact => {
  const outcome = dataset.outcomes.find(o => o.id === outcomeId);
  if (!outcome) {
    return {
      outcomeExists: false,
      outcomeCode: '',
      hasDependencies: false,
      alignedModulesCount: 0,
      assessingAssessmentsCount: 0,
      summaryMessage: 'Learning outcome does not exist.'
    };
  }

  const alignedModules = dataset.relationships.filter(
    r => r.targetId === outcomeId && r.type === 'aligns'
  );
  const assessingAssessments = dataset.relationships.filter(
    r => r.targetId === outcomeId && r.type === 'assesses'
  );

  const hasDependencies = alignedModules.length > 0 || assessingAssessments.length > 0;
  const summaryMessage = hasDependencies
    ? `Outcome ${outcome.code} is aligned to ${alignedModules.length} module(s) and assessed by ${assessingAssessments.length} assessment(s). Removing it unlinks these mappings; linked modules and assessments will be preserved.`
    : `Outcome ${outcome.code} has no active alignments and is safe to delete.`;

  return {
    outcomeExists: true,
    outcomeCode: outcome.code,
    hasDependencies,
    alignedModulesCount: alignedModules.length,
    assessingAssessmentsCount: assessingAssessments.length,
    summaryMessage
  };
};

/**
 * Analyzes the impact of deleting a skill.
 */
export const getSkillDeletionImpact = (
  dataset: MappingDataset,
  skillId: string
): SkillDeletionImpact => {
  const skill = dataset.skills.find(s => s.id === skillId);
  if (!skill) {
    return {
      skillExists: false,
      skillName: '',
      hasDependencies: false,
      developsRelationshipsCount: 0,
      summaryMessage: 'Skill does not exist.'
    };
  }

  const relationships = dataset.relationships.filter(
    r => (r.sourceId === skillId || r.targetId === skillId)
  );

  const hasDependencies = relationships.length > 0;
  const summaryMessage = hasDependencies
    ? `Skill '${skill.name}' is referenced in ${relationships.length} relationship(s). Deleting it will unlink these connections; modules will remain intact.`
    : `Skill '${skill.name}' has no active relationship links and is safe to delete.`;

  return {
    skillExists: true,
    skillName: skill.name,
    hasDependencies,
    developsRelationshipsCount: relationships.length,
    summaryMessage
  };
};

/**
 * Analyzes the impact of deleting a programme.
 */
export const getProgrammeDeletionImpact = (
  dataset: MappingDataset,
  programmeId: string
): ProgrammeDeletionImpact => {
  const programme = (dataset.programmes || []).find(p => p.id === programmeId);
  if (!programme) {
    return {
      programmeExists: false,
      programmeName: '',
      hasDependencies: false,
      associatedModulesCount: 0,
      summaryMessage: 'Programme does not exist.'
    };
  }

  const moduleCount = programme.moduleIds ? programme.moduleIds.length : 0;
  const hasDependencies = moduleCount > 0;
  const summaryMessage = hasDependencies
    ? `Programme '${programme.name}' includes ${moduleCount} associated module(s). Deleting it removes the diet structure; all modules and mappings will remain intact.`
    : `Programme '${programme.name}' has no associated modules and is safe to delete.`;

  return {
    programmeExists: true,
    programmeName: programme.name,
    hasDependencies,
    associatedModulesCount: moduleCount,
    summaryMessage
  };
};

/**
 * Safely deletes a module, preserving shared learning outcomes, unlinking relationships,
 * removing owned child assessments, and updating programme module lists.
 * This function is pure and idempotent.
 */
export const safeDeleteModule = (
  dataset: MappingDataset,
  moduleId: string,
  options: { preserveSharedOutcomes?: boolean } = { preserveSharedOutcomes: true }
): MappingDataset => {
  const moduleExists = dataset.modules.some(m => m.id === moduleId);
  if (!moduleExists) {
    return dataset; // Idempotent: return unmodified dataset if already deleted or invalid
  }

  // 1. Identify owned assessments
  const ownedAssessmentIds = new Set(
    dataset.assessments.filter(a => a.moduleId === moduleId).map(a => a.id)
  );

  // 2. Identify and partition outcomes
  const associatedOutcomes = dataset.outcomes.filter(o => o.moduleId === moduleId);
  const preservedOutcomes: LearningOutcome[] = [];
  const removedOutcomeIds = new Set<string>();

  associatedOutcomes.forEach(outcome => {
    const isShared = options.preserveSharedOutcomes && isOutcomeSharedWithOtherModules(dataset, outcome.id, moduleId);

    if (isShared) {
      // Find another module that aligns to this outcome to re-parent if available
      const otherAlignedRel = dataset.relationships.find(
        r => r.type === 'aligns' && r.sourceType === 'module' && r.sourceId !== moduleId && r.targetId === outcome.id
      );
      preservedOutcomes.push({
        ...outcome,
        moduleId: otherAlignedRel ? otherAlignedRel.sourceId : undefined
      });
    } else {
      removedOutcomeIds.add(outcome.id);
    }
  });

  // Keep outcomes that did not belong to this module PLUS preserved shared outcomes
  const updatedOutcomes = [
    ...dataset.outcomes.filter(o => o.moduleId !== moduleId),
    ...preservedOutcomes
  ];

  // 3. Remove owned assessments
  const updatedAssessments = dataset.assessments.filter(a => a.moduleId !== moduleId);

  // 4. Remove module from modules list
  const updatedModules = dataset.modules.filter(m => m.id !== moduleId);

  // 5. Unlink module from all programmes
  const updatedProgrammes = (dataset.programmes || []).map(p => ({
    ...p,
    moduleIds: (p.moduleIds || []).filter(id => id !== moduleId)
  }));

  // 6. Clean up relationships involving:
  // - the deleted module
  // - the deleted owned assessments
  // - the deleted exclusively owned outcomes
  const updatedRelationships = dataset.relationships.filter(r => {
    if (r.sourceId === moduleId || r.targetId === moduleId) return false;
    if (ownedAssessmentIds.has(r.sourceId) || ownedAssessmentIds.has(r.targetId)) return false;
    if (removedOutcomeIds.has(r.sourceId) || removedOutcomeIds.has(r.targetId)) return false;
    return true;
  });

  return {
    ...dataset,
    lastUpdated: new Date().toISOString(),
    modules: updatedModules,
    outcomes: updatedOutcomes,
    assessments: updatedAssessments,
    relationships: updatedRelationships,
    programmes: updatedProgrammes
  };
};

/**
 * Safely deletes an assessment.
 * Unlinks all 'assesses' or other relationships involving this assessment,
 * and crucially leaves all learning outcomes and modules completely intact.
 * Pure and idempotent.
 */
export const safeDeleteAssessment = (
  dataset: MappingDataset,
  assessmentId: string
): MappingDataset => {
  const assessmentExists = dataset.assessments.some(a => a.id === assessmentId);
  if (!assessmentExists) {
    return dataset; // Idempotent
  }

  return {
    ...dataset,
    lastUpdated: new Date().toISOString(),
    assessments: dataset.assessments.filter(a => a.id !== assessmentId),
    relationships: dataset.relationships.filter(
      r => r.sourceId !== assessmentId && r.targetId !== assessmentId
    )
  };
};

/**
 * Safely deletes a learning outcome.
 * Unlinks all relationships involving this outcome.
 * Preserves all modules, assessments, and skills intact.
 * Pure and idempotent.
 */
export const safeDeleteOutcome = (
  dataset: MappingDataset,
  outcomeId: string
): MappingDataset => {
  const outcomeExists = dataset.outcomes.some(o => o.id === outcomeId);
  if (!outcomeExists) {
    return dataset; // Idempotent
  }

  return {
    ...dataset,
    lastUpdated: new Date().toISOString(),
    outcomes: dataset.outcomes.filter(o => o.id !== outcomeId),
    relationships: dataset.relationships.filter(
      r => r.sourceId !== outcomeId && r.targetId !== outcomeId
    )
  };
};

/**
 * Safely deletes a relationship / alignment edge.
 * Crucially preserves both source and target entities intact.
 * Pure and idempotent.
 */
export const safeDeleteRelationship = (
  dataset: MappingDataset,
  relationshipId: string
): MappingDataset => {
  const relExists = dataset.relationships.some(r => r.id === relationshipId);
  if (!relExists) {
    return dataset; // Idempotent
  }

  return {
    ...dataset,
    lastUpdated: new Date().toISOString(),
    relationships: dataset.relationships.filter(r => r.id !== relationshipId)
  };
};

/**
 * Safely deletes a skill.
 * Unlinks all relationships involving this skill.
 * Preserves all modules and other entities intact.
 * Pure and idempotent.
 */
export const safeDeleteSkill = (
  dataset: MappingDataset,
  skillId: string
): MappingDataset => {
  const skillExists = dataset.skills.some(s => s.id === skillId);
  if (!skillExists) {
    return dataset;
  }

  return {
    ...dataset,
    lastUpdated: new Date().toISOString(),
    skills: dataset.skills.filter(s => s.id !== skillId),
    relationships: dataset.relationships.filter(
      r => r.sourceId !== skillId && r.targetId !== skillId
    )
  };
};

/**
 * Safely deletes a programme.
 * Preserves all modules, outcomes, assessments, skills, and relationships intact.
 * Pure and idempotent.
 */
export const safeDeleteProgramme = (
  dataset: MappingDataset,
  programmeId: string
): MappingDataset => {
  const programmeExists = (dataset.programmes || []).some(p => p.id === programmeId);
  if (!programmeExists) {
    return dataset;
  }

  return {
    ...dataset,
    lastUpdated: new Date().toISOString(),
    programmes: (dataset.programmes || []).filter(p => p.id !== programmeId)
  };
};

/**
 * Sanitizes existing or imported datasets by safely eliminating stale/dangling references:
 * - Relationships pointing to non-existent entity IDs
 * - Programme moduleIds pointing to non-existent module IDs
 * - Outcomes or assessments referencing non-existent module IDs
 */
export const sanitizeDatasetReferences = (dataset: MappingDataset): MappingDataset => {
  const moduleIds = new Set(dataset.modules.map(m => m.id));
  const outcomeIds = new Set(dataset.outcomes.map(o => o.id));
  const assessmentIds = new Set(dataset.assessments.map(a => a.id));
  const skillIds = new Set(dataset.skills.map(s => s.id));

  const allEntityIds = new Set([
    ...moduleIds,
    ...outcomeIds,
    ...assessmentIds,
    ...skillIds
  ]);

  // Clean relationships where either endpoint is missing
  const cleanRelationships = dataset.relationships.filter(
    r => allEntityIds.has(r.sourceId) && allEntityIds.has(r.targetId)
  );

  // Clean programmes moduleIds
  const cleanProgrammes = (dataset.programmes || []).map(p => ({
    ...p,
    moduleIds: (p.moduleIds || []).filter(id => moduleIds.has(id))
  }));

  // Clean outcomes with non-existent moduleId
  const cleanOutcomes = dataset.outcomes.map(o => {
    if (o.moduleId && !moduleIds.has(o.moduleId)) {
      return { ...o, moduleId: undefined };
    }
    return o;
  });

  // Clean assessments with non-existent moduleId
  const cleanAssessments = dataset.assessments.map(a => {
    if (a.moduleId && !moduleIds.has(a.moduleId)) {
      return { ...a, moduleId: undefined };
    }
    return a;
  });

  return {
    ...dataset,
    relationships: cleanRelationships,
    programmes: cleanProgrammes,
    outcomes: cleanOutcomes,
    assessments: cleanAssessments
  };
};
