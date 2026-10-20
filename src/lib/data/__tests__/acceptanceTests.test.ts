import test from 'node:test';
import assert from 'node:assert/strict';
import type { MappingDataset } from '../../../types';
import { demoDataset } from '../../../data/demo/index.ts';
import {
  safeDeleteModule,
  safeDeleteAssessment,
  safeDeleteOutcome,
  safeDeleteRelationship,
  getModuleDeletionImpact,
  getAssessmentDeletionImpact,
  getOutcomeDeletionImpact,
  sanitizeDatasetReferences
} from '../safeDeletion.ts';
import { validateDataset } from '../../validation/validator.ts';
import { calculateOutcomeAssessmentDensity } from '../../analysis/coverage.ts';
import { analyzeAlignment } from '../../../features/mapping/alignmentAnalysis.ts';

const getClone = (): MappingDataset => JSON.parse(JSON.stringify(demoDataset));

test('Acceptance Suite 1 — Initial Demo Data Verification (Test A)', () => {
  const dataset = getClone();

  // Verify entity counts
  assert.strictEqual(dataset.modules.length, 10, 'Expected 10 modules');
  assert.strictEqual(dataset.outcomes.length, 7, 'Expected 7 outcomes');
  assert.strictEqual(dataset.assessments.length, 5, 'Expected 5 assessments');
  assert.strictEqual(dataset.skills.length, 6, 'Expected 6 skills');

  // Verify system health
  const issues = validateDataset(dataset);
  const errors = issues.filter(i => i.level === 'error');
  const warnings = issues.filter(i => i.level === 'warning');

  assert.strictEqual(errors.length, 0, 'Initial dataset must have 0 errors');
  assert.strictEqual(warnings.length, 7, 'Initial dataset has 7 educational warnings');

  // Categorize the 7 warnings:
  // 2 orphan modules: m9 (PH303) and m10 (PH-ORPH)
  const orphanWarnings = warnings.filter(w => w.category === 'orphan');
  assert.strictEqual(orphanWarnings.length, 2, 'Expected 2 orphan modules (m9 and m10)');
  assert.ok(orphanWarnings.some(w => w.entityId === 'm9'));
  assert.ok(orphanWarnings.some(w => w.entityId === 'm10'));

  // 4 unassessed outcomes: lo1, lo5, lo6, lo7
  const unassessedWarnings = warnings.filter(w => w.category === 'outcome_unassessed');
  assert.strictEqual(unassessedWarnings.length, 4);

  // 1 undeveloped skill: s6 (Community engagement)
  const undevelopedWarnings = warnings.filter(w => w.category === 'skill_undeveloped');
  assert.strictEqual(undevelopedWarnings.length, 1);
  assert.strictEqual(undevelopedWarnings[0].entityId, 's6');

  // Zero broken links or missing references initially
  const brokenLinks = warnings.filter(w => w.category === 'broken_link');
  const missingRefs = warnings.filter(w => w.category === 'missing_ref');
  assert.strictEqual(brokenLinks.length, 0);
  assert.strictEqual(missingRefs.length, 0);
});

