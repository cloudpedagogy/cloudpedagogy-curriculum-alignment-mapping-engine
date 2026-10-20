import test from 'node:test';
import assert from 'node:assert/strict';
import type { MappingDataset } from '../../../types';
import { demoDataset } from '../../../data/demo/index.ts';
import {
  safeDeleteModule,
  safeDeleteAssessment,
  safeDeleteOutcome,
  safeDeleteRelationship,
  safeDeleteSkill,
  safeDeleteProgramme,
  getModuleDeletionImpact,
  getAssessmentDeletionImpact,
  getOutcomeDeletionImpact,
  sanitizeDatasetReferences
} from '../safeDeletion.ts';
import { validateDataset } from '../../validation/validator.ts';

// Helper to create a deep clone of the demo dataset
const getTestDataset = (): MappingDataset => JSON.parse(JSON.stringify(demoDataset));

test('Batch 1 Safe Deletion - 1. Deleting an unreferenced entity', () => {
  const dataset = getTestDataset();
  // m10 is an orphaned module in demo data with no alignments, assessments, or prereqs
  const unrefModule = dataset.modules.find(m => m.id === 'm10');
  assert.ok(unrefModule, 'm10 must exist initially');

  const impact = getModuleDeletionImpact(dataset, 'm10');
  // m10 is in p2 programme, but has 0 assessments, 0 outcomes, 0 prereqs
  assert.strictEqual(impact.moduleExists, true);
  assert.strictEqual(impact.ownedAssessmentsCount, 0);
  assert.strictEqual(impact.ownedOutcomesCount, 0);

  const updated = safeDeleteModule(dataset, 'm10');
  assert.strictEqual(updated.modules.some(m => m.id === 'm10'), false);
  // Confirmed unlinked from programme p2
  const p2 = updated.programmes?.find(p => p.id === 'p2');
  assert.strictEqual(p2?.moduleIds.includes('m10'), false);

  // Validate integrity
  const issues = validateDataset(updated);
  const fatalErrors = issues.filter(i => i.level === 'error');
  assert.strictEqual(fatalErrors.length, 0, 'No validation errors after deleting unreferenced entity');
});

test('Batch 1 Safe Deletion - 2. Deleting an entity referenced by another entity (Prerequisites and Programmes)', () => {
  const dataset = getTestDataset();
  // m1 (Foundations of Public Health) is referenced by:
  // - Prerequisite: m2 -> m1
  // - Programme: p1 (moduleIds includes m1)
  // - Outcomes: lo1, lo7
  assert.ok(dataset.modules.some(m => m.id === 'm1'));
  assert.ok(dataset.relationships.some(r => r.type === 'prerequisite' && r.targetId === 'm1'));

  const impact = getModuleDeletionImpact(dataset, 'm1');
  assert.strictEqual(impact.hasDependencies, true);
  assert.strictEqual(impact.prerequisiteRelationshipsCount, 1);
  assert.strictEqual(impact.affectedProgrammesCount, 1);

  const updated = safeDeleteModule(dataset, 'm1');

  // Module m1 is removed
  assert.strictEqual(updated.modules.some(m => m.id === 'm1'), false);

  // Dependent module m2 MUST remain intact
  assert.ok(updated.modules.some(m => m.id === 'm2'));

  // Prerequisite relationship between m2 and m1 is unlinked (deleted)
  assert.strictEqual(
    updated.relationships.some(r => r.sourceId === 'm1' || r.targetId === 'm1'),
    false,
    'All relationships directly pointing to m1 must be removed'
  );

  // Programme p1 moduleIds must be cleanly unlinked (m1 removed)
  const p1 = updated.programmes?.find(p => p.id === 'p1');
  assert.strictEqual(p1?.moduleIds.includes('m1'), false);
  // Other modules in p1 remain
  assert.ok(p1?.moduleIds.includes('m2'));

  // No dangling references in dataset
  const issues = validateDataset(updated);
  const brokenLinks = issues.filter(i => i.category === 'broken_link' || i.category === 'missing_ref');
  assert.strictEqual(brokenLinks.length, 0, 'No broken links or missing references after deleting m1');
});

