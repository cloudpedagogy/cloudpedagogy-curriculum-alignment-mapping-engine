import test from 'node:test';
import assert from 'node:assert/strict';
import type { MappingDataset, Assessment, Relationship } from '../../../types';
import { demoDataset } from '../../../data/demo/index.ts';
import {
  validateDataset,
  isStructuralIssue,
  isEducationalObservation
} from '../../validation/validator.ts';
import { safeDeleteOutcome } from '../safeDeletion.ts';
import { calculateGraphMetrics } from '../../../features/relationships/graphUtils.ts';
import { calculateAverageDensity } from '../../analysis/coverage.ts';
import { detectDisconnectedPathways } from '../../analysis/progression.ts';

const getClone = (): MappingDataset => JSON.parse(JSON.stringify(demoDataset));

test('Educational Diagnostics 1 — Structural Errors vs Educational Observations Separation', () => {
  const dataset = getClone();
  const issues = validateDataset(dataset);

  // In demo data: 7 warnings total (all are educational observations: 2 unlinked modules, 4 unassessed outcomes, 1 undeveloped skill)
  const structural = issues.filter(isStructuralIssue);
  const educational = issues.filter(isEducationalObservation);

  assert.strictEqual(structural.length, 0, 'Clean dataset should have 0 structural errors/warnings');
  assert.strictEqual(educational.length, 7, 'All 7 warnings in demo data are educational design observations');

  educational.forEach(obs => {
    assert.strictEqual(obs.kind, 'educational_observation');
  });

  // Inject a genuine structural error: duplicate ID
  const duplicateDataset = getClone();
  duplicateDataset.modules.push({
    id: 'm1', // duplicate ID!
    code: 'DUP101',
    title: 'Duplicate Module',
    level: '4',
    description: 'Test'
  });
  const dupIssues = validateDataset(duplicateDataset);
  const dupStructural = dupIssues.filter(isStructuralIssue);
  assert.ok(dupStructural.some(i => i.category === 'duplicate_id' && i.kind === 'structural' && i.level === 'error'));

  // Inject a broken relationship link
  const brokenDataset = getClone();
  brokenDataset.relationships.push({
    id: 'broken_rel',
    sourceId: 'm1',
    targetId: 'non_existent_entity',
    sourceType: 'module',
    targetType: 'outcome',
    type: 'aligns'
  });
  const brokenIssues = validateDataset(brokenDataset);
  const brokenStructural = brokenIssues.filter(isStructuralIssue);
  assert.ok(brokenStructural.some(i => i.category === 'broken_link' && i.kind === 'structural'));
});

test('Educational Diagnostics 2 — Constructive and Defensible Educational Observation Wording', () => {
  const dataset = getClone();
  const issues = validateDataset(dataset);

  const unassessed = issues.filter(i => i.category === 'outcome_unassessed');
  assert.ok(unassessed.length > 0);
  unassessed.forEach(u => {
    // Must explain constructively without labeling as technical failure
    assert.ok(u.message.includes('has no mapped assessment tasks'));
    assert.strictEqual(u.kind, 'educational_observation');
  });

  const undeveloped = issues.filter(i => i.category === 'skill_undeveloped');
  assert.ok(undeveloped.length > 0);
  undeveloped.forEach(s => {
    assert.ok(s.message.includes('not currently mapped to a module for explicit development'));
    assert.strictEqual(s.kind, 'educational_observation');
  });

  const orphans = issues.filter(i => i.category === 'orphan');
  assert.ok(orphans.length > 0);
  orphans.forEach(o => {
    assert.ok(o.message.includes('no recorded relationships') || o.message.includes('no recorded module'));
    assert.strictEqual(o.kind, 'educational_observation');
  });

  // Verify progression reasons are qualified and defensible
  const pathways = detectDisconnectedPathways(dataset);
  pathways.forEach(p => {
    assert.ok(
      p.reason.includes('Review whether prior foundational knowledge is assumed') ||
      p.reason.includes('Typical for standalone electives')
    );
  });
});

