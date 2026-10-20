import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { MappingDataset, Module, Programme, LearningOutcome, Assessment, Skill } from '../../../types';
import { generateEntityId } from '../idGenerator.ts';
import { demoDataset } from '../../../data/demo/index.ts';
import {
  safeDeleteModule,
  safeDeleteOutcome,
  safeDeleteAssessment,
  safeDeleteSkill,
  safeDeleteProgramme,
  getSkillDeletionImpact,
  getProgrammeDeletionImpact
} from '../safeDeletion.ts';

// Helper to construct a clean blank test dataset
const createBlankTestDataset = (): MappingDataset => ({
  id: 'test_dataset',
  name: 'Test Curriculum Dataset',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  programmes: [],
  modules: [],
  outcomes: [],
  assessments: [],
  skills: [],
  relationships: []
});

test('Phase 2A - 1. Stable and Collision-Free Identifier Generation', () => {
  const existing = new Set(['m_1', 'm_2']);
  const id1 = generateEntityId('m', existing);
  const id2 = generateEntityId('m', existing);

  assert.ok(id1.startsWith('m_'));
  assert.ok(id2.startsWith('m_'));
  assert.notStrictEqual(id1, id2);
  assert.ok(!existing.has(id1));
  assert.ok(!existing.has(id2));

  const progId = generateEntityId('prog');
  assert.ok(progId.startsWith('prog_'));

  const loId = generateEntityId('lo');
  assert.ok(loId.startsWith('lo_'));

  const asmtId = generateEntityId('a');
  assert.ok(asmtId.startsWith('a_'));

  const skillId = generateEntityId('s');
  assert.ok(skillId.startsWith('s_'));
});

test('Phase 2A - 2. Programme Creation, Module Association, and Membership Management', () => {
  let dataset = createBlankTestDataset();

  // Create two modules
  const mod1: Module = { id: 'm_test_1', code: 'CS101', title: 'Intro CS', level: '4', credits: 15 };
  const mod2: Module = { id: 'm_test_2', code: 'CS102', title: 'Data Structures', level: '4', credits: 15 };
  dataset.modules.push(mod1, mod2);

  // 1. Create a programme
  const prog: Programme = {
    id: 'prog_cs',
    name: 'BSc Computer Science',
    description: 'Undergraduate computing programme',
    moduleIds: ['m_test_1']
  };
  dataset.programmes = [prog];

  assert.strictEqual(dataset.programmes.length, 1);
  assert.strictEqual(dataset.programmes[0].moduleIds.length, 1);
  assert.ok(dataset.programmes[0].moduleIds.includes('m_test_1'));

  // 2. Associate second module
  dataset.programmes[0].moduleIds.push('m_test_2');
  assert.strictEqual(dataset.programmes[0].moduleIds.length, 2);

  // 3. Remove module membership without deleting the module
  dataset.programmes[0].moduleIds = dataset.programmes[0].moduleIds.filter(id => id !== 'm_test_1');
  assert.strictEqual(dataset.programmes[0].moduleIds.length, 1);
  assert.strictEqual(dataset.modules.length, 2, 'Module m_test_1 must still exist in dataset');

  // 4. Safe delete programme
  const impact = getProgrammeDeletionImpact(dataset, 'prog_cs');
  assert.strictEqual(impact.programmeExists, true);
  assert.strictEqual(impact.associatedModulesCount, 1);
  assert.strictEqual(impact.hasDependencies, true);

  dataset = safeDeleteProgramme(dataset, 'prog_cs');
  assert.strictEqual((dataset.programmes || []).length, 0);
  assert.strictEqual(dataset.modules.length, 2, 'Modules must remain intact after programme deletion');
});

