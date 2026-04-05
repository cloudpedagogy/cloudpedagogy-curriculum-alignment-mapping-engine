import React, { useState } from 'react';
import type { MappingDataset, Module, Relationship, EntityType } from '../types';

interface StructureEditorProps {
  dataset: MappingDataset;
  onAddModule: (module: Module) => void;
  onAddRelationship: (rel: Relationship) => void;
  onClose: () => void;
}

const StructureEditor: React.FC<StructureEditorProps> = ({
  dataset,
  onAddModule,
  onAddRelationship,
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
  const [relType, setRelType] = useState<Relationship['type']>('aligns');

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
          onChange={e => setModTitle(e.target.value)} 
          placeholder="e.g. Intro to Data"
          required
        />
      </div>
      <div className="form-group">
        <label>Level</label>
        <select value={modLevel} onChange={e => setModLevel(e.target.value)}>
          <option value="4">Level 4</option>
          <option value="5">Level 5</option>
          <option value="6">Level 6</option>
          <option value="7">Level 7</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary mt-4 w-full">Add Module</button>
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
      <form onSubmit={handleAddRelationship} className="editor-form">
        <div className="form-group">
          <label>Source (e.g. Module or Assessment)</label>
          <select value={relSource} onChange={e => setRelSource(e.target.value)} required>
            <option value="">Select source...</option>
            {allSources.map(s => (
              <option key={s.id} value={s.id}>[{s.type}] {s.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Relationship Type</label>
          <select value={relType} onChange={e => setRelType(e.target.value as any)}>
            <option value="aligns">Aligns to</option>
            <option value="assesses">Assesses (Assessment → Outcome)</option>
            <option value="develops">Develops (Module → Skill)</option>
            <option value="prerequisite">Prerequisite (Module → Module)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Target (e.g. Outcome, Skill, or Module)</label>
          <select value={relTarget} onChange={e => setRelTarget(e.target.value)} required>
            <option value="">Select target...</option>
            {allTargets.map(t => (
              <option key={t.id} value={t.id}>[{t.type}] {t.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary mt-4 w-full">Add Relationship</button>
      </form>
    );
  };

  return (
    <div className="structure-editor-overlay">
      <div className="structure-editor-panel">
        <div className="editor-header">
          <h2>Structure Explorer</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
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
            Use "Reset Data" in the main dashboard to revert.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StructureEditor;
