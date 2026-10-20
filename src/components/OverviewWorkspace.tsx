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
          <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>📊</span> Structural Overview
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Key relational topology indicators across your curriculum network.
          </p>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total Relationships:</span>
              <span className="font-bold text-slate-800">{dataset.relationships.length}</span>
            </div>
            {metrics && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Connected Graph Components:</span>
                  <span className="font-bold text-slate-800">{metrics.connectedComponents}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600 font-medium">Unlinked / Isolated Entities:</span>
                  <span className={`font-bold ${metrics.orphanedEntities > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {metrics.orphanedEntities}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600 font-medium">Defined Programmes / Diets:</span>
              <span className="font-bold text-slate-800">{dataset.programmes?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="overview-card p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>💡</span> Prioritised Alignment Observations
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Key pedagogical signals identified for curriculum committee review.
          </p>

          <div className="space-y-2 text-xs">
            {signals.outcomeSignals.unassessed.length > 0 ? (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200 text-amber-800">
                <span>⚠️</span>
                <div>
                  <strong>{signals.outcomeSignals.unassessed.length} unassessed outcome(s)</strong>
                  <p className="text-[11px] text-amber-700">Taught in modules but not linked to a formal assessment component.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800">
                <span>✓</span>
                <span>All outcomes have mapped assessments.</span>
              </div>
            )}

            {signals.skillSignals.weaklyRepresented.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-200 text-blue-800">
                <span>ℹ️</span>
                <div>
                  <strong>{signals.skillSignals.weaklyRepresented.length} skill(s) with minimal coverage</strong>
                  <p className="text-[11px] text-blue-700">Explicitly developed in one or fewer modules.</p>
                </div>
              </div>
            )}

            {signals.assessmentSignals.assessmentDenseModules.length > 0 && (
              <div className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700">
                <span>📝</span>
                <div>
                  <strong>High assessment density in {signals.assessmentSignals.assessmentDenseModules.length} module(s)</strong>
                  <p className="text-[11px] text-slate-500">More than 2 assessments relative to learning outcomes.</p>
                </div>
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