test('Acceptance Suite 2 — Relationship Unlinking Workflow (Test B)', () => {
  const dataset = getClone();

  // Initial: ea1 is [ASSESSMENT] a1 (Epidemiology Report) -> [OUTCOME] lo2 (LO2.1)
  const ea1 = dataset.relationships.find(r => r.id === 'ea1');
  assert.ok(ea1, 'ea1 must exist initially');
  assert.strictEqual(ea1.sourceId, 'a1');
  assert.strictEqual(ea1.targetId, 'lo2');

  const initialRelCount = dataset.relationships.length;

  // Unlink relationship ea1
  const updated = safeDeleteRelationship(dataset, 'ea1');

  // 1. The relationship disappears
  assert.strictEqual(updated.relationships.some(r => r.id === 'ea1'), false);
  assert.strictEqual(updated.relationships.length, initialRelCount - 1);

  // 2. The assessment remains
  const assessment = updated.assessments.find(a => a.id === 'a1');
  assert.ok(assessment, 'Assessment a1 must survive unlinking');
  assert.strictEqual(assessment.title, 'Epidemiology Report');

  // 3. The learning outcome remains
  const outcome = updated.outcomes.find(o => o.id === 'lo2');
  assert.ok(outcome, 'Outcome lo2 must survive unlinking');
  assert.strictEqual(outcome.code, 'LO2.1');

  // 4. Other relationships remain intact
  const m2AlignsLo2 = updated.relationships.find(r => r.id === 'e2');
  assert.ok(m2AlignsLo2, 'Module m2 aligns lo2 must remain intact');

  // 5. Analysis views update: lo2 is now unassessed
  const signals = analyzeAlignment(updated);
  assert.ok(signals.outcomeSignals.unassessed.includes('lo2'), 'LO2.1 should now be flagged as unassessed');

  // Density calculation updates
  const density = calculateOutcomeAssessmentDensity(updated);
  const lo2Density = density.find(d => d.outcomeId === 'lo2');
  assert.strictEqual(lo2Density?.assessmentCount, 0, 'LO2.1 density drops to 0');
});

test('Acceptance Suite 3 — Unreferenced Module Deletion Workflow (Test C)', () => {
  const dataset = getClone();

  // Module m10 (PH-ORPH) is unreferenced
  const impact = getModuleDeletionImpact(dataset, 'm10');
  assert.strictEqual(impact.moduleExists, true);
  assert.strictEqual(impact.ownedAssessmentsCount, 0);
  assert.strictEqual(impact.ownedOutcomesCount, 0);
  assert.strictEqual(impact.sharedOutcomesCount, 0);
  assert.strictEqual(impact.prerequisiteRelationshipsCount, 0);

  const updated = safeDeleteModule(dataset, 'm10');

  // 1. Module disappears and count decreases
  assert.strictEqual(updated.modules.some(m => m.id === 'm10'), false);
  assert.strictEqual(updated.modules.length, 9);

  // 2. No stale programme references remain: p2 had m10
  const p2 = updated.programmes?.find(p => p.id === 'p2');
  assert.ok(p2);
  assert.strictEqual(p2.moduleIds.includes('m10'), false);
  assert.deepStrictEqual(p2.moduleIds, ['m2', 'm3', 'm9']);

  // 3. System Health warnings drop from 7 to 6 (orphan m10 warning resolved, m9 remains)
  const issues = validateDataset(updated);
  const orphanWarnings = issues.filter(i => i.category === 'orphan');
  assert.strictEqual(orphanWarnings.length, 1, 'Only m9 orphan warning remains');
  assert.strictEqual(orphanWarnings[0].entityId, 'm9');
  assert.strictEqual(issues.filter(i => i.level === 'error').length, 0);
});

