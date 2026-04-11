import type { MappingDataset } from '../../types';

export interface SkillCoverageData {
  moduleId: string;
  skillId: string;
  isCovered: boolean;
}

export const calculateSkillHeatmap = (dataset: MappingDataset): SkillCoverageData[] => {
  const { modules, skills, relationships } = dataset;
  
  // Get direct 'develops' relationships between modules and skills
  const directDevelops = relationships.filter(r => 
    r.type === 'develops' && 
    r.sourceType === 'module' && 
    r.targetType === 'skill'
  );

  const coverage: SkillCoverageData[] = [];

  modules.forEach(module => {
    skills.forEach(skill => {
      const isCovered = directDevelops.some(r => 
        r.sourceId === module.id && r.targetId === skill.id
      );
      coverage.push({
        moduleId: module.id,
        skillId: skill.id,
        isCovered
      });
    });
  });

  return coverage;
};

export interface AssessmentDensity {
  outcomeId: string;
  assessmentCount: number;
}

export const calculateOutcomeAssessmentDensity = (dataset: MappingDataset): AssessmentDensity[] => {
  const { outcomes, relationships } = dataset;
  
  const assessmentLinks = relationships.filter(r => 
    r.type === 'assesses' && r.targetType === 'outcome'
  );

  return outcomes.map(outcome => ({
    outcomeId: outcome.id,
    assessmentCount: assessmentLinks.filter(r => r.targetId === outcome.id).length
  }));
};

export const calculateAverageDensity = (dataset: MappingDataset): number => {
  const densities = calculateOutcomeAssessmentDensity(dataset);
  if (densities.length === 0) return 0;
  const total = densities.reduce((acc, d) => acc + d.assessmentCount, 0);
  return total / densities.length;
};