test('Phase 2A - 3. Module Creation, Editing with Stable IDs, and Multi-Programme Sharing', () => {
  let dataset = createBlankTestDataset();

  // Define two programmes
  dataset.programmes = [
    { id: 'prog_a', name: 'Programme A', moduleIds: [] },
    { id: 'prog_b', name: 'Programme B', moduleIds: [] }
  ];

  // 1. Create module
  const modId = generateEntityId('m');
  const newMod: Module = {
    id: modId,
    code: 'MATH101',
    title: 'Linear Algebra',
    level: '4',
    credits: 20
  };
  dataset.modules.push(newMod);

  // Share module across both programmes
  dataset.programmes[0].moduleIds.push(modId);
  dataset.programmes[1].moduleIds.push(modId);

  assert.strictEqual(dataset.modules.length, 1);
  assert.strictEqual(dataset.programmes[0].moduleIds.includes(modId), true);
  assert.strictEqual(dataset.programmes[1].moduleIds.includes(modId), true);

  // 2. Edit module (preserve ID while updating code/title)
  const updatedMod: Module = {
    ...newMod,
    code: 'MATH101-H',
    title: 'Honours Linear Algebra'
  };
  dataset.modules = dataset.modules.map(m => m.id === modId ? updatedMod : m);

  assert.strictEqual(dataset.modules[0].id, modId, 'ID must remain stable');
  assert.strictEqual(dataset.modules[0].code, 'MATH101-H');
  assert.strictEqual(dataset.modules[0].title, 'Honours Linear Algebra');

  // 3. Safe delete module
  dataset = safeDeleteModule(dataset, modId);
  assert.strictEqual(dataset.modules.length, 0);
  assert.strictEqual(dataset.programmes[0].moduleIds.includes(modId), false);
  assert.strictEqual(dataset.programmes[1].moduleIds.includes(modId), false);
});

test('Phase 2A - 4. Learning Outcome Authoring, Reparenting, and Preserving Alignments', () => {
  let dataset = createBlankTestDataset();

  const modA: Module = { id: 'm_a', code: 'MOD-A', title: 'Module A', level: '4', credits: 15 };
  const modB: Module = { id: 'm_b', code: 'MOD-B', title: 'Module B', level: '4', credits: 15 };
  dataset.modules.push(modA, modB);

  // 1. Create outcome under Module A
  const loId = generateEntityId('lo');
  const outcome: LearningOutcome = {
    id: loId,
    code: 'LO1',
    description: 'Understand core computational principles',
    moduleId: 'm_a'
  };
  dataset.outcomes.push(outcome);

  // Explicit alignment from Module B (shared outcome)
  dataset.relationships.push({
    id: 'rel_align_b',
    sourceId: 'm_b',
    sourceType: 'module',
    targetId: loId,
    targetType: 'outcome',
    type: 'aligns'
  });

  assert.strictEqual(dataset.outcomes.length, 1);
  assert.strictEqual(dataset.outcomes[0].moduleId, 'm_a');

  // 2. Edit outcome description while preserving ID
  dataset.outcomes = dataset.outcomes.map(o =>
    o.id === loId ? { ...o, description: 'Understand advanced computational principles' } : o
  );
  assert.strictEqual(dataset.outcomes[0].id, loId);
  assert.strictEqual(dataset.outcomes[0].description, 'Understand advanced computational principles');

  // 3. Deleting Module A preserves shared outcome because Module B aligns to it
  dataset = safeDeleteModule(dataset, 'm_a', { preserveSharedOutcomes: true });
  assert.strictEqual(dataset.modules.length, 1);
  assert.strictEqual(dataset.outcomes.length, 1, 'Shared outcome must be preserved');
  assert.strictEqual(dataset.outcomes[0].moduleId, 'm_b', 'Outcome should reparent to Module B');

  // 4. Safe delete outcome directly
  dataset = safeDeleteOutcome(dataset, loId);
  assert.strictEqual(dataset.outcomes.length, 0);
  assert.strictEqual(dataset.relationships.length, 0, 'Relationship edges must be unlinked');
});

test('Phase 2A - 5. Assessment Authoring, Weighting Validation, and Outcome Unlinking', () => {
  let dataset = createBlankTestDataset();

  const mod: Module = { id: 'm_1', code: 'MOD1', title: 'Test Mod', level: '5', credits: 15 };
  const lo: LearningOutcome = { id: 'lo_1', code: 'LO1', description: 'Test LO', moduleId: 'm_1' };
  dataset.modules.push(mod);
  dataset.outcomes.push(lo);

  // 1. Create assessment
  const asmtId = generateEntityId('a');
  const asmt: Assessment = {
    id: asmtId,
    title: 'Midterm Exam',
    type: 'Written Examination',
    weight: 40,
    moduleId: 'm_1'
  };
  dataset.assessments.push(asmt);

  // Map assessment to outcome
  dataset.relationships.push({
    id: 'rel_assesses_1',
    sourceId: asmtId,
    sourceType: 'assessment',
    targetId: 'lo_1',
    targetType: 'outcome',
    type: 'assesses'
  });

  assert.strictEqual(dataset.assessments.length, 1);
  assert.strictEqual(dataset.relationships.length, 1);

  // 2. Edit assessment
  dataset.assessments = dataset.assessments.map(a =>
    a.id === asmtId ? { ...a, weight: 50, title: 'Comprehensive Exam' } : a
  );
  assert.strictEqual(dataset.assessments[0].weight, 50);
  assert.strictEqual(dataset.assessments[0].title, 'Comprehensive Exam');
  assert.strictEqual(dataset.assessments[0].id, asmtId);

  // 3. Safe delete assessment
  dataset = safeDeleteAssessment(dataset, asmtId);
  assert.strictEqual(dataset.assessments.length, 0);
  assert.strictEqual(dataset.outcomes.length, 1, 'Learning outcome must be preserved');
  assert.strictEqual(dataset.relationships.length, 0, 'Mapping relationship must be cleanly unlinked');
});

