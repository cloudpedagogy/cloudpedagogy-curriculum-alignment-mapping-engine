export type EntityType = 'module' | 'outcome' | 'assessment' | 'skill';
export type RelationshipType = 'aligns' | 'assesses' | 'develops' | 'prerequisite';

export interface Programme {
  id: string;
  name: string;
  description?: string;
  moduleIds: string[];
}

export interface Module {
  id: string;
  code: string;
  title: string;
  description?: string;
  credits: number;
  level: string;
}

export interface LearningOutcome {
  id: string;
  code: string;
  description: string;
  moduleId: string;
}

export interface Assessment {
  id: string;
  title: string;
  type: string;
  weight: number;
  moduleId: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  type: 'aligns' | 'assesses' | 'develops' | 'prerequisite';
  metadata?: Record<string, any>;
}

export interface MappingDataset {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  modules: Module[];
  outcomes: LearningOutcome[];
  assessments: Assessment[];
  skills: Skill[];
  relationships: Relationship[];
  programmes?: Programme[];
}