test('Educational Diagnostics 3 — Analytical Metric Updates After Curriculum Edits', () => {
  const dataset = getClone();

  // 1. Initial density
  const initialDensity = calculateAverageDensity(dataset);
  assert.ok(initialDensity > 0);

  // 2. Add an assessment that assesses an unassessed outcome (lo1)
  const newAssessment: Assessment = {
    id: 'a_new_1',
    moduleId: 'm1',
    title: 'Introductory Public Health Quiz',
    type: 'quiz',
    weight: 20
  };
  const newRel: Relationship = {
    id: 'rel_new_assess',
    sourceId: 'a_new_1',
    targetId: 'lo1',
    sourceType: 'assessment',
    targetType: 'outcome',
    type: 'assesses'
  };

  dataset.assessments.push(newAssessment);
  dataset.relationships.push(newRel);

  // Re-validate: unassessed outcomes count should decrease from 4 to 3
  const issuesAfter = validateDataset(dataset);
  const unassessedAfter = issuesAfter.filter(i => i.category === 'outcome_unassessed');
  assert.strictEqual(unassessedAfter.length, 3, 'Unassessed outcomes count should decrease by 1');
  assert.ok(!unassessedAfter.some(i => i.entityId === 'lo1'), 'lo1 should no longer be flagged as unassessed');

  // Verify average density increases
  const updatedDensity = calculateAverageDensity(dataset);
  assert.ok(updatedDensity > initialDensity, 'Average density should increase after adding an assessment relationship');

  // 3. Link undeveloped skill (s6) to module m1
  const skillRel: Relationship = {
    id: 'rel_new_skill',
    sourceId: 'm1',
    targetId: 's6',
    sourceType: 'module',
    targetType: 'skill',
    type: 'develops'
  };
  dataset.relationships.push(skillRel);

  const issuesAfterSkill = validateDataset(dataset);
  const undevelopedAfter = issuesAfterSkill.filter(i => i.category === 'skill_undeveloped');
  assert.strictEqual(undevelopedAfter.length, 0, 'All skills should now be developed');
});

test('Educational Diagnostics 4 — Safe Deletion Preserves Referential Integrity and Cleans Endpoints', () => {
  const dataset = getClone();

  // Delete an outcome with dependencies
  const updatedDataset = safeDeleteOutcome(dataset, 'lo2');

  // Confirm outcome removed
  assert.ok(!updatedDataset.outcomes.some(o => o.id === 'lo2'));

  // Confirm no broken relationships exist
  const issues = validateDataset(updatedDataset);
  const structural = issues.filter(isStructuralIssue);
  assert.strictEqual(structural.length, 0, 'No broken relationships should remain after safe outcome deletion');

  // Confirm modules and assessments are preserved
  assert.strictEqual(updatedDataset.modules.length, dataset.modules.length);
  assert.strictEqual(updatedDataset.assessments.length, dataset.assessments.length);
});

test('Educational Diagnostics 5 — Graph Metric Calculations and Multi-cluster Topology', () => {
  const dataset = getClone();
  const metrics = calculateGraphMetrics(dataset);

  assert.strictEqual(metrics.totalRelationships, dataset.relationships.length);
  assert.ok(metrics.connectedComponents > 0);
  assert.strictEqual(metrics.orphanedEntities, metrics.isolatedEntityIds.length);
  assert.ok(metrics.isolatedEntityIds.includes('m9'));
  assert.ok(metrics.isolatedEntityIds.includes('m10'));

  const initialOrphanCount = metrics.orphanedEntities;

  // Link m9 to m1 (prerequisite)
  dataset.relationships.push({
    id: 'rel_m9_m1',
    sourceId: 'm9',
    targetId: 'm1',
    sourceType: 'module',
    targetType: 'module',
    type: 'prerequisite'
  });

  const updatedMetrics = calculateGraphMetrics(dataset);
  assert.strictEqual(updatedMetrics.orphanedEntities, initialOrphanCount - 1, 'Orphaned entities should decrease by 1');
  assert.ok(!updatedMetrics.isolatedEntityIds.includes('m9'));
});

test('Educational Diagnostics 6 — Import/Export JSON Roundtrip and Model Fidelity', () => {
  const dataset = getClone();
  const serialized = JSON.stringify(dataset);
  const parsed: MappingDataset = JSON.parse(serialized);

  assert.strictEqual(parsed.id, dataset.id);
  assert.strictEqual(parsed.modules.length, dataset.modules.length);
  assert.strictEqual(parsed.outcomes.length, dataset.outcomes.length);
  assert.strictEqual(parsed.assessments.length, dataset.assessments.length);
  assert.strictEqual(parsed.skills.length, dataset.skills.length);
  assert.strictEqual(parsed.relationships.length, dataset.relationships.length);

  // Both should produce identical diagnostics
  const originalIssues = validateDataset(dataset);
  const parsedIssues = validateDataset(parsed);
  assert.strictEqual(originalIssues.length, parsedIssues.length);
});
