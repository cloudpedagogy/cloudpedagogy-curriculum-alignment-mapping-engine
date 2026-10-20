import React from 'react';
import type { MappingDataset } from '../types';
import { analyzeAlignment } from '../features/mapping/alignmentAnalysis';
import { calculateAverageDensity, detectDisconnectedPathways } from '../lib/analysis';

interface StructuralSignalsProps {
  dataset: MappingDataset;
}

const StructuralSignals: React.FC<StructuralSignalsProps> = ({ dataset }) => {
  const signals = analyzeAlignment(dataset);
  const avgDensity = calculateAverageDensity(dataset);
  const disconnectedPaths = detectDisconnectedPathways(dataset);

  const renderSection = (title: string, subtitle: string, items: React.ReactNode[]) => {
    if (items.length === 0) return null;
    return (
      <div className="signal-section mb-6">
        <h3 className="signal-title text-sm font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-[11px] text-slate-500 mb-3">{subtitle}</p>
        <div className="signal-list space-y-2">
          {items}
        </div>
      </div>
    );
  };

  const outcomeItems = [
    ...signals.outcomeSignals.unmapped.map(id => {
      const o = dataset.outcomes.find(x => x.id === id);
      return (
        <div key={`unmapped-${id}`} className="signal-item p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
              Unmapped in Modules
            </span>
            <span className="font-semibold text-slate-800">{o?.code}</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            Outcome is not currently linked to any module. Verify if this outcome belongs to a planned module or serves as an overarching programme goal.
          </p>
        </div>
      );
    }),
    ...signals.outcomeSignals.unassessed.map(id => {
      const o = dataset.outcomes.find(x => x.id === id);
      return (
        <div key={`unassessed-${id}`} className="signal-item p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
              Unassessed Outcome
            </span>
            <span className="font-semibold text-slate-800">{o?.code}</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            No formal assessment tasks are currently mapped to this outcome. Review whether this outcome is evaluated holistically, formatively, or requires dedicated assessment evidence.
          </p>
        </div>
      );
    }),
    ...signals.outcomeSignals.overConcentrated.map(item => {
      const o = dataset.outcomes.find(x => x.id === item.id);
      return (
        <div key={`conc-${item.id}`} className="signal-item p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
              Reinforced Coverage
            </span>
            <span className="font-semibold text-slate-800">{o?.code}</span>
          </div>
          <p className="text-slate-600 text-[11px]">
            Mapped across <strong>{item.moduleCount} modules</strong>. Multi-module alignment can reflect spiral curriculum reinforcement or cross-cutting core competencies; review to confirm this reflects intended progression.
          </p>
        </div>
      );
    })
  ];

  const skillItems = signals.skillSignals.weaklyRepresented.map(id => {
    const s = dataset.skills.find(x => x.id === id);
    const count = dataset.relationships.filter(r => r.targetId === id && r.type === 'develops').length;
    return (
      <div key={`weak-${id}`} className="signal-item p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
            Single Module Focus
          </span>
          <span className="font-semibold text-slate-800">{s?.name}</span>
        </div>
        <p className="text-slate-600 text-[11px]">
          Explicitly developed in {count} module(s). Specialist or capstone competencies are often concentrated in a single module; review to verify intended programme-wide coverage.
        </p>
      </div>
    );
  });

  const assessmentItems = signals.assessmentSignals.assessmentDenseModules.map(item => {
    const m = dataset.modules.find(x => x.id === item.id);
    return (
      <div key={`dense-${item.id}`} className="signal-item p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
            Assessment Workload
          </span>
          <span className="font-semibold text-slate-800">{m?.code}: {m?.title}</span>
        </div>
        <p className="text-slate-600 text-[11px]">
          Contains <strong>{item.assessmentCount} assessments</strong> relative to <strong>{item.outcomeCount} mapped outcomes</strong>. Heuristic observation: review student assessment distribution and formative vs summative load.
        </p>
      </div>
    );
  });

  const architectureItems = [
    <div key="avg-density" className="signal-item p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
          Assessment Density (Descriptive)
        </span>
      </div>
      <p className="text-slate-600 text-[11px]">
        Current ratio: <strong>{avgDensity.toFixed(2)} assessments per outcome</strong>. Descriptive indicator of mapping concentration across outcomes; optimal ratios depend on credit weight and departmental policy.
      </p>
    </div>,
    ...disconnectedPaths.map((path, i) => (
      <div key={`disconnected-${i}`} className="signal-item p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
            Progression Observation (Heuristic)
          </span>
          <span className="font-semibold text-slate-800">{dataset.modules.find(m => m.id === path.moduleId)?.code}</span>
        </div>
        <p className="text-slate-600 text-[11px]">{path.reason}</p>
      </div>
    ))
  ];

  return (
    <div className="structural-signals-panel">
      <div className="panel-header mb-6">
        <h2 className="text-xl font-bold text-slate-800">Structural Alignment Analysis</h2>
        <p className="text-secondary text-sm">
          Heuristic observations reflecting curriculum architecture and alignment patterns. These indicators provide discussion prompts for curriculum committees rather than normative judgements of curriculum quality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="signal-group">
          {renderSection('Outcome Observations', 'Alignment distribution and assessment coverage', outcomeItems) || (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              ✓ All learning outcomes have active module alignments.
            </div>
          )}
        </div>
        <div className="signal-group">
          {renderSection('Skill Observations', 'Graduate attributes and competency development', skillItems) || (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              ✓ All skills have multiple module development links.
            </div>
          )}
        </div>
        <div className="signal-group">
          {renderSection('Assessment Workload', 'Assessment volume and outcome mapping distribution', assessmentItems) || (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              ✓ Assessment counts are proportional to mapped outcomes.
            </div>
          )}
        </div>
        <div className="signal-group">
          {renderSection('Architecture & Progression', 'Curriculum density and prerequisite pathways', architectureItems)}
        </div>
      </div>
    </div>
  );
};

export default StructuralSignals;
