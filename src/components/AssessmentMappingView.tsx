import React from 'react';
import type { MappingDataset } from '../types';

interface AssessmentMappingViewProps {
  dataset: MappingDataset;
  onRemoveAssessment?: (id: string) => void;
}

const AssessmentMappingView: React.FC<AssessmentMappingViewProps> = ({ dataset, onRemoveAssessment }) => {
  const { modules, assessments, outcomes, relationships } = dataset;

  const getModuleAssessments = (moduleId: string) => {
    // Both explicit 'aligns' from module to assessment, and implicit moduleId on assessment
    const explicitIds = relationships
      .filter(r => r.sourceId === moduleId && r.targetType === 'assessment' && r.type === 'aligns')
      .map(r => r.targetId);
    
    const implicit = assessments.filter(a => a.moduleId === moduleId);
    
    // Union of both sets to ensure full visibility
    const combined = [...implicit];
    explicitIds.forEach(id => {
      if (!combined.find(c => c.id === id)) {
        const found = assessments.find(a => a.id === id);
        if (found) combined.push(found);
      }
    });

    return combined;
  };

  const getAssessedOutcomes = (assessmentId: string) => {
    return relationships
      .filter(r => r.sourceId === assessmentId && r.targetType === 'outcome' && r.type === 'assesses')
      .map(r => outcomes.find(o => o.id === r.targetId))
      .filter(Boolean);
  };

  const isAssessmentDense = (moduleId: string, assessCount: number) => {
    const outcomeCount = outcomes.filter(o => o.moduleId === moduleId).length;
    return assessCount > outcomeCount && assessCount > 2;
  };

  return (
    <div className="assessment-view-container">
      <div className="panel-header mb-6">
        <h2>Assessment Structural Mapping</h2>
        <p className="text-secondary">Validation of curriculum outcomes through formal assessment anchors.</p>
      </div>

      <div className="assessment-grid">
        {modules.map(module => {
          const moduleAssessments = getModuleAssessments(module.id);
          const isDense = isAssessmentDense(module.id, moduleAssessments.length);
          
          return (
            <div key={module.id} className="module-assessment-group mb-8">
              <div className="module-tier-header mb-4">
                <div className="tier-info">
                  <span className="tier-label">Module</span>
                  <h3 className="tier-title">{module.code}: {module.title}</h3>
                </div>
                {isDense && (
                  <div className="tag tag-warning">
                    High Assessment Density ({moduleAssessments.length})
                  </div>
                )}
              </div>

              <div className="assessment-list pl-6">
                {moduleAssessments.length > 0 ? (
                  moduleAssessments.map(assessment => {
                    const assessedOutcomes = getAssessedOutcomes(assessment.id);
                    
                    return (
                      <div key={assessment.id} className="assessment-card mb-4">
                        <div className="assessment-card-header mb-2">
                          <div className="assessment-identity">
                            <span className="assessment-type">{assessment.type}</span>
                            <div className="flex gap-2 items-center">
                              <h4 className="assessment-title">{assessment.title}</h4>
                              {onRemoveAssessment && (
                                <button className="remove-btn" onClick={() => onRemoveAssessment(assessment.id)}>✕</button>
                              )}
                            </div>
                          </div>
                          <div className="assessment-weight-meta">
                            {assessment.weight}%
                          </div>
                        </div>

                        <div className="outcomes-mapped">
                          <span className="meta-label">Assesses:</span>
                          <div className="outcome-tag-list">
                            {assessedOutcomes.length > 0 ? (
                               assessedOutcomes.map(o => (
                                <span key={o?.id} className="outcome-tag" title={o?.description}>
                                  {o?.code}
                                </span>
                              ))
                            ) : (
                              <span className="italic text-secondary text-xs">No explicit outcome links</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="italic text-secondary pl-4">No assessments mapped to this module.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssessmentMappingView;
