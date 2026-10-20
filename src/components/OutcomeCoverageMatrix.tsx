import React from 'react';
import type { MappingDataset } from '../types';
import { getModuleDeletionImpact, getOutcomeDeletionImpact } from '../lib/data/safeDeletion';

interface OutcomeCoverageMatrixProps {
  dataset: MappingDataset;
  onRemoveModule?: (id: string) => void;
  onRemoveOutcome?: (id: string) => void;
}

const OutcomeCoverageMatrix: React.FC<OutcomeCoverageMatrixProps> = ({
  dataset,
  onRemoveModule,
  onRemoveOutcome
}) => {
  const { modules, outcomes, relationships } = dataset;

  const handleRemoveModule = (moduleId: string) => {
    if (!onRemoveModule) return;
    const impact = getModuleDeletionImpact(dataset, moduleId);
    const promptMsg = impact.hasDependencies
      ? `${impact.summaryMessage}\n\nOwned assessments, exclusively owned outcomes, and prerequisite links will be removed. Shared outcomes referenced by other modules will be preserved.\n\nProceed with deleting module ${impact.moduleCode}?`
      : `Delete unreferenced module ${impact.moduleCode} (${impact.moduleTitle})?`;

    if (window.confirm(promptMsg)) {
      onRemoveModule(moduleId);
    }
  };

  const handleRemoveOutcome = (outcomeId: string) => {
    if (!onRemoveOutcome) return;
    const impact = getOutcomeDeletionImpact(dataset, outcomeId);
    const promptMsg = impact.hasDependencies
      ? `${impact.summaryMessage}\n\nDeleting this outcome will unlink these mappings. Linked modules and assessments will remain intact.\n\nProceed with deleting outcome ${impact.outcomeCode}?`
      : `Delete unreferenced outcome ${impact.outcomeCode}?`;

    if (window.confirm(promptMsg)) {
      onRemoveOutcome(outcomeId);
    }
  };

  // 1. Group and sort modules by level
  const sortedModules = [...modules].sort((a, b) => {
    const levelA = parseInt(a.level) || 0;
    const levelB = parseInt(b.level) || 0;
    if (levelA !== levelB) return levelA - levelB;
    return a.code.localeCompare(b.code);
  });

  // 2. Alignment Lookup
  const getAlignmentInfo = (outcomeId: string, moduleId: string) => {
    const aligns = relationships.some(r =>
      r.sourceId === moduleId && r.targetId === outcomeId && r.type === 'aligns'
    );

    // Check if any assessment in this module assesses this outcome
    const assesses = relationships.some(r =>
      r.targetId === outcomeId && r.type === 'assesses' &&
      dataset.assessments.find(a => a.id === r.sourceId)?.moduleId === moduleId
    );

    return { aligns, assesses };
  };

  return (
    <div className="coverage-matrix-container">
      <div className="panel-header mb-6">
        <h2>Outcome Coverage Matrix</h2>
        <p className="text-secondary">System-level mapping of learning outcomes across module levels.</p>
      </div>

      <div className="matrix-wrapper">
        <table className="coverage-table">
          <thead>
            <tr>
              <th className="sticky-col first-col">Learning Outcome</th>
              {sortedModules.map(m => (
                <th key={m.id} className="module-header">
                  <div className="module-header-content">
                    <div className="module-level">L{m.level}</div>
                    {onRemoveModule && (
                      <button
                        className="remove-btn"
                        title={`Delete module ${m.code}`}
                        onClick={() => handleRemoveModule(m.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="module-code">{m.code}</div>
                </th>
              ))}
              <th className="summary-col">Signals</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map(outcome => {
              const rowAlignments = sortedModules.map(m => getAlignmentInfo(outcome.id, m.id));
              const alignCount = rowAlignments.filter(a => a.aligns).length;
              const isGap = alignCount === 0;
              const isOverConcentrated = alignCount >= 3;

              return (
                <tr key={outcome.id}>
                  <td className="sticky-col first-col">
                    <div className="outcome-row-header flex items-center justify-between gap-2">
                      <div>
                        <span className="outcome-code">{outcome.code}</span>
                        <span className="outcome-desc">{outcome.description}</span>
                      </div>
                      {onRemoveOutcome && (
                        <button
                          className="remove-btn"
                          title={`Delete outcome ${outcome.code}`}
                          onClick={() => handleRemoveOutcome(outcome.id)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  {sortedModules.map(m => {
                    const info = getAlignmentInfo(outcome.id, m.id);
                    return (
                      <td key={`${outcome.id}-${m.id}`} className="matrix-cell">
                        {info.aligns && (
                          <div className="cell-indicator" title={info.assesses ? 'Aligned & Assessed' : 'Aligned'}>
                            {info.assesses ? '●' : '○'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="summary-col">
                    <div className="row-signals">
                      {isGap && <span className="outcome-tag">Gap</span>}
                      {isOverConcentrated && <span className="outcome-tag">{alignCount}x</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="matrix-legend mt-4">
        <div className="legend-item">
          <span className="indicator aligned">○</span>
          <span>Explicitly Aligned</span>
        </div>
        <div className="legend-item">
          <span className="indicator assessed">●</span>
          <span>Aligned & Assessed</span>
        </div>
        <div className="legend-item">
          <span className="outcome-tag">Gap</span>
          <span>Uncovered Outcome</span>
        </div>
        <div className="legend-item">
          <span className="outcome-tag">Nx</span>
          <span>High Concentration (Modules)</span>
        </div>
      </div>
    </div>
  );
};

export default OutcomeCoverageMatrix;
