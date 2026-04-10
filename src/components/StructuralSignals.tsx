import React from 'react';
import type { MappingDataset } from '../types';
import { analyzeAlignment } from '../features/mapping/alignmentAnalysis';

interface StructuralSignalsProps {
  dataset: MappingDataset;
}

const StructuralSignals: React.FC<StructuralSignalsProps> = ({ dataset }) => {
  const signals = analyzeAlignment(dataset);

  const renderSection = (title: string, items: React.ReactNode[]) => {
    if (items.length === 0) return null;
    return (
      <div className="signal-section mb-6">
        <h3 className="signal-title mb-3">{title}</h3>
        <div className="signal-list">
          {items}
        </div>
      </div>
    );
  };

  const outcomeItems = [
    ...signals.outcomeSignals.unmapped.map(id => {
      const o = dataset.outcomes.find(x => x.id === id);
      return (
        <div key={`unmapped-${id}`} className="signal-item">
          <span className="signal-badge">Unmapped</span>
          <span className="signal-text">Outcome <strong>{o?.code}</strong> is not explicitly linked to a module.</span>
        </div>
      );
    }),
    ...signals.outcomeSignals.unassessed.map(id => {
      const o = dataset.outcomes.find(x => x.id === id);
      return (
        <div key={`unassessed-${id}`} className="signal-item">
          <span className="signal-badge">Unassessed</span>
          <span className="signal-text">Outcome <strong>{o?.code}</strong> has no explicit assessment anchors.</span>
        </div>
      );
    }),
    ...signals.outcomeSignals.overConcentrated.map(item => {
      const o = dataset.outcomes.find(x => x.id === item.id);
      return (
        <div key={`conc-${item.id}`} className="signal-item">
          <span className="signal-badge">High Concentration</span>
          <span className="signal-text">Outcome <strong>{o?.code}</strong> is explicitly mapped across <strong>{item.moduleCount} modules</strong>.</span>
        </div>
      );
    })
  ];

  const skillItems = signals.skillSignals.weaklyRepresented.map(id => {
    const s = dataset.skills.find(x => x.id === id);
    return (
      <div key={`weak-${id}`} className="signal-item">
        <span className="signal-badge">Weak Representation</span>
        <span className="signal-text">Skill <strong>{s?.name}</strong> is explicitly developed in <strong>1 or fewer modules</strong>.</span>
      </div>
    );
  });

  const assessmentItems = signals.assessmentSignals.assessmentDenseModules.map(item => {
    const m = dataset.modules.find(x => x.id === item.id);
    return (
      <div key={`dense-${item.id}`} className="signal-item">
        <span className="signal-badge">Assessment Dense</span>
        <span className="signal-text">Module <strong>{m?.code}</strong> has a high assessment concentration (<strong>{item.assessmentCount} assessments</strong> relative to <strong>{item.outcomeCount} outcomes</strong>).</span>
      </div>
    );
  });

  return (
    <div className="structural-signals-panel">
      <div className="panel-header mb-6">
        <h2>Structural Alignment Analysis</h2>
        <p className="text-secondary">Diagnostic signals reflecting curriculum architecture and alignment patterns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="signal-group">
          {renderSection('Outcome Signals', outcomeItems) || (
            <p className="text-secondary italic">No outcome alignment signals detected.</p>
          )}
        </div>
        <div className="signal-group">
          {renderSection('Skill Signals', skillItems) || (
            <p className="text-secondary italic">No skill alignment signals detected.</p>
          )}
        </div>
        <div className="signal-group">
          {renderSection('Assessment Signals', assessmentItems) || (
            <p className="text-secondary italic">No assessment alignment signals detected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StructuralSignals;