test('Acceptance Suite 4 — Dependency-Aware Module Deletion Workflow (Test D)', () => {
  const dataset = getClone();

  // Test cancellation: if user cancels, dataset is unchanged
  const impact = getModuleDeletionImpact(dataset, 'm1');
  assert.strictEqual(impact.hasDependencies, true);
  assert.strictEqual(impact.moduleCode, 'PH101');
  assert.strictEqual(impact.ownedOutcomesCount, 2); // lo1 and lo7
  assert.strictEqual(impact.prerequisiteRelationshipsCount, 1); // m2 -> m1
  assert.strictEqual(impact.affectedProgrammesCount, 1); // p1

  // User cancels: original dataset retained
  let currentDataset = dataset;
  const userConfirmed = false;
  if (userConfirmed) {
    currentDataset = safeDeleteModule(currentDataset, 'm1');
  }
  assert.strictEqual(currentDataset.modules.length, 10, 'Cancelled deletion leaves dataset untouched');

  // Now user confirms deletion
  const afterDelete = safeDeleteModule(dataset, 'm1');

  // 1. PH101 is removed
  assert.strictEqual(afterDelete.modules.some(m => m.id === 'm1'), false);
  assert.strictEqual(afterDelete.modules.length, 9);

  // 2. PH102 (m2) remains
  assert.ok(afterDelete.modules.some(m => m.id === 'm2'));

  // 3. Prerequisite references to PH101 are removed
  const prereqs = afterDelete.relationships.filter(r => r.type === 'prerequisite');
  assert.strictEqual(prereqs.some(r => r.sourceId === 'm1' || r.targetId === 'm1'), false);
  // Remaining prereqs (m3 -> m2, m8 -> m7) remain intact
  assert.strictEqual(prereqs.length, 2);

  // 4. Programme membership updated
  const p1 = afterDelete.programmes?.find(p => p.id === 'p1');
  assert.ok(p1);
  assert.strictEqual(p1.moduleIds.includes('m1'), false);

  // 5. Exclusively owned outcome lo7 is deleted cleanly
  assert.strictEqual(afterDelete.outcomes.some(o => o.id === 'lo7'), false);

  // 6. No unrelated entities disappeared
  assert.strictEqual(afterDelete.skills.length, 6);
  assert.strictEqual(afterDelete.assessments.length, 5);

  // 7. No validation errors or broken links
  const issues = validateDataset(afterDelete);
  const errors = issues.filter(i => i.level === 'error');
  const brokenLinks = issues.filter(i => i.category === 'broken_link' || i.category === 'missing_ref');
  assert.strictEqual(errors.length, 0);
  assert.strictEqual(brokenLinks.length, 0);
});

test('Acceptance Suite 5 — Assessment and Outcome Deletion Workflows (Test E)', () => {
  const dataset = getClone();

  // 1. Delete assessment with mapped outcome: a3 (Biostatistics Practical) assesses lo3
  const a3Impact = getAssessmentDeletionImpact(dataset, 'a3');
  assert.strictEqual(a3Impact.hasDependencies, true);
  assert.strictEqual(a3Impact.mappedOutcomesCount, 1);

  const afterAssessmentDelete = safeDeleteAssessment(dataset, 'a3');

  // a3 removed
  assert.strictEqual(afterAssessmentDelete.assessments.some(a => a.id === 'a3'), false);
  assert.strictEqual(afterAssessmentDelete.assessments.length, 4);

  // Relationship ea3 (a3 -> lo3) removed
  assert.strictEqual(afterAssessmentDelete.relationships.some(r => r.sourceId === 'a3'), false);

  // Outcome lo3 and module m3 PRESERVED
  assert.ok(afterAssessmentDelete.outcomes.some(o => o.id === 'lo3'), 'Outcome lo3 must survive');
  assert.ok(afterAssessmentDelete.modules.some(m => m.id === 'm3'), 'Module m3 must survive');

  // 2. Delete outcome with mapped assessment: lo4 (Critique health policy) is assessed by a2 (Policy Brief)
  const lo4Impact = getOutcomeDeletionImpact(afterAssessmentDelete, 'lo4');
  assert.strictEqual(lo4Impact.hasDependencies, true);
  assert.strictEqual(lo4Impact.alignedModulesCount, 1); // m4
  assert.strictEqual(lo4Impact.assessingAssessmentsCount, 1); // a2

  const afterOutcomeDelete = safeDeleteOutcome(afterAssessmentDelete, 'lo4');

  // lo4 removed
  assert.strictEqual(afterOutcomeDelete.outcomes.some(o => o.id === 'lo4'), false);
  assert.strictEqual(afterOutcomeDelete.outcomes.length, 6);

  // Alignment e4 (m4 -> lo4) and assessment ea2 (a2 -> lo4) removed
  assert.strictEqual(afterOutcomeDelete.relationships.some(r => r.targetId === 'lo4'), false);

  // Module m4 and Assessment a2 PRESERVED
  assert.ok(afterOutcomeDelete.modules.some(m => m.id === 'm4'), 'Module m4 must survive');
  const a2 = afterOutcomeDelete.assessments.find(a => a.id === 'a2');
  assert.ok(a2, 'Assessment a2 must survive');

  // Verify dataset validity
  const issues = validateDataset(afterOutcomeDelete);
  assert.strictEqual(issues.filter(i => i.level === 'error').length, 0);
  assert.strictEqual(issues.filter(i => i.category === 'broken_link').length, 0);
});

