import React from 'react';
import type { MappingDataset } from '../types';

interface AssessmentMappingViewProps {
  dataset: MappingDataset;
}

const AssessmentMappingView: React.FC<AssessmentMappingViewProps> = ({ dataset }) => {
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
        <h2 className="text-xl font-bold text-slate-800">Assessment Structural Mapping</h2>
        <p className="text-secondary text-sm">
          Validation of curriculum outcomes through formal assessment tasks, verifying evaluative evidence and weighting distribution.
        </p>
      </div>

      <div className="assessment-grid space-y-6">
        {modules.map(module => {
          const moduleAssessments = getModuleAssessments(module.id);
          const isDense = isAssessmentDense(module.id, moduleAssessments.length);
          const totalWeight = moduleAssessments.reduce((sum, a) => sum + (a.weight || 0), 0);

          return (
            <div key={module.id} className="module-assessment-group p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="module-tier-header flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
                <div className="tier-info">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                      Level {module.level}
                    </span>
                    <h3 className="text-base font-bold text-slate-800">
                      {module.code}: {module.title}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    totalWeight === 100 ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Total Weight: {totalWeight}%
                  </span>
                  {isDense && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
                      title="Heuristic workload observation: module has multiple assessments relative to mapped outcomes"
                    >
                      Assessment Workload ({moduleAssessments.length} tasks)
                    </span>
                  )}
                </div>
              </div>

              <div className="assessment-list space-y-3">
                {moduleAssessments.length > 0 ? (
                  moduleAssessments.map(assessment => {
                    const assessedOutcomes = getAssessedOutcomes(assessment.id);

                    return (
                      <div key={assessment.id} className="assessment-card p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="assessment-card-header flex items-center justify-between gap-2 mb-2">
                          <div className="assessment-identity flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                              {assessment.type}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800">{assessment.title}</h4>
                          </div>
                          <div className="assessment-weight-meta text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {assessment.weight}%
                          </div>
                        </div>

                        <div className="outcomes-mapped flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-slate-500 font-medium">Assesses:</span>
                          <div className="outcome-tag-list flex flex-wrap gap-1.5">
                            {assessedOutcomes.length > 0 ? (
                              assessedOutcomes.map(o => (
                                <span
                                  key={o?.id}
                                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 text-slate-800"
                                  title={o?.description}
                                >
                                  <strong>{o?.code}</strong>
                                </span>
                              ))
                            ) : (
                              <span className="italic text-slate-500 text-xs">
                                No formal outcome links recorded (advisory)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="italic text-slate-500 text-xs p-3 bg-slate-50 rounded">
                    No assessments currently mapped to this module.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 mt-4 italic">
        Pedagogical note: Assessment mapping documents formal evaluative evidence for intended learning outcomes. Weightings and task counts should reflect departmental assessment regulations and appropriate student workload distribution.
      </p>
    </div>
  );
};

export default AssessmentMappingView;