test('Phase 2A - 6. Skill Authoring, Classification, and Impact Diagnostics', () => {
  let dataset = createBlankTestDataset();

  const mod: Module = { id: 'm_1', code: 'MOD1', title: 'Module 1', level: '6', credits: 30 };
  dataset.modules.push(mod);

  // 1. Create skill
  const skillId = generateEntityId('s');
  const skill: Skill = {
    id: skillId,
    name: 'Statistical Modelling',
    category: 'Technical',
    description: 'Formulate Bayesian regression models'
  };
  dataset.skills.push(skill);

  // Map module develops skill
  dataset.relationships.push({
    id: 'rel_dev_1',
    sourceId: 'm_1',
    sourceType: 'module',
    targetId: skillId,
    targetType: 'skill',
    type: 'develops'
  });

  assert.strictEqual(dataset.skills.length, 1);
  assert.strictEqual(dataset.relationships.length, 1);

  // 2. Test impact analysis
  const impact = getSkillDeletionImpact(dataset, skillId);
  assert.strictEqual(impact.skillExists, true);
  assert.strictEqual(impact.hasDependencies, true);
  assert.strictEqual(impact.developsRelationshipsCount, 1);

  // 3. Edit skill
  dataset.skills = dataset.skills.map(s =>
    s.id === skillId ? { ...s, name: 'Bayesian Statistical Modelling' } : s
  );
  assert.strictEqual(dataset.skills[0].id, skillId);
  assert.strictEqual(dataset.skills[0].name, 'Bayesian Statistical Modelling');

  // 4. Safe delete skill
  dataset = safeDeleteSkill(dataset, skillId);
  assert.strictEqual(dataset.skills.length, 0);
  assert.strictEqual(dataset.modules.length, 1, 'Module must remain intact');
  assert.strictEqual(dataset.relationships.length, 0, 'Develops edge must be unlinked');
});

test('Phase 2A - 7. Overview Metric Counts Consistency across Multi-Entity Authoring', () => {
  let dataset = createBlankTestDataset();

  // Verify starting empty
  assert.strictEqual(dataset.programmes?.length || 0, 0);
  assert.strictEqual(dataset.modules.length, 0);
  assert.strictEqual(dataset.outcomes.length, 0);
  assert.strictEqual(dataset.assessments.length, 0);
  assert.strictEqual(dataset.skills.length, 0);

  // Add 1 programme, 2 modules, 3 outcomes, 2 assessments, 4 skills
  dataset.programmes = [{ id: 'p1', name: 'Prog', moduleIds: ['m1', 'm2'] }];
  dataset.modules.push(
    { id: 'm1', code: 'M1', title: 'Mod 1', level: '4', credits: 15 },
    { id: 'm2', code: 'M2', title: 'Mod 2', level: '4', credits: 15 }
  );
  dataset.outcomes.push(
    { id: 'lo1', code: 'LO1', description: 'D1', moduleId: 'm1' },
    { id: 'lo2', code: 'LO2', description: 'D2', moduleId: 'm1' },
    { id: 'lo3', code: 'LO3', description: 'D3', moduleId: 'm2' }
  );
  dataset.assessments.push(
    { id: 'a1', title: 'A1', type: 'Coursework', weight: 50, moduleId: 'm1' },
    { id: 'a2', title: 'A2', type: 'Exam', weight: 50, moduleId: 'm2' }
  );
  dataset.skills.push(
    { id: 's1', name: 'S1', category: 'Technical' },
    { id: 's2', name: 'S2', category: 'Cognitive' },
    { id: 's3', name: 'S3', category: 'Practical' },
    { id: 's4', name: 'S4', category: 'Transferable' }
  );

  assert.strictEqual(dataset.programmes.length, 1);
  assert.strictEqual(dataset.modules.length, 2);
  assert.strictEqual(dataset.outcomes.length, 3);
  assert.strictEqual(dataset.assessments.length, 2);
  assert.strictEqual(dataset.skills.length, 4);

  // Delete 1 outcome
  dataset = safeDeleteOutcome(dataset, 'lo1');
  assert.strictEqual(dataset.outcomes.length, 2);

  // Delete 1 assessment
  dataset = safeDeleteAssessment(dataset, 'a1');
  assert.strictEqual(dataset.assessments.length, 1);

  // Delete 1 module
  dataset = safeDeleteModule(dataset, 'm1');
  assert.strictEqual(dataset.modules.length, 1);
});

