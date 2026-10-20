import React, { useState } from 'react';
import type { MappingDataset, Module, Relationship, EntityType, RelationshipType } from '../types';

interface StructureEditorProps {
  dataset: MappingDataset;
  isInline?: boolean;
  onAddModule: (module: Module) => void;
  onAddRelationship: (rel: Relationship) => void;
  onRemoveRelationship?: (id: string) => void;
  onClose?: () => void;
}

const StructureEditor: React.FC<StructureEditorProps> = ({
  dataset,
  isInline = false,
  onAddModule,
  onAddRelationship,
  onRemoveRelationship,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'module' | 'relationship'>('module');

  // Module Form State
  const [modCode, setModCode] = useState('');
  const [modTitle, setModTitle] = useState('');
  const [modLevel, setModLevel] = useState('4');

  // Relationship Form State
  const [relSource, setRelSource] = useState('');
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState<RelationshipType>('aligns');

  const getEntityLabel = (id: string, type?: EntityType) => {
    if (type === 'module' || (!type && dataset.modules.some(m => m.id === id))) {
      const m = dataset.modules.find(x => x.id === id);
      return m ? `[Module] ${m.code}` : id;
    }
    if (type === 'assessment' || (!type && dataset.assessments.some(a => a.id === id))) {
      const a = dataset.assessments.find(x => x.id === id);
      return a ? `[Assessment] ${a.title}` : id;
    }
    if (type === 'outcome' || (!type && dataset.outcomes.some(o => o.id === id))) {
      const o = dataset.outcomes.find(x => x.id === id);
      return o ? `[Outcome] ${o.code}` : id;
    }
    if (type === 'skill' || (!type && dataset.skills.some(s => s.id === id))) {
      const s = dataset.skills.find(x => x.id === id);
      return s ? `[Skill] ${s.name}` : id;
    }
    return id;
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modCode || !modTitle) return;

    onAddModule({
      id: `m-${Date.now()}`,
      code: modCode,
      title: modTitle,
      credits: 15,
      level: modLevel
    });

    setModCode('');
    setModTitle('');
  };

  const handleAddRelationship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relSource || !relTarget) return;

    // Determine source and target types
    const allEntities = [
      ...dataset.modules.map(m => ({ id: m.id, type: 'module' as EntityType })),
      ...dataset.outcomes.map(o => ({ id: o.id, type: 'outcome' as EntityType })),
      ...dataset.assessments.map(a => ({ id: a.id, type: 'assessment' as EntityType })),
      ...dataset.skills.map(s => ({ id: s.id, type: 'skill' as EntityType }))
    ];

    const source = allEntities.find(e => e.id === relSource);
    const target = allEntities.find(e => e.id === relTarget);

    if (source && target) {
      onAddRelationship({
        id: `r-${Date.now()}`,
        sourceId: source.id,
        sourceType: source.type,
        targetId: target.id,
        targetType: target.type,
        type: relType
      });
    }

    setRelSource('');
    setRelTarget('');
  };

  const renderModuleForm = () => (
    <form onSubmit={handleAddModule} className="editor-form">
      <div className="form-group">
        <label>Module Code</label>
        <input
          type="text"
          value={modCode}
          className="form-control"
          onChange={e => setModCode(e.target.value)}
          placeholder="e.g. CS101"
          required
        />
      </div>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={modTitle}
          className="form-control"
          onChange={e => setModTitle(e.target.value)}
          placeholder="e.g. Intro to Data"
          required
        />
      </div>
      <div className="form-group">
        <label>Level</label>
        <select className="form-control" value={modLevel} onChange={e => setModLevel(e.target.value)}>
          <option value="4">Level 4</option>
          <option value="5">Level 5</option>
          <option value="6">Level 6</option>
          <option value="7">Level 7</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary mt-4 w-full" style={{ width: '100%' }}>Add Module</button>
    </form>
  );

  const renderRelationshipForm = () => {
    const allSources = [
      ...dataset.modules.map(m => ({ id: m.id, label: `${m.code}: ${m.title}`, type: 'Module' })),
      ...dataset.assessments.map(a => ({ id: a.id, label: `${a.title}`, type: 'Assessment' }))
    ];

    const allTargets = [
      ...dataset.modules.map(m => ({ id: m.id, label: `${m.code}: ${m.title}`, type: 'Module' })),
      ...dataset.outcomes.map(o => ({ id: o.id, label: `${o.code}: ${o.description.substring(0, 40)}...`, type: 'Outcome' })),
      ...dataset.skills.map(s => ({ id: s.id, label: `${s.name}`, type: 'Skill' }))
    ];

    return (
      <div className="relationship-manager-section">
        <form onSubmit={handleAddRelationship} className="editor-form">
          <div className="form-group">
            <label>Source (e.g. Module or Assessment)</label>
            <select className="form-control" value={relSource} onChange={e => setRelSource(e.target.value)} required>
              <option value="">Select source...</option>
              {allSources.map(s => (
                <option key={s.id} value={s.id}>[{s.type}] {s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Relationship Type</label>
            <select className="form-control" value={relType} onChange={e => setRelType(e.target.value as RelationshipType)}>
              <option value="aligns">Aligns to</option>
              <option value="assesses">Assesses (Assessment → Outcome)</option>
              <option value="develops">Develops (Module → Skill)</option>
              <option value="prerequisite">Prerequisite (Module → Module)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target (e.g. Outcome, Skill, or Module)</label>
            <select className="form-control" value={relTarget} onChange={e => setRelTarget(e.target.value)} required>
              <option value="">Select target...</option>
              {allTargets.map(t => (
                <option key={t.id} value={t.id}>[{t.type}] {t.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary mt-4 w-full" style={{ width: '100%' }}>Add Relationship</button>
        </form>

        <div className="existing-relationships mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-semibold mb-3">Active Alignments & Links ({dataset.relationships.length})</h4>
          {dataset.relationships.length === 0 ? (
            <p className="text-secondary text-xs italic">No relationships defined yet.</p>
          ) : (
            <div className="relationship-scroll-list" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {dataset.relationships.map(rel => {
                const sourceLabel = getEntityLabel(rel.sourceId, rel.sourceType);
                const targetLabel = getEntityLabel(rel.targetId, rel.targetType);
                return (
                  <div
                    key={rel.id}
                    className="relationship-row flex items-center justify-between p-2 mb-2 rounded text-xs bg-slate-50 border border-slate-200"
                  >
                    <div className="rel-text flex items-center gap-1 overflow-hidden pr-2">
                      <span className="outcome-tag text-[10px] font-semibold uppercase">{rel.type}</span>
                      <span className="font-medium truncate" title={sourceLabel}>{sourceLabel}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium truncate" title={targetLabel}>{targetLabel}</span>
                    </div>
                    {onRemoveRelationship && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 text-[11px] px-2 py-0.5 whitespace-nowrap"
                        onClick={() => {
                          if (window.confirm(`Remove '${rel.type}' alignment between ${sourceLabel} and ${targetLabel}? Linked entities will remain intact.`)) {
                            onRemoveRelationship(rel.id);
                          }
                        }}
                        title="Remove alignment without deleting entities"
                      >
                        ✕ Unlink
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const editorContent = (
    <div className={isInline ? "structure-editor-inline" : "structure-editor-panel"}>
      <div className="editor-header">
        <h2>Structure Explorer</h2>
        {onClose && <button className="close-btn" onClick={onClose} aria-label="Close editor">✕</button>}
      </div>

      <div className="editor-tabs">
        <button
          className={`tab-btn ${activeTab === 'module' ? 'active' : ''}`}
          onClick={() => setActiveTab('module')}
        > Add Module </button>
        <button
          className={`tab-btn ${activeTab === 'relationship' ? 'active' : ''}`}
          onClick={() => setActiveTab('relationship')}
        > Manage Links </button>
      </div>

      <div className="editor-content">
        {activeTab === 'module' ? renderModuleForm() : renderRelationshipForm()}
      </div>

      <div className="editor-footer mt-4">
        <p className="text-secondary text-xs">
          Structural changes reflect in real-time across all views.
          Use "Reset Data" in the Data workspace to revert.
        </p>
      </div>
    </div>
  );

  React.useEffect(() => {
    if (isInline || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInline, onClose]);

  if (isInline) {
    return editorContent;
  }

  return (
    <div className="structure-editor-overlay" role="dialog" aria-modal="true" aria-label="Structure Explorer">
      {editorContent}
    </div>
  );
};

export default StructureEditor;
