import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { MappingDataset, Module, LearningOutcome, Assessment, Skill, EntityType } from '../../../types';
import { generateEntityId } from '../idGenerator.ts';
import { safeDeleteRelationship } from '../safeDeletion.ts';
import {
  validateRelationshipCreation,
  isDuplicateRelationship
} from '../../validation/relationshipValidation.ts';
import { findPrerequisiteChains } from '../../analysis/progression.ts';
import { calculateGraphMetrics } from '../../../features/relationships/graphUtils.ts';
import { analyzeAlignment } from '../../../features/mapping/alignmentAnalysis.ts';

// Helper to construct a clean blank test dataset
const createBlankDataset = (): MappingDataset => ({
  id: 'test_rel_dataset',
  name: 'Test Relationship Dataset',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  programmes: [],
  modules: [],
  outcomes: [],
  assessments: [],
  skills: [],
  relationships: []
});

test('Phase 2B - 1. Creation and Direction of All Supported Relationship Types', () => {
  const dataset = createBlankDataset();

  // Seed entities
  const mod1: Module = { id: 'm1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  const mod2: Module = { id: 'm2', code: 'CS102', title: 'Data Structures', level: '4', credits: 15 };
  const lo1: LearningOutcome = { id: 'lo1', code: 'LO1', description: 'Programming concepts', moduleId: 'm1' };
  const asmt1: Assessment = { id: 'a1', title: 'Midterm Exam', type: 'Exam', weight: 50, moduleId: 'm1' };
  const skill1: Skill = { id: 's1', name: 'Algorithmic Problem Solving', category: 'Technical' };

  dataset.modules.push(mod1, mod2);
  dataset.outcomes.push(lo1);
  dataset.assessments.push(asmt1);
  dataset.skills.push(skill1);

  // 1. Module -> Outcome alignment ('aligns')
  const alignDraft = {
    type: 'aligns' as const,
    sourceType: 'module' as const,
    sourceId: 'm1',
    targetType: 'outcome' as const,
    targetId: 'lo1'
  };
  const alignValidation = validateRelationshipCreation(dataset, alignDraft);
  assert.strictEqual(alignValidation.isValid, true);
  dataset.relationships.push({
    id: generateEntityId('rel'),
    ...alignDraft
  });

  // 2. Assessment -> Outcome mapping ('assesses')
  const assessDraft = {
    type: 'assesses' as const,
    sourceType: 'assessment' as const,
    sourceId: 'a1',
    targetType: 'outcome' as const,
    targetId: 'lo1'
  };
  const assessValidation = validateRelationshipCreation(dataset, assessDraft);
  assert.strictEqual(assessValidation.isValid, true);
  dataset.relationships.push({
    id: generateEntityId('rel'),
    ...assessDraft
  });

  // 3. Module -> Skill development ('develops')
  const devDraft = {
    type: 'develops' as const,
    sourceType: 'module' as const,
    sourceId: 'm1',
    targetType: 'skill' as const,
    targetId: 's1'
  };
  const devValidation = validateRelationshipCreation(dataset, devDraft);
  assert.strictEqual(devValidation.isValid, true);
  dataset.relationships.push({
    id: generateEntityId('rel'),
    ...devDraft
  });

  // 4. Module -> Module prerequisite ('prerequisite')
  // m2 requires m1
  const prereqDraft = {
    type: 'prerequisite' as const,
    sourceType: 'module' as const,
    sourceId: 'm2',
    targetType: 'module' as const,
    targetId: 'm1'
  };
  const prereqValidation = validateRelationshipCreation(dataset, prereqDraft);
  assert.strictEqual(prereqValidation.isValid, true);
  dataset.relationships.push({
    id: generateEntityId('rel'),
    ...prereqDraft
  });

  assert.strictEqual(dataset.relationships.length, 4);
});

test('Phase 2B - 2. Duplicate Relationship Prevention', () => {
  const dataset = createBlankDataset();
  const mod: Module = { id: 'm1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  const lo: LearningOutcome = { id: 'lo1', code: 'LO1', description: 'Description', moduleId: 'm1' };
  dataset.modules.push(mod);
  dataset.outcomes.push(lo);

  const draft = {
    type: 'aligns' as const,
    sourceType: 'module' as const,
    sourceId: 'm1',
    targetType: 'outcome' as const,
    targetId: 'lo1'
  };

  dataset.relationships.push({
    id: 'rel_existing',
    ...draft
  });

  assert.strictEqual(isDuplicateRelationship(dataset, draft), true);

  const validation = validateRelationshipCreation(dataset, draft);
  assert.strictEqual(validation.isValid, false);
  assert.ok(validation.error?.includes('Duplicate relationship'));
});

test('Phase 2B - 3. Invalid Endpoint and Entity Combination Rejection', () => {
  const dataset = createBlankDataset();
  const mod: Module = { id: 'm1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  const skill: Skill = { id: 's1', name: 'Critical Thinking', category: 'Cognitive' };
  dataset.modules.push(mod);
  dataset.skills.push(skill);

  // 1. Non-existent source ID
  const invalidSource = validateRelationshipCreation(dataset, {
    type: 'aligns',
    sourceType: 'module',
    sourceId: 'm_nonexistent',
    targetType: 'outcome',
    targetId: 'lo1'
  });
  assert.strictEqual(invalidSource.isValid, false);
  assert.ok(invalidSource.error?.includes('source entity'));

  // 2. Non-existent target ID
  const invalidTarget = validateRelationshipCreation(dataset, {
    type: 'develops',
    sourceType: 'module',
    sourceId: 'm1',
    targetType: 'skill',
    targetId: 's_nonexistent'
  });
  assert.strictEqual(invalidTarget.isValid, false);
  assert.ok(invalidTarget.error?.includes('target entity'));

  // 3. Invalid combination (trying to 'aligns' a module to a skill)
  const invalidCombo = validateRelationshipCreation(dataset, {
    type: 'aligns',
    sourceType: 'module',
    sourceId: 'm1',
    targetType: 'skill' as unknown as EntityType,
    targetId: 's1'
  });
  assert.strictEqual(invalidCombo.isValid, false);
  assert.ok(invalidCombo.error?.includes('Invalid entity combination'));
});

test('Phase 2B - 4. Self-Prerequisite Rejection', () => {
  const dataset = createBlankDataset();
  const mod: Module = { id: 'm1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  dataset.modules.push(mod);

  const selfPrereq = validateRelationshipCreation(dataset, {
    type: 'prerequisite',
    sourceType: 'module',
    sourceId: 'm1',
    targetType: 'module',
    targetId: 'm1'
  });

  assert.strictEqual(selfPrereq.isValid, false);
  assert.ok(selfPrereq.error?.includes('Self-referencing prerequisite'));
  assert.ok(selfPrereq.error?.includes('CS101'));
});

test('Phase 2B - 5. Direct and Transitive Prerequisite Cycle Detection', () => {
  const dataset = createBlankDataset();
  const m1: Module = { id: 'm1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  const m2: Module = { id: 'm2', code: 'CS102', title: 'Data Structures', level: '4', credits: 15 };
  const m3: Module = { id: 'm3', code: 'CS201', title: 'Algorithms', level: '5', credits: 15 };
  const m4: Module = { id: 'm4', code: 'CS301', title: 'Advanced AI', level: '6', credits: 15 };

  dataset.modules.push(m1, m2, m3, m4);

  // Establish chain: m2 requires m1; m3 requires m2; m4 requires m3
  // (m4 -> m3 -> m2 -> m1)
  dataset.relationships.push(
    { id: 'r1', type: 'prerequisite', sourceType: 'module', sourceId: 'm2', targetType: 'module', targetId: 'm1' },
    { id: 'r2', type: 'prerequisite', sourceType: 'module', sourceId: 'm3', targetType: 'module', targetId: 'm2' },
    { id: 'r3', type: 'prerequisite', sourceType: 'module', sourceId: 'm4', targetType: 'module', targetId: 'm3' }
  );

  // 1. Direct cycle: attempt m1 requires m2
  const directCycle = validateRelationshipCreation(dataset, {
    type: 'prerequisite',
    sourceType: 'module',
    sourceId: 'm1',
    targetType: 'module',
    targetId: 'm2'
  });
  assert.strictEqual(directCycle.isValid, false);
  assert.ok(directCycle.error?.includes('Prerequisite dependency cycle detected'));

  // 2. Transitive cycle: attempt m1 requires m4 (would close m1 -> m4 -> m3 -> m2 -> m1)
  const transitiveCycle = validateRelationshipCreation(dataset, {
    type: 'prerequisite',
    sourceType: 'module',
    sourceId: 'm1',
    targetType: 'module',
    targetId: 'm4'
  });
  assert.strictEqual(transitiveCycle.isValid, false);
  assert.ok(transitiveCycle.error?.includes('cycle detected'));
  assert.ok(transitiveCycle.error?.includes('CS101 → CS301 → CS201 → CS102 → CS101'));

  // 3. Valid prerequisite: m4 also requiring m1 (shortcut dependency, valid DAG)
  const validDagShortcut = validateRelationshipCreation(dataset, {
    type: 'prerequisite',
    sourceType: 'module',
    sourceId: 'm4',
    targetType: 'module',
    targetId: 'm1'
  });
  assert.strictEqual(validDagShortcut.isValid, true);
});

test('Phase 2B - 6. Relationship Removal Preserves Endpoint Entities', () => {
  const dataset = createBlankDataset();
  const m1: Module = { id: 'm1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  const lo: LearningOutcome = { id: 'lo1', code: 'LO1', description: 'LO Description', moduleId: 'm1' };
  dataset.modules.push(m1);
  dataset.outcomes.push(lo);

  const relId = 'rel_align_test';
  dataset.relationships.push({
    id: relId,
    type: 'aligns',
    sourceType: 'module',
    sourceId: 'm1',
    targetType: 'outcome',
    targetId: 'lo1'
  });

  assert.strictEqual(dataset.relationships.length, 1);
  assert.strictEqual(dataset.modules.length, 1);
  assert.strictEqual(dataset.outcomes.length, 1);

  // Remove the relationship using safeDeleteRelationship
  const updated = safeDeleteRelationship(dataset, relId);

  // Relationship is removed
  assert.strictEqual(updated.relationships.length, 0);
  // Both endpoints are preserved completely intact
  assert.strictEqual(updated.modules.length, 1);
  assert.strictEqual(updated.modules[0].id, 'm1');
  assert.strictEqual(updated.outcomes.length, 1);
  assert.strictEqual(updated.outcomes[0].id, 'lo1');
});

test('Phase 2B - 7. Analytical View Metric Updates across Relationship Operations', () => {
  const dataset = createBlankDataset();
  const m1: Module = { id: 'm1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  const m2: Module = { id: 'm2', code: 'CS102', title: 'Data Structures', level: '5', credits: 15 };
  const lo: LearningOutcome = { id: 'lo1', code: 'LO1', description: 'Core principles', moduleId: 'm1' };
  const asmt: Assessment = { id: 'a1', title: 'Lab Exam', type: 'Practical', weight: 40, moduleId: 'm1' };
  const skill: Skill = { id: 's1', name: 'Software Design', category: 'Technical' };

  dataset.modules.push(m1, m2);
  dataset.outcomes.push(lo);
  dataset.assessments.push(asmt);
  dataset.skills.push(skill);

  // Initially, outcome is unassessed, skill is undeveloped, and graph has 0 edges
  const initialMetrics = calculateGraphMetrics(dataset);
  assert.strictEqual(initialMetrics.totalRelationships, 0);

  const initialSignals = analyzeAlignment(dataset);
  assert.strictEqual(initialSignals.outcomeSignals.unassessed.length, 1);
  assert.ok(initialSignals.outcomeSignals.unassessed.includes('lo1'));

  // Add assessment mapping and skill development
  dataset.relationships.push(
    { id: 'r_assesses', type: 'assesses', sourceType: 'assessment', sourceId: 'a1', targetType: 'outcome', targetId: 'lo1' },
    { id: 'r_develops', type: 'develops', sourceType: 'module', sourceId: 'm1', targetType: 'skill', targetId: 's1' },
    { id: 'r_prereq', type: 'prerequisite', sourceType: 'module', sourceId: 'm2', targetType: 'module', targetId: 'm1' }
  );

  // Verify graph metrics updated
  const updatedMetrics = calculateGraphMetrics(dataset);
  assert.strictEqual(updatedMetrics.totalRelationships, 3);

  // Verify alignment signals updated (outcome is now assessed)
  const updatedSignals = analyzeAlignment(dataset);
  assert.strictEqual(updatedSignals.outcomeSignals.unassessed.length, 0);

  // Verify progression chains analysis updated
  const chains = findPrerequisiteChains(dataset);
  const m2Chain = chains.find(c => c.moduleId === 'm2');
  assert.ok(m2Chain);
  assert.ok(m2Chain.chain.includes('m1'));
});

test('Phase 2B - 8. Import/Export Fidelity with All Relationship Types', () => {
  const dataset = createBlankDataset();
  dataset.modules.push(
    { id: 'm1', code: 'BIO101', title: 'Cell Biology', level: '4', credits: 15 },
    { id: 'm2', code: 'BIO201', title: 'Genetics', level: '5', credits: 15 }
  );
  dataset.outcomes.push(
    { id: 'lo1', code: 'LO1', description: 'Understand genetics', moduleId: 'm2' }
  );
  dataset.assessments.push(
    { id: 'a1', title: 'Lab Report', type: 'Coursework', weight: 50, moduleId: 'm2' }
  );
  dataset.skills.push(
    { id: 's1', name: 'Microscopy', category: 'Practical' }
  );

  dataset.relationships.push(
    { id: 'r1', type: 'aligns', sourceType: 'module', sourceId: 'm2', targetType: 'outcome', targetId: 'lo1' },
    { id: 'r2', type: 'assesses', sourceType: 'assessment', sourceId: 'a1', targetType: 'outcome', targetId: 'lo1' },
    { id: 'r3', type: 'develops', sourceType: 'module', sourceId: 'm1', targetType: 'skill', targetId: 's1' },
    { id: 'r4', type: 'prerequisite', sourceType: 'module', sourceId: 'm2', targetType: 'module', targetId: 'm1' }
  );

  // Roundtrip export and re-import
  const exported = JSON.stringify(dataset, null, 2);
  const reimported: MappingDataset = JSON.parse(exported);

  assert.strictEqual(reimported.relationships.length, 4);
  assert.ok(reimported.relationships.some(r => r.type === 'aligns' && r.sourceId === 'm2' && r.targetId === 'lo1'));
  assert.ok(reimported.relationships.some(r => r.type === 'assesses' && r.sourceId === 'a1' && r.targetId === 'lo1'));
  assert.ok(reimported.relationships.some(r => r.type === 'develops' && r.sourceId === 'm1' && r.targetId === 's1'));
  assert.ok(reimported.relationships.some(r => r.type === 'prerequisite' && r.sourceId === 'm2' && r.targetId === 'm1'));
});
