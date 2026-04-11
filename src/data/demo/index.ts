import type { MappingDataset } from '../../types';

export const demoDataset: MappingDataset = {
  id: 'ph-demo-dataset-v1',
  name: 'Global Public Health & Epidemiology',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  modules: [
    { id: 'm1', code: 'PH101', title: 'Foundations of Public Health', credits: 15, level: '4' },
    { id: 'm2', code: 'PH102', title: 'Introduction to Epidemiology', credits: 15, level: '4' },
    { id: 'm3', code: 'PH201', title: 'Biostatistics for Health Research', credits: 15, level: '5' },
    { id: 'm4', code: 'PH202', title: 'Health Systems and Policy', credits: 15, level: '5' },
    { id: 'm5', code: 'PH301', title: 'Global Health Practice', credits: 15, level: '6' },
    { id: 'm6', code: 'PH103', title: 'Health Inequalities', credits: 15, level: '4' },
    { id: 'm7', code: 'PH203', title: 'Implementation Science', credits: 15, level: '5' },
    { id: 'm8', code: 'PH302', title: 'Programme Evaluation', credits: 15, level: '6' },
    { id: 'm9', code: 'PH303', title: 'Digital Health Innovation', credits: 15, level: '6' },
    { id: 'm10', code: 'PH-ORPH', title: 'Specialist Health Research', credits: 15, level: '6' } // Orphaned for testing
  ],
  outcomes: [
    { id: 'lo1', code: 'LO1.1', description: 'Evaluate primary prevention strategies.', moduleId: 'm1' },
    { id: 'lo2', code: 'LO2.1', description: 'Apply epidemiological reasoning.', moduleId: 'm2' },
    { id: 'lo3', code: 'LO3.1', description: 'Perform statistical analysis on health data.', moduleId: 'm3' },
    { id: 'lo4', code: 'LO4.1', description: 'Critique health policy frameworks.', moduleId: 'm4' },
    { id: 'lo5', code: 'LO5.1', description: 'Design cross-border health interventions.', moduleId: 'm5' },
    { id: 'lo6', code: 'LO6.1', description: 'Analyze social determinants of health.', moduleId: 'm6' },
    { id: 'lo7', code: 'LO1.2', description: 'Explain health transmission dynamics.', moduleId: 'm1' }
  ],
  assessments: [
    { id: 'a1', title: 'Epidemiology Report', type: 'Coursework', weight: 50, moduleId: 'm2' },
    { id: 'a2', title: 'Policy Brief', type: 'Coursework', weight: 40, moduleId: 'm4' },
    { id: 'a3', title: 'Biostatistics Practical', type: 'Practical', weight: 60, moduleId: 'm3' },
    { id: 'a4', title: 'Programme Evaluation Plan', type: 'Project', weight: 100, moduleId: 'm8' },
    { id: 'a5', title: 'Global Health Case Study', type: 'Presentation', weight: 100, moduleId: 'm5' }
  ],
  skills: [
    { id: 's1', name: 'Epidemiological reasoning', category: 'Technical' },
    { id: 's2', name: 'Statistical analysis', category: 'Technical' },
    { id: 's3', name: 'Policy analysis', category: 'Transferable' },
    { id: 's4', name: 'Programme implementation', category: 'Professional' },
    { id: 's5', name: 'Evaluation methods', category: 'Technical' },
    { id: 's6', name: 'Community engagement', category: 'Transferable' }
  ],
  relationships: [
    // Prerequisites
    { id: 'r1', sourceId: 'm2', sourceType: 'module', targetId: 'm1', targetType: 'module', type: 'prerequisite' },
    { id: 'r2', sourceId: 'm3', sourceType: 'module', targetId: 'm2', targetType: 'module', type: 'prerequisite' },
    { id: 'r3', sourceId: 'm8', sourceType: 'module', targetId: 'm7', targetType: 'module', type: 'prerequisite' },
    
    // Explicit Alignment: Module -> Outcome
    { id: 'e1', sourceId: 'm1', sourceType: 'module', targetId: 'lo1', targetType: 'outcome', type: 'aligns' },
    { id: 'e2', sourceId: 'm2', sourceType: 'module', targetId: 'lo2', targetType: 'outcome', type: 'aligns' },
    { id: 'e3', sourceId: 'm3', sourceType: 'module', targetId: 'lo3', targetType: 'outcome', type: 'aligns' },
    { id: 'e4', sourceId: 'm4', sourceType: 'module', targetId: 'lo4', targetType: 'outcome', type: 'aligns' },
    { id: 'e5', sourceId: 'm5', sourceType: 'module', targetId: 'lo5', targetType: 'outcome', type: 'aligns' },
    { id: 'e6', sourceId: 'm6', sourceType: 'module', targetId: 'lo6', targetType: 'outcome', type: 'aligns' },
    { id: 'e7', sourceId: 'm1', sourceType: 'module', targetId: 'lo7', targetType: 'outcome', type: 'aligns' },
    
    // Explicit Assessment: Assessment -> Outcome
    { id: 'ea1', sourceId: 'a1', sourceType: 'assessment', targetId: 'lo2', targetType: 'outcome', type: 'assesses' },
    { id: 'ea2', sourceId: 'a2', sourceType: 'assessment', targetId: 'lo4', targetType: 'outcome', type: 'assesses' },
    { id: 'ea3', sourceId: 'a3', sourceType: 'assessment', targetId: 'lo3', targetType: 'outcome', type: 'assesses' },
    
    // Explicit Skill Development: Module -> Skill
    { id: 'es1', sourceId: 'm2', sourceType: 'module', targetId: 's1', targetType: 'skill', type: 'develops' },
    { id: 'es2', sourceId: 'm3', sourceType: 'module', targetId: 's2', targetType: 'skill', type: 'develops' },
    { id: 'es3', sourceId: 'm4', sourceType: 'module', targetId: 's3', targetType: 'skill', type: 'develops' },
    { id: 'es4', sourceId: 'm7', sourceType: 'module', targetId: 's4', targetType: 'skill', type: 'develops' },
    { id: 'es5', sourceId: 'm8', sourceType: 'module', targetId: 's5', targetType: 'skill', type: 'develops' }
  ],
  programmes: [
    {
      id: 'p1',
      name: 'BSc Public Health',
      description: 'Core undergraduate programme in Public Health.',
      moduleIds: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9']
    },
    {
      id: 'p2',
      name: 'BSc Health Data Science',
      description: 'Specialized programme focused on biostatistics and epidemiology.',
      moduleIds: ['m2', 'm3', 'm9', 'm10']
    }
  ]
};