test('Batch 1 Safe Deletion - 3. Shared learning outcomes are preserved when a parent module is deleted', () => {
  const dataset = getTestDataset();
  // Set up a shared outcome: lo1 is initially on m1, but let's also align it to m2
  dataset.relationships.push({
    id: 'test-shared-rel-1',
    sourceId: 'm2',
    sourceType: 'module',
    targetId: 'lo1',
    targetType: 'outcome',
    type: 'aligns'
  });

  const impact = getModuleDeletionImpact(dataset, 'm1');
  assert.strictEqual(impact.sharedOutcomesCount >= 1, true, 'lo1 should be detected as shared');

  const updated = safeDeleteModule(dataset, 'm1', { preserveSharedOutcomes: true });

  // Module m1 is deleted
  assert.strictEqual(updated.modules.some(m => m.id === 'm1'), false);

  // Shared outcome lo1 MUST be preserved!
  const lo1 = updated.outcomes.find(o => o.id === 'lo1');
  assert.ok(lo1, 'Shared outcome lo1 must NOT be deleted');
  // Re-parented or unlinked safely to m2
  assert.strictEqual(lo1?.moduleId, 'm2', 'Shared outcome lo1 should be re-parented to aligned module m2');

  // The alignment between m2 and lo1 must still exist
  const remainingRel = updated.relationships.find(r => r.sourceId === 'm2' && r.targetId === 'lo1');
  assert.ok(remainingRel, 'Alignment between remaining module m2 and shared outcome lo1 must persist');

  // Non-shared outcome lo7 was exclusively owned by m1, so it should be safely removed
  assert.strictEqual(updated.outcomes.some(o => o.id === 'lo7'), false, 'Exclusively owned lo7 should be cleaned up');

  // Integrity validation passes
  const issues = validateDataset(updated);
  const missingRefIssues = issues.filter(i => i.category === 'missing_ref');
  assert.strictEqual(missingRefIssues.length, 0, 'No missing_ref warnings on preserved outcome');
});

test('Batch 1 Safe Deletion - 4. Removal of an alignment without deleting its linked entities', () => {
  const dataset = getTestDataset();
  // In demo dataset: ea1 connects assessment a1 to outcome lo2 (type: 'assesses')
  const rel = dataset.relationships.find(r => r.id === 'ea1');
  assert.ok(rel, 'Relationship ea1 must exist');
  assert.ok(dataset.assessments.some(a => a.id === 'a1'));
  assert.ok(dataset.outcomes.some(o => o.id === 'lo2'));

  const updated = safeDeleteRelationship(dataset, 'ea1');

  // Relationship ea1 is removed
  assert.strictEqual(updated.relationships.some(r => r.id === 'ea1'), false);

  // Crucially: Linked entities a1 and lo2 MUST REMAIN intact
  assert.ok(updated.assessments.some(a => a.id === 'a1'), 'Assessment a1 must not be deleted');
  assert.ok(updated.outcomes.some(o => o.id === 'lo2'), 'Learning outcome lo2 must not be deleted');
  assert.strictEqual(updated.modules.length, dataset.modules.length, 'Modules count unchanged');
  assert.strictEqual(updated.skills.length, dataset.skills.length, 'Skills count unchanged');
});

test('Batch 1 Safe Deletion - 5. Repeated deletion attempts are safe and idempotent', () => {
  const dataset = getTestDataset();

  // Deleting a non-existent module
  const step1 = safeDeleteModule(dataset, 'non-existent-module-xyz');
  assert.deepStrictEqual(step1.modules, dataset.modules, 'Dataset unchanged for non-existent module');

  // Deleting m1 once
  const step2 = safeDeleteModule(dataset, 'm1');
  const countAfterStep2 = step2.modules.length;
  assert.strictEqual(countAfterStep2, dataset.modules.length - 1);

  // Deleting m1 a second time
  const step3 = safeDeleteModule(step2, 'm1');
  assert.strictEqual(step3.modules.length, countAfterStep2, 'Repeated deletion leaves count identical');
  assert.strictEqual(step3.relationships.length, step2.relationships.length, 'Repeated deletion leaves relationships identical');

  // Repeated deletion on assessment
  const step4 = safeDeleteAssessment(step3, 'non-existent-assessment');
  assert.strictEqual(step4.assessments.length, step3.assessments.length);

  // Repeated deletion on relationship
  const step5 = safeDeleteRelationship(step4, 'non-existent-rel');
  assert.strictEqual(step5.relationships.length, step4.relationships.length);
});

test('Batch 1 Safe Deletion - 6. Missing or stale references in existing data are sanitized safely', () => {
  const dataset = getTestDataset();

  // Inject stale references into dataset
  const corruptedDataset: MappingDataset = {
    ...dataset,
    relationships: [
      ...dataset.relationships,
      // Broken relationship pointing to deleted source and non-existent target
      {
        id: 'stale-r1',
        sourceId: 'deleted-mod-99',
        sourceType: 'module',
        targetId: 'deleted-out-88',
        targetType: 'outcome',
        type: 'aligns'
      }
    ],
    programmes: [
      {
        id: 'p-corrupted',
        name: 'Corrupted Programme',
        moduleIds: ['m1', 'deleted-module-xyz', 'm2']
      }
    ],
    outcomes: [
      ...dataset.outcomes,
      {
        id: 'orphan-outcome-with-bad-mod',
        code: 'LO-BAD',
        description: 'Test bad ref',
        moduleId: 'deleted-mod-99'
      }
    ]
  };

  const sanitized = sanitizeDatasetReferences(corruptedDataset);

  // Broken relationship removed
  assert.strictEqual(sanitized.relationships.some(r => r.id === 'stale-r1'), false);

  // Stale module in programme removed
  const pCorrupted = sanitized.programmes?.find(p => p.id === 'p-corrupted');
  assert.deepStrictEqual(pCorrupted?.moduleIds, ['m1', 'm2']);

  // Stale moduleId on outcome unlinked
  const badOutcome = sanitized.outcomes.find(o => o.id === 'orphan-outcome-with-bad-mod');
  assert.ok(badOutcome);
  assert.strictEqual(badOutcome?.moduleId, undefined);

  // Validation passes without crashes
  const issues = validateDataset(sanitized);
  const brokenLinks = issues.filter(i => i.category === 'broken_link');
  assert.strictEqual(brokenLinks.length, 0);
});

