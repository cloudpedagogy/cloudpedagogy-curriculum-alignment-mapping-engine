import type { MappingDataset } from '../../types';

export type ValidationCategory =
  | 'duplicate_id'
  | 'broken_link'
  | 'missing_ref'
  | 'orphan'
  | 'outcome_unassessed'
  | 'skill_undeveloped';

export type DiagnosticKind = 'structural' | 'educational_observation';

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
  entityId?: string;
  category: ValidationCategory;
  kind?: DiagnosticKind;
}

export const isStructuralIssue = (issue: ValidationIssue): boolean => {
  return issue.kind === 'structural' || issue.category === 'duplicate_id' || issue.category === 'broken_link' || issue.category === 'missing_ref';
};

export const isEducationalObservation = (issue: ValidationIssue): boolean => {
  return issue.kind === 'educational_observation' || issue.category === 'orphan' || issue.category === 'outcome_unassessed' || issue.category === 'skill_undeveloped';
};

export const validateDataset = (dataset: MappingDataset): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const { modules, outcomes, assessments, skills, relationships } = dataset;

  // 1. Detect Duplicate IDs (Structural data error)
  const allIds = [
    ...modules.map(m => m.id),
    ...outcomes.map(o => o.id),
    ...assessments.map(a => a.id),
    ...skills.map(s => s.id)
  ];
  const idCounts = allIds.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(idCounts).forEach(([id, count]) => {
    if (count > 1) {
      issues.push({
        level: 'error',
        kind: 'structural',
        message: `Duplicate ID detected: ${id}. Identifiers must be unique across all entities to maintain data integrity.`,
        entityId: id,
        category: 'duplicate_id'
      });
    }
  });

  // 2. Detect Broken Links (Structural data error: relationship pointing to non-existent ID)
  const existingIdSet = new Set(allIds);
  relationships.forEach(rel => {
    if (!existingIdSet.has(rel.sourceId)) {
      issues.push({
        level: 'warning',
        kind: 'structural',
        message: `Broken relationship reference: Source entity '${rel.sourceId}' was not found for relationship '${rel.type}'.`,
        entityId: rel.id,
        category: 'broken_link'
      });
    }
    if (!existingIdSet.has(rel.targetId)) {
      issues.push({
        level: 'warning',
        kind: 'structural',
        message: `Broken relationship reference: Target entity '${rel.targetId}' was not found for relationship '${rel.type}'.`,
        entityId: rel.id,
        category: 'broken_link'
      });
    }
  });

  // 3. Detect Missing References (Structural data error: entity claiming a parent moduleId that does not exist)
  const moduleIds = new Set(modules.map(m => m.id));
  outcomes.forEach(o => {
    if (o.moduleId && !moduleIds.has(o.moduleId)) {
      issues.push({
        level: 'warning',
        kind: 'structural',
        message: `Missing reference: Outcome ${o.code} references non-existent module ID '${o.moduleId}'.`,
        entityId: o.id,
        category: 'missing_ref'
      });
    }
  });
  assessments.forEach(a => {
    if (a.moduleId && !moduleIds.has(a.moduleId)) {
      issues.push({
        level: 'warning',
        kind: 'structural',
        message: `Missing reference: Assessment ${a.title} references non-existent module ID '${a.moduleId}'.`,
        entityId: a.id,
        category: 'missing_ref'
      });
    }
  });

  // 4. Detect Unlinked Entities (Educational design observation)
  const relIds = new Set([
    ...relationships.map(r => r.sourceId),
    ...relationships.map(r => r.targetId)
  ]);

  modules.forEach(m => {
    if (!relIds.has(m.id)) {
      issues.push({
        level: 'warning',
        kind: 'educational_observation',
        message: `Unlinked module: ${m.code} (${m.title}) has no recorded relationships. Review if this module is intended to be standalone or requires alignment links.`,
        entityId: m.id,
        category: 'orphan'
      });
    }
  });

  outcomes.forEach(o => {
    if (!relIds.has(o.id)) {
      issues.push({
        level: 'warning',
        kind: 'educational_observation',
        message: `Unlinked outcome: ${o.code} has no recorded module or assessment links.`,
        entityId: o.id,
        category: 'orphan'
      });
    }
  });

  // 5. Detect Outcomes without Assessments (Educational design observation)
  const assessedOutcomeIds = new Set(
    relationships
      .filter(r => r.type === 'assesses' && r.targetType === 'outcome')
      .map(r => r.targetId)
  );

  outcomes.forEach(o => {
    if (!assessedOutcomeIds.has(o.id)) {
      issues.push({
        level: 'warning',
        kind: 'educational_observation',
        message: `Unassessed outcome: ${o.code} has no mapped assessment tasks. Review whether this outcome is assessed formatively, holistically, or requires explicit summative evidence.`,
        entityId: o.id,
        category: 'outcome_unassessed'
      });
    }
  });

  // 6. Detect Skills without Development (Educational design observation)
  const developedSkillIds = new Set(
    relationships
      .filter(r => r.type === 'develops' && r.targetType === 'skill')
      .map(r => r.targetId)
  );

  skills.forEach(s => {
    if (!developedSkillIds.has(s.id)) {
      issues.push({
        level: 'warning',
        kind: 'educational_observation',
        message: `Skill without explicit module link: ${s.name} is not currently mapped to a module for explicit development.`,
        entityId: s.id,
        category: 'skill_undeveloped'
      });
    }
  });

  return issues;
};