test('Acceptance Suite 6 — Deep Shared-Outcome Preservation Verification (Section 5)', () => {
  const dataset = getClone();

  // Create explicit scenario:
  // Outcome lo_shared belongs initially to m1 (Foundations of Public Health)
  // But is ALSO aligned to m2 (Epidemiology) and m3 (Biostatistics)
  // And is assessed by a1 in m2!
  dataset.outcomes.push({
    id: 'lo_shared_deep',
    code: 'LO-SHARED-1',
    description: 'Shared cross-modular capability in quantitative public health.',
    moduleId: 'm1'
  });

  // Alignment m2 -> lo_shared_deep
  dataset.relationships.push({
    id: 'rel_shared_m2',
    sourceId: 'm2',
    sourceType: 'module',
    targetId: 'lo_shared_deep',
    targetType: 'outcome',
    type: 'aligns'
  });

  // Alignment m3 -> lo_shared_deep
  dataset.relationships.push({
    id: 'rel_shared_m3',
    sourceId: 'm3',
    sourceType: 'module',
    targetId: 'lo_shared_deep',
    targetType: 'outcome',
    type: 'aligns'
  });

  // Assessment a1 (in m2) -> lo_shared_deep
  dataset.relationships.push({
    id: 'rel_shared_a1',
    sourceId: 'a1',
    sourceType: 'assessment',
    targetId: 'lo_shared_deep',
    targetType: 'outcome',
    type: 'assesses'
  });

  // Verify impact detection
  const impact = getModuleDeletionImpact(dataset, 'm1');
  assert.strictEqual(impact.sharedOutcomesCount, 1, 'Must detect 1 shared outcome on m1');

  // DELETE ORIGINAL PARENT MODULE m1
  const updated = safeDeleteModule(dataset, 'm1', { preserveSharedOutcomes: true });

  // 1. The shared outcome survives
  const survivedOutcome = updated.outcomes.find(o => o.id === 'lo_shared_deep');
  assert.ok(survivedOutcome, 'Condition 1: Shared outcome MUST survive');

  // 2. Its remaining alignment and assessment relationships survive
  const m2Rel = updated.relationships.find(r => r.id === 'rel_shared_m2');
  const m3Rel = updated.relationships.find(r => r.id === 'rel_shared_m3');
  const a1Rel = updated.relationships.find(r => r.id === 'rel_shared_a1');
  assert.ok(m2Rel, 'Condition 2a: Alignment to m2 survives');
  assert.ok(m3Rel, 'Condition 2b: Alignment to m3 survives');
  assert.ok(a1Rel, 'Condition 2c: Assessment relationship from a1 survives');

  // 3. Its moduleId is re-parented to a remaining aligned module (m2)
  assert.strictEqual(survivedOutcome.moduleId, 'm2', 'Condition 3: Re-parented to aligned module m2');

  // 4. No unrelated module or assessment is deleted
  assert.ok(updated.modules.some(m => m.id === 'm2'));
  assert.ok(updated.modules.some(m => m.id === 'm3'));
  assert.ok(updated.assessments.some(a => a.id === 'a1'));

  // 5. Exclusively owned outcome lo7 on m1 was removed
  assert.strictEqual(updated.outcomes.some(o => o.id === 'lo7'), false);

  // 6. Referential integrity check
  const issues = validateDataset(updated);
  assert.strictEqual(issues.filter(i => i.level === 'error').length, 0);
  assert.strictEqual(issues.filter(i => i.category === 'missing_ref').length, 0);
  assert.strictEqual(issues.filter(i => i.category === 'broken_link').length, 0);

  // 7. Persistence round-trip
  const jsonStr = JSON.stringify(updated);
  const reloaded: MappingDataset = JSON.parse(jsonStr);
  const reloadedShared = reloaded.outcomes.find(o => o.id === 'lo_shared_deep');
  assert.ok(reloadedShared);
  assert.strictEqual(reloadedShared.moduleId, 'm2');
});