test('Phase 2A - 8. Skill Category Preservation, Non-Normalization, and Export Fidelity', () => {
  // 1. Verify demonstration dataset category fidelity
  const demoSkill4 = demoDataset.skills.find((s: Skill) => s.id === 's4');
  assert.ok(demoSkill4, 'Skill s4 must exist in demo data');
  assert.strictEqual(demoSkill4.category, 'Professional', 's4 must retain exact "Professional" category');

  // 2. Clone dataset and simulate editing without changing category
  const dataset: MappingDataset = JSON.parse(JSON.stringify(demoDataset));
  const s4 = dataset.skills.find(s => s.id === 's4')!;
  s4.description = 'Advanced programme implementation in public health systems';

  // Category must not have been normalized to lowercase or changed to another taxonomy
  assert.strictEqual(s4.category, 'Professional');

  // 3. Test uppercase custom category (e.g. 'PROFESSIONAL' or 'CLINICAL')
  const uppercaseSkill: Skill = {
    id: 's_custom_upper',
    name: 'Clinical Audit Leadership',
    category: 'PROFESSIONAL'
  };
  dataset.skills.push(uppercaseSkill);

  // 4. Test domain-specific custom category
  const domainSkill: Skill = {
    id: 's_custom_domain',
    name: 'Epidemiological Field Surveillance',
    category: 'Field Epidemiology'
  };
  dataset.skills.push(domainSkill);

  // 5. Simulate export and JSON round-trip
  const exportedJson = JSON.stringify(dataset, null, 2);
  const reimportedDataset: MappingDataset = JSON.parse(exportedJson);

  const reimportedS4 = reimportedDataset.skills.find(s => s.id === 's4');
  assert.strictEqual(reimportedS4?.category, 'Professional');

  const reimportedUpper = reimportedDataset.skills.find(s => s.id === 's_custom_upper');
  assert.strictEqual(reimportedUpper?.category, 'PROFESSIONAL', 'Exact uppercase casing must be preserved');

  const reimportedDomain = reimportedDataset.skills.find(s => s.id === 's_custom_domain');
  assert.strictEqual(reimportedDomain?.category, 'Field Epidemiology', 'Custom classification must be preserved');
});

test('Phase 2A - 9. First-Use Blank Initialization vs Demonstration Dataset Separation', () => {
  // Scenario B: Blank dataset must have 0 entities across all collections
  const blank = createBlankTestDataset();
  assert.strictEqual(blank.programmes?.length || 0, 0);
  assert.strictEqual(blank.modules.length, 0);
  assert.strictEqual(blank.outcomes.length, 0);
  assert.strictEqual(blank.assessments.length, 0);
  assert.strictEqual(blank.skills.length, 0);
  assert.strictEqual(blank.relationships.length, 0);

  // Scenario D: Demonstration dataset must be complete and unaltered
  assert.strictEqual(demoDataset.id, 'ph-demo-dataset-v1');
  assert.strictEqual(demoDataset.modules.length, 10);
  assert.strictEqual(demoDataset.outcomes.length, 7);
  assert.strictEqual(demoDataset.assessments.length, 5);
  assert.strictEqual(demoDataset.skills.length, 6);
  assert.strictEqual(demoDataset.relationships.length, 18);
  assert.strictEqual(demoDataset.programmes?.length, 2);

  // Verify categories present in demo dataset
  const demoCategories = new Set(demoDataset.skills.map((s: Skill) => s.category));
  assert.ok(demoCategories.has('Technical'));
  assert.ok(demoCategories.has('Transferable'));
  assert.ok(demoCategories.has('Professional'));
});
