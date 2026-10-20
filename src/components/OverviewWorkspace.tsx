import React from 'react';
import type { MappingDataset, Programme } from '../types';
import SummaryCard from './SummaryCard';
import ProgrammeSelector from '../features/programmes/ProgrammeSelector';
import { analyzeAlignment } from '../features/mapping/alignmentAnalysis';
import type { GraphMetrics } from '../features/relationships/graphUtils';
import type { WorkspaceTab } from './Navigation';

interface OverviewWorkspaceProps {
  dataset: MappingDataset;
  activeProgramme: Programme | null;
  activeProgrammeId: string | null;
  metrics: GraphMetrics | null;
  onNavigate: (tab: WorkspaceTab) => void;
  onSelectProgramme: (id: string | null) => void;
}

const OverviewWorkspace: React.FC<OverviewWorkspaceProps> = ({
  dataset,
  activeProgramme,
  activeProgrammeId,
  metrics,
  onNavigate,
  onSelectProgramme
}) => {
  const signals = analyzeAlignment(dataset);

  return (
    <div className="overview-workspace">
      {/* 1. Header Information & Scope */}
      <div className="overview-header-card mb-6 p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Active Curriculum Model
              </span>
              {dataset.id === 'ph-demo-dataset-v1' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                  Example Demonstration Dataset
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeProgramme ? `${activeProgramme.name} (${dataset.name})` : dataset.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Version {dataset.version} · Last updated {new Date(dataset.lastUpdated).toLocaleDateString()}
              {activeProgramme && ` · Filtered to programme: ${activeProgramme.name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={() => onNavigate('build')}
            >
              <span>🏗️</span> Edit Curriculum
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm flex items-center gap-1"
              onClick={() => onNavigate('explore')}
            >
              <span>🧭</span> Explore Graph
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm flex items-center gap-1"
              onClick={() => onNavigate('review')}
            >
              <span>🔍</span> Review Matrix
            </button>
          </div>
        </div>

        {dataset.programmes && dataset.programmes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <ProgrammeSelector
              programmes={dataset.programmes}
              activeProgrammeId={activeProgrammeId}
              onSelectProgramme={onSelectProgramme}
            />
          </div>
        )}
      </div>

      {/* 2. Primary Metrics Count */}
      <div className="summary-grid mb-6">
        <SummaryCard
          label="Modules"
          count={dataset.modules.length}
          icon="📘"
        />
        <SummaryCard
          label="Outcomes"
          count={dataset.outcomes.length}
          icon="🎯"
        />
        <SummaryCard
          label="Assessments"
          count={dataset.assessments.length}
          icon="📝"
        />
        <SummaryCard
          label="Skills"
          count={dataset.skills.length}
          icon="🛠️"
        />
      </div>

      {/* 3. Structural Summary & Prioritised Observations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="overview-card p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span>📊</span> Curriculum Topology & Cohesion
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Relational structure and connectedness across modules, outcomes, assessments, and skills.
          </p>

          <div className="space-y-3 text-xs">
            <div className="py-2 border-b border-slate-100">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-slate-600 font-medium">Total Curriculum Alignments:</span>
                <span className="font-bold text-slate-800">{dataset.relationships.length}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Explicit connections linking modules to outcomes, assessments, prerequisites, and skills.
              </p>
            </div>

            {metrics && (
              <>
                <div className="py-2 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-slate-600 font-medium">Connected Curriculum Clusters:</span>
                    <span className="font-bold text-slate-800">{metrics.connectedComponents}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Interconnected sub-networks. Multiple clusters typically represent distinct programmes, specialist pathways, or elective diets.
                  </p>
                </div>

                <div className="py-2 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-slate-600 font-medium">Standalone / Unlinked Elements:</span>
                    <span className={`font-bold ${metrics.orphanedEntities > 0 ? 'text-blue-600' : 'text-slate-800'}`}>
                      {metrics.orphanedEntities}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Elements with no recorded links (e.g. newly drafted items, standalone electives, or general competencies).
                  </p>
                </div>
              </>
            )}

            <div className="py-2">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-slate-600 font-medium">Defined Programmes / Diets:</span>
                <span className="font-bold text-slate-800">{dataset.programmes?.length || 0}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Formal award structures and course pathways defined in this curriculum model.
              </p>
            </div>
          </div>

          {metrics && metrics.orphanedEntities > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <details className="text-[11px] text-slate-500">
                <summary className="cursor-pointer font-medium text-slate-700 hover:text-blue-600">
                  Advanced Graph Topology Details
                </summary>
                <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 space-y-1 font-mono text-[10px]">
                  <div>Total Nodes: {dataset.modules.length + dataset.outcomes.length + dataset.assessments.length + dataset.skills.length}</div>
                  <div>Graph Components: {metrics.connectedComponents}</div>
                  <div>Unlinked Entity IDs: {metrics.isolatedEntityIds.join(', ')}</div>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="overview-card p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>💡</span> Prioritised Alignment Observations
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Key pedagogical indicators identified for curriculum committee review.
          </p>

          <div className="space-y-3 text-xs">
            {signals.outcomeSignals.unassessed.length > 0 ? (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                    Review Advisory
                  </span>
                  <strong>{signals.outcomeSignals.unassessed.length} outcome(s) without mapped assessments</strong>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Taught in modules but not linked to a formal assessment task. Review whether assessed holistically, formatively, or requiring dedicated assessment evidence.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <span>✓</span>
                <span className="font-semibold">All learning outcomes have recorded assessment mappings.</span>
              </div>
            )}

            {signals.skillSignals.weaklyRepresented.length > 0 ? (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-900 uppercase">
                    Pedagogical Note
                  </span>
                  <strong>{signals.skillSignals.weaklyRepresented.length} skill(s) with single-module mapping</strong>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Explicitly developed in one or fewer modules. Common for specialist competencies; verify whether broader vertical progression across modules is intended.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <span>✓</span>
                <span className="font-semibold">All skills are reinforced across multiple modules.</span>
              </div>
            )}

            {signals.assessmentSignals.assessmentDenseModules.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
                    Workload Observation
                  </span>
                  <strong>High assessment density in {signals.assessmentSignals.assessmentDenseModules.length} module(s)</strong>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Multiple assessment tasks relative to learning outcomes. Review student assessment workload and balance between formative and summative tasks.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Action Launchpad */}
      <div className="workspace-launchpad mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Workspaces</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="launchpad-card p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
            onClick={() => onNavigate('build')}
          >
            <div className="text-2xl mb-2">🏗️</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Build & Structure</h4>
            <p className="text-xs text-slate-500">Create and maintain modules, outcomes, and alignment links.</p>
          </div>

          <div
            className="launchpad-card p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
            onClick={() => onNavigate('explore')}
          >
            <div className="text-2xl mb-2">🧭</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Explore Topology</h4>
            <p className="text-xs text-slate-500">Interactive multipartite graph, skill heatmap, and progression paths.</p>
          </div>

          <div
            className="launchpad-card p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
            onClick={() => onNavigate('review')}
          >
            <div className="text-2xl mb-2">🔍</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Review Alignment</h4>
            <p className="text-xs text-slate-500">Detailed outcome coverage matrix and assessment validation.</p>
          </div>

          <div
            className="launchpad-card p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
            onClick={() => onNavigate('data')}
          >
            <div className="text-2xl mb-2">💾</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Data & Health</h4>
            <p className="text-xs text-slate-500">Import, export, validate, or reset the local curriculum dataset.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewWorkspace;