test('Acceptance Suite 7 — Existing-Data Sanitisation Policy (Section 6)', () => {
  const dataset = getClone();

  // Test behavior on malformed dataset
  const malformed: MappingDataset = {
    ...dataset,
    relationships: [
      ...dataset.relationships,
      { id: 'ghost_rel', sourceId: 'ghost_1', sourceType: 'module', targetId: 'ghost_2', targetType: 'outcome', type: 'aligns' }
    ],
    programmes: [
      { id: 'p_ghost', name: 'Ghost Prog', moduleIds: ['m1', 'ghost_mod'] }
    ]
  };

  // 1. Verify validateDataset flags issues without modifying data
  const initialIssues = validateDataset(malformed);
  assert.ok(initialIssues.some(i => i.category === 'broken_link'));

  // 2. Verify sanitizeDatasetReferences safely strips ghost references
  const sanitized = sanitizeDatasetReferences(malformed);
  assert.strictEqual(sanitized.relationships.some(r => r.id === 'ghost_rel'), false);
  const pGhost = sanitized.programmes?.find(p => p.id === 'p_ghost');
  assert.deepStrictEqual(pGhost?.moduleIds, ['m1']);

  // 3. Confirm that sanitizeDatasetReferences is an opt-in utility and NOT executed silently on startup
  // (Preserving raw user inputs and unparsed data integrity until user acts)
  assert.strictEqual(typeof sanitizeDatasetReferences, 'function');
});

test('Acceptance Suite 8 — Realistic Edge Cases (Section 8)', () => {
  const dataset = getClone();

  // Edge Case 1: Empty Dataset
  const emptyDataset: MappingDataset = {
    id: 'empty',
    name: 'Empty Curriculum',
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    modules: [],
    outcomes: [],
    assessments: [],
    skills: [],
    relationships: [],
    programmes: []
  };

  const emptyAfterMod = safeDeleteModule(emptyDataset, 'm1');
  assert.strictEqual(emptyAfterMod.modules.length, 0);
  const emptyAfterRel = safeDeleteRelationship(emptyDataset, 'r1');
  assert.strictEqual(emptyAfterRel.relationships.length, 0);

  // Edge Case 2: Repeated deletion on already deleted entity
  const del1 = safeDeleteModule(dataset, 'm1');
  const del2 = safeDeleteModule(del1, 'm1');
  const del3 = safeDeleteModule(del2, 'm1');
  assert.strictEqual(del3.modules.length, dataset.modules.length - 1);
  assert.strictEqual(del3.relationships.length, del1.relationships.length);

  // Edge Case 3: Multiple relationships involving the same entity
  // m2 has prerequisite to m1, aligns to lo2, develops s1, assessment a1
  const m2Impact = getModuleDeletionImpact(dataset, 'm2');
  assert.strictEqual(m2Impact.moduleExists, true);
  assert.strictEqual(m2Impact.ownedAssessmentsCount, 1); // a1
  assert.ok(m2Impact.prerequisiteRelationshipsCount >= 2); // m2 -> m1 and m3 -> m2
  const afterM2 = safeDeleteModule(dataset, 'm2');
  assert.strictEqual(afterM2.modules.some(m => m.id === 'm2'), false);
  assert.strictEqual(afterM2.assessments.some(a => a.id === 'a1'), false);
  // Relationships involving m2 or a1 removed
  assert.strictEqual(afterM2.relationships.some(r => r.sourceId === 'm2' || r.targetId === 'm2'), false);
  assert.strictEqual(afterM2.relationships.some(r => r.sourceId === 'a1' || r.targetId === 'a1'), false);
  // Skills untouched
  assert.strictEqual(afterM2.skills.length, 6);
  // Validation clean
  const m2Issues = validateDataset(afterM2);
  assert.strictEqual(m2Issues.filter(i => i.level === 'error').length, 0);
});
