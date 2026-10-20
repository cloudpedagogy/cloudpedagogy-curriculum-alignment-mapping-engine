import React from 'react';
import type { MappingDataset } from '../types';

interface OutcomeCoverageMatrixProps {
  dataset: MappingDataset;
}

const OutcomeCoverageMatrix: React.FC<OutcomeCoverageMatrixProps> = ({ dataset }) => {
  const { modules, outcomes, relationships } = dataset;

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
        <h2 className="text-xl font-bold text-slate-800">Outcome Coverage Matrix</h2>
        <p className="text-secondary text-sm">
          Systematic mapping of learning outcomes across module levels. Visualises where outcomes are addressed and formally evaluated.
        </p>
      </div>

      <div className="matrix-wrapper overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
        <table className="coverage-table w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky-col first-col p-3 bg-slate-50 text-left border border-slate-200 min-w-[260px]">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Learning Outcome</div>
              </th>
              {sortedModules.map(m => (
                <th key={m.id} className="module-header p-3 text-center border border-slate-200 bg-slate-50 min-w-[90px]" title={`${m.code}: ${m.title}`}>
                  <div className="text-[10px] text-blue-600 font-bold uppercase">L{m.level}</div>
                  <div className="text-xs font-bold text-slate-800">{m.code}</div>
                </th>
              ))}
              <th className="summary-col p-3 text-center border border-slate-200 bg-slate-50 min-w-[130px]">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Alignment Distribution</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {outcomes.length === 0 ? (
              <tr>
                <td colSpan={sortedModules.length + 2} className="p-6 text-center text-xs text-slate-500 italic">
                  No learning outcomes recorded. Add outcomes in the Build workspace to view alignment coverage.
                </td>
              </tr>
            ) : (
              outcomes.map(outcome => {
                const rowAlignments = sortedModules.map(m => getAlignmentInfo(outcome.id, m.id));
                const alignCount = rowAlignments.filter(a => a.aligns).length;
                const isGap = alignCount === 0;
                const isOverConcentrated = alignCount >= 3;

                return (
                  <tr key={outcome.id} className="hover:bg-slate-50 transition-colors">
                    <td className="sticky-col first-col p-3 border border-slate-200 bg-white">
                      <div className="outcome-row-header">
                        <span className="outcome-code font-bold text-xs text-slate-900 block mb-0.5">{outcome.code}</span>
                        <span className="outcome-desc text-xs text-slate-600 block line-clamp-2" title={outcome.description}>
                          {outcome.description}
                        </span>
                      </div>
                    </td>
                    {sortedModules.map(m => {
                      const info = getAlignmentInfo(outcome.id, m.id);
                      return (
                        <td key={`${outcome.id}-${m.id}`} className="matrix-cell p-3 text-center border border-slate-200">
                          {info.aligns && (
                            <div
                              className="cell-indicator text-base leading-none cursor-default"
                              title={info.assesses ? `${outcome.code} is aligned and formally assessed in ${m.code}` : `${outcome.code} is aligned in ${m.code}`}
                            >
                              {info.assesses ? (
                                <span className="text-blue-700 font-bold">●</span>
                              ) : (
                                <span className="text-slate-500 font-semibold">○</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="summary-col p-3 text-center border border-slate-200">
                      <div className="row-signals flex justify-center">
                        {isGap && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
                            title="Review advisory: outcome has no active module alignments"
                          >
                            Unmapped
                          </span>
                        )}
                        {isOverConcentrated && (
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800"
                            title={`Aligned in ${alignCount} modules; spiral reinforcement or cross-cutting competency`}
                          >
                            {alignCount} Modules
                          </span>
                        )}
                        {!isGap && !isOverConcentrated && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {alignCount} Module{alignCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="matrix-legend mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="legend-item flex items-center gap-2">
            <span className="text-base text-slate-600 font-semibold">○</span>
            <span className="text-slate-700">Explicitly Aligned (Taught in Module)</span>
          </div>
          <div className="legend-item flex items-center gap-2">
            <span className="text-base text-blue-700 font-bold">●</span>
            <span className="text-slate-700">Aligned & Assessed (Taught and Evaluated)</span>
          </div>
          <div className="legend-item flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Unmapped</span>
            <span className="text-slate-700">Unmapped Outcome (Advisory)</span>
          </div>
          <div className="legend-item flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Nx Modules</span>
            <span className="text-slate-700">Spiral / Reinforced Coverage</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mt-2 italic">
        Educational note: Multi-module mapping often reflects intentional spiral curriculum reinforcement. Unmapped outcomes represent design considerations for review rather than structural faults.
      </p>
    </div>
  );
};

export default OutcomeCoverageMatrix;
