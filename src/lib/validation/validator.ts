import type { MappingDataset } from '../../types';

export interface ValidationIssue {
  level: 'error' | 'warning';
  message: string;
  entityId?: string;
  category: 'duplicate_id' | 'broken_link' | 'missing_ref' | 'orphan' | 'outcome_unassessed' | 'skill_undeveloped';
}

export const validateDataset = (dataset: MappingDataset): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const { modules, outcomes, assessments, skills, relationships } = dataset;

  // 1. Detect Duplicate IDs
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
        message: `Duplicate ID detected: ${id}. This may cause mapping inconsistences.`,
        entityId: id,
        category: 'duplicate_id'
      });
    }
  });

  // 2. Detect Broken Links (Relationships pointing to non-existent IDs)
  const existingIdSet = new Set(allIds);
  relationships.forEach(rel => {
    if (!existingIdSet.has(rel.sourceId)) {
      issues.push({
        level: 'warning',
        message: `Broken link: Source ID '${rel.sourceId}' not found for relationship ${rel.type}.`,
        entityId: rel.id,
        category: 'broken_link'
      });
    }
    if (!existingIdSet.has(rel.targetId)) {
      issues.push({
        level: 'warning',
        message: `Broken link: Target ID '${rel.targetId}' not found for relationship ${rel.type}.`,
        entityId: rel.id,
        category: 'broken_link'
      });
    }
  });

  // 3. Detect Missing References (e.g., entity claiming a moduleId that doesn't exist)
  const moduleIds = new Set(modules.map(m => m.id));
  outcomes.forEach(o => {
    if (o.moduleId && !moduleIds.has(o.moduleId)) {
      issues.push({
        level: 'warning',
        message: `Outcome ${o.code} references non-existent module ID: ${o.moduleId}.`,
        entityId: o.id,
        category: 'missing_ref'
      });
    }
  });
  assessments.forEach(a => {
    if (a.moduleId && !moduleIds.has(a.moduleId)) {
      issues.push({
        level: 'warning',
        message: `Assessment ${a.title} references non-existent module ID: ${a.moduleId}.`,
        entityId: a.id,
        category: 'missing_ref'
      });
    }
  });

  // 4. Detect Orphaned Entities (Nodes with 0 relationships)
  const relIds = new Set([
    ...relationships.map(r => r.sourceId),
    ...relationships.map(r => r.targetId)
  ]);

  modules.forEach(m => {
    if (!relIds.has(m.id)) {
      issues.push({
        level: 'warning',
        message: `Orphaned Module: ${m.code} has no structural relationships.`,
        entityId: m.id,
        category: 'orphan'
      });
    }
  });

  outcomes.forEach(o => {
    if (!relIds.has(o.id)) {
      issues.push({
        level: 'warning',
        message: `Orphaned Outcome: ${o.code} is not linked to any module or assessment.`,
        entityId: o.id,
        category: 'orphan'
      });
    }
  });

  // 5. Detect Outcomes without Assessments
  const assessedOutcomeIds = new Set(
    relationships
      .filter(r => r.type === 'assesses' && r.targetType === 'outcome')
      .map(r => r.targetId)
  );

  outcomes.forEach(o => {
    if (!assessedOutcomeIds.has(o.id)) {
      issues.push({
        level: 'warning',
        message: `Unassessed Outcome: ${o.code} has no mapped assessments.`,
        entityId: o.id,
        category: 'outcome_unassessed'
      });
    }
  });

  // 6. Detect Skills without Development
  const developedSkillIds = new Set(
    relationships
      .filter(r => r.type === 'develops' && r.targetType === 'skill')
      .map(r => r.targetId)
  );

  skills.forEach(s => {
    if (!developedSkillIds.has(s.id)) {
      issues.push({
        level: 'warning',
        message: `Undeveloped Skill: ${s.name} is not explicitly developed in any module.`,
        entityId: s.id,
        category: 'skill_undeveloped'
      });
    }
  });

  return issues;
};
