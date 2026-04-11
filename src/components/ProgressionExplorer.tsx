import React, { useMemo } from 'react';
import type { MappingDataset } from '../types';
import { findPrerequisiteChains, detectDisconnectedPathways } from '../lib/analysis/progression';

interface ProgressionExplorerProps {
  dataset: MappingDataset;
  moduleIdFilter?: string[];
}

const ProgressionExplorer: React.FC<ProgressionExplorerProps> = ({ dataset, moduleIdFilter }) => {
  const { modules } = dataset;

  const filteredModules = useMemo(() => {
    if (!moduleIdFilter) return modules;
    return modules.filter(m => moduleIdFilter.includes(m.id));
  }, [modules, moduleIdFilter]);

  const chains = useMemo(() => findPrerequisiteChains(dataset), [dataset]);
  const gaps = useMemo(() => detectDisconnectedPathways(dataset), [dataset]);

  const activeChains = useMemo(() => {
    return chains.filter(c => filteredModules.some(m => m.id === c.moduleId));
  }, [chains, filteredModules]);

  const activeGaps = useMemo(() => {
    return gaps.filter(g => filteredModules.some(m => m.id === g.moduleId));
  }, [gaps, filteredModules]);

  return (
    <div className="progression-explorer-panel p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="panel-header mb-6">
        <h2 className="text-xl font-bold text-slate-800">Dependency & Progression Mapping</h2>
        <p className="text-slate-500">Visualization of prerequisite chains and disconnected study pathways.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="chain-list-section">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span>🔗 Prerequisite Chains</span>
          </h3>
          <div className="space-y-4">
            {activeChains.filter(c => c.chain.length > 1).map(c => {
              const rootModule = modules.find(m => m.id === c.moduleId);
              return (
                <div key={`chain-${c.moduleId}`} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs font-bold text-blue-700 mb-2">{rootModule?.code} Path:</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.chain.map((id, index) => {
                      const m = modules.find(x => x.id === id);
                      return (
                        <React.Fragment key={id}>
                          <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium">
                            <span className="text-blue-600 font-bold">L{m?.level}</span> {m?.code}
                          </div>
                          {index < c.chain.length - 1 && <span className="text-slate-400">→</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {activeChains.filter(c => c.chain.length > 1).length === 0 && (
              <p className="text-xs text-slate-400 italic">No multi-module chains detected in the current scope.</p>
            )}
          </div>
        </div>

        <div className="disconnected-paths-section">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span>🔀 Disconnected Pathways</span>
          </h3>
          <div className="space-y-3">
            {activeGaps.map((gap, index) => {
              const m = modules.find(x => x.id === gap.moduleId);
              return (
                <div key={`gap-${index}`} className="flex items-start gap-3 p-3 border-l-4 border-amber-400 bg-amber-50 rounded-r-lg">
                  <span className="text-amber-600 text-lg">⚠️</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{m?.code}: {m?.title}</div>
                    <div className="text-[11px] text-slate-600">{gap.reason}</div>
                  </div>
                </div>
              );
            })}
            {activeGaps.length === 0 && (
              <p className="text-xs text-slate-400 italic">All modules fit established progression patterns.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressionExplorer;