test('Batch 1 Safe Deletion - 7. Persistence and reload after deletion', () => {
  const dataset = getTestDataset();

  // Delete module m2 (has prerequisite, alignment, assessment a1, skill link)
  const afterDelete = safeDeleteModule(dataset, 'm2');

  // Simulate JSON serialization / deserialization as in localStorage
  const serialized = JSON.stringify(afterDelete);
  const reloaded: MappingDataset = JSON.parse(serialized);

  // Verify reloaded dataset integrity
  assert.strictEqual(reloaded.modules.some(m => m.id === 'm2'), false);
  assert.strictEqual(reloaded.assessments.some(a => a.moduleId === 'm2'), false);
  assert.strictEqual(reloaded.relationships.some(r => r.sourceId === 'm2' || r.targetId === 'm2'), false);

  const validation = validateDataset(reloaded);
  const errors = validation.filter(v => v.level === 'error');
  assert.strictEqual(errors.length, 0, 'No schema/relational errors after JSON reload');
});

test('Batch 1 Safe Deletion - 8. Assessment deletion preserves outcomes and unlinks mappings', () => {
  const dataset = getTestDataset();
  // a1 assesses lo2
  const outcomeBefore = dataset.outcomes.find(o => o.id === 'lo2');
  assert.ok(outcomeBefore);

  const impact = getAssessmentDeletionImpact(dataset, 'a1');
  assert.strictEqual(impact.assessmentExists, true);
  assert.strictEqual(impact.mappedOutcomesCount, 1);

  const updated = safeDeleteAssessment(dataset, 'a1');

  // a1 is deleted
  assert.strictEqual(updated.assessments.some(a => a.id === 'a1'), false);

  // Relationship ea1 (a1 -> lo2) is removed
  assert.strictEqual(updated.relationships.some(r => r.id === 'ea1'), false);

  // Outcome lo2 is STILL PRESENT
  assert.ok(updated.outcomes.some(o => o.id === 'lo2'), 'Outcome lo2 must be preserved');
  // Module m2 is STILL PRESENT
  assert.ok(updated.modules.some(m => m.id === 'm2'), 'Module m2 must be preserved');
});

test('Batch 1 Safe Deletion - 9. Outcome deletion preserves modules and assessments', () => {
  const dataset = getTestDataset();
  // lo2 is aligned to m2 and assessed by a1
  const impact = getOutcomeDeletionImpact(dataset, 'lo2');
  assert.strictEqual(impact.hasDependencies, true);
  assert.strictEqual(impact.alignedModulesCount, 1);
  assert.strictEqual(impact.assessingAssessmentsCount, 1);

  const updated = safeDeleteOutcome(dataset, 'lo2');

  // lo2 is removed
  assert.strictEqual(updated.outcomes.some(o => o.id === 'lo2'), false);

  // Relationship e2 (m2 -> lo2) and ea1 (a1 -> lo2) are removed
  assert.strictEqual(updated.relationships.some(r => r.targetId === 'lo2'), false);

  // Module m2 and Assessment a1 are STILL PRESENT
  assert.ok(updated.modules.some(m => m.id === 'm2'), 'Module m2 must be preserved');
  assert.ok(updated.assessments.some(a => a.id === 'a1'), 'Assessment a1 must be preserved');
});

test('Batch 1 Safe Deletion - 10. Skill deletion unlinks develops edges without deleting modules', () => {
  const dataset = getTestDataset();
  const updated = safeDeleteSkill(dataset, 's1');

  assert.strictEqual(updated.skills.some(s => s.id === 's1'), false);
  assert.strictEqual(updated.relationships.some(r => r.targetId === 's1'), false);
  assert.strictEqual(updated.modules.length, dataset.modules.length, 'All modules remain');
});

test('Batch 1 Safe Deletion - 11. Programme deletion leaves all modules and mappings intact', () => {
  const dataset = getTestDataset();
  const updated = safeDeleteProgramme(dataset, 'p1');

  assert.strictEqual(updated.programmes?.some(p => p.id === 'p1'), false);
  assert.strictEqual(updated.modules.length, dataset.modules.length, 'All modules remain');
  assert.strictEqual(updated.relationships.length, dataset.relationships.length, 'All relationships remain');
});
