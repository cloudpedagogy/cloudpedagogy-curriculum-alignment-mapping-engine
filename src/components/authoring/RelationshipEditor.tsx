import React, { useState, useMemo } from 'react';
import type {
  MappingDataset,
  Relationship,
  RelationshipType,
  Programme
} from '../../types';
import { generateEntityId } from '../../lib/data/idGenerator';
import {
  RELATIONSHIP_TYPE_DEFINITIONS,
  validateRelationshipCreation
} from '../../lib/validation/relationshipValidation';

interface RelationshipEditorProps {
  dataset: MappingDataset;
  activeProgrammeId?: string | null;
  onAddRelationship: (rel: Relationship) => void;
  onRemoveRelationship?: (id: string) => void;
  onSaveProgramme?: (programme: Programme) => void;
}

type FilterType = 'all' | RelationshipType | 'programme_membership';

const getEntityDisplay = (dataset: MappingDataset, type: string, id: string) => {
  switch (type) {
    case 'module': {
      const m = dataset.modules.find(x => x.id === id);
      return m ? { code: m.code, title: m.title, full: `[${m.code}] ${m.title}` } : { code: id, title: 'Unknown Module', full: id };
    }
    case 'outcome': {
      const o = dataset.outcomes.find(x => x.id === id);
      const parentMod = o?.moduleId ? dataset.modules.find(m => m.id === o.moduleId) : null;
      const modPrefix = parentMod ? `[${parentMod.code}] ` : '';
      return o ? { code: o.code, title: o.description, full: `${modPrefix}${o.code}: ${o.description}` } : { code: id, title: 'Unknown Outcome', full: id };
    }
    case 'assessment': {
      const a = dataset.assessments.find(x => x.id === id);
      const parentMod = a?.moduleId ? dataset.modules.find(m => m.id === a.moduleId) : null;
      const modPrefix = parentMod ? `[${parentMod.code}] ` : '';
      return a ? { code: `${a.type} ${a.weight}%`, title: a.title, full: `${modPrefix}${a.title} (${a.type}, ${a.weight}%)` } : { code: id, title: 'Unknown Assessment', full: id };
    }
    case 'skill': {
      const s = dataset.skills.find(x => x.id === id);
      return s ? { code: s.category, title: s.name, full: `[${s.category}] ${s.name}` } : { code: id, title: 'Unknown Skill', full: id };
    }
    case 'programme': {
      const p = dataset.programmes?.find(x => x.id === id);
      return p ? { code: 'Programme', title: p.name, full: p.name } : { code: id, title: 'Unknown Programme', full: id };
    }
    default:
      return { code: type, title: id, full: id };
  }
};

const RelationshipEditor: React.FC<RelationshipEditorProps> = ({
  dataset,
  onAddRelationship,
  onRemoveRelationship,
  onSaveProgramme
}) => {
  const { modules, outcomes, assessments, skills, relationships, programmes = [] } = dataset;

  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation Form State
  const [relType, setRelType] = useState<RelationshipType>('aligns');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Programme membership creation state
  const [progMemberProgId, setProgMemberProgId] = useState('');
  const [progMemberModId, setProgMemberModId] = useState('');

  // Active Type Definition
  const typeDef = RELATIONSHIP_TYPE_DEFINITIONS[relType];

  // Filtered Relationships List
  const filteredRelationships = useMemo(() => {
    return relationships.filter(rel => {
      const matchesType = filterType === 'all' || rel.type === filterType;
      if (!matchesType) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const source = getEntityDisplay(dataset, rel.sourceType, rel.sourceId);
      const target = getEntityDisplay(dataset, rel.targetType, rel.targetId);

      return (
        source.full.toLowerCase().includes(q) ||
        target.full.toLowerCase().includes(q) ||
        rel.type.toLowerCase().includes(q)
      );
    });
  }, [dataset, relationships, filterType, searchQuery]);

  // Selected Relationship Detail
  const activeRelationship = useMemo(() => {
    return relationships.find(r => r.id === selectedRelId) || null;
  }, [relationships, selectedRelId]);

  // Available Sources for Selected Type
  const availableSources = useMemo(() => {
    if (typeDef.sourceType === 'module') {
      return modules.map(m => ({ id: m.id, label: `[${m.code}] ${m.title} (Level ${m.level})` }));
    }
    if (typeDef.sourceType === 'assessment') {
      return assessments.map(a => {
        const parentMod = a.moduleId ? modules.find(m => m.id === a.moduleId) : null;
        const modPrefix = parentMod ? `[${parentMod.code}] ` : '';
        return { id: a.id, label: `${modPrefix}${a.title} (${a.type}, ${a.weight}%)` };
      });
    }
    return [];
  }, [typeDef, modules, assessments]);

  // Available Targets for Selected Type
  const availableTargets = useMemo(() => {
    if (typeDef.targetType === 'outcome') {
      return outcomes.map(o => {
        const parentMod = o.moduleId ? modules.find(m => m.id === o.moduleId) : null;
        const modPrefix = parentMod ? `[${parentMod.code}] ` : '';
        return { id: o.id, label: `${modPrefix}${o.code}: ${o.description.substring(0, 70)}${o.description.length > 70 ? '...' : ''}` };
      });
    }
    if (typeDef.targetType === 'skill') {
      return skills.map(s => ({ id: s.id, label: `[${s.category}] ${s.name}` }));
    }
    if (typeDef.targetType === 'module') {
      return modules.map(m => ({ id: m.id, label: `[${m.code}] ${m.title} (Level ${m.level})` }));
    }
    return [];
  }, [typeDef, outcomes, skills, modules]);

  // Live Validation Preview on Draft
  const liveValidation = useMemo(() => {
    if (!sourceId || !targetId) return null;
    return validateRelationshipCreation(dataset, {
      type: relType,
      sourceType: typeDef.sourceType,
      sourceId,
      targetType: typeDef.targetType,
      targetId
    });
  }, [dataset, relType, typeDef, sourceId, targetId]);

  const handleStartCreate = () => {
    setSelectedRelId(null);
    setIsCreating(true);
    setSourceId('');
    setTargetId('');
    setValidationError(null);
  };

  const handleSelectRelationship = (rel: Relationship) => {
    setSelectedRelId(rel.id);
    setIsCreating(false);
    setValidationError(null);
  };

  const handleTypeChange = (newType: RelationshipType) => {
    setRelType(newType);
    setSourceId('');
    setTargetId('');
    setValidationError(null);
  };

  const handleSaveRelationship = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceId || !targetId) {
      setValidationError('Please select both a source and target entity.');
      return;
    }

    const draft = {
      type: relType,
      sourceType: typeDef.sourceType,
      sourceId,
      targetType: typeDef.targetType,
      targetId
    };

    const result = validateRelationshipCreation(dataset, draft);
    if (!result.isValid) {
      setValidationError(result.error || 'Failed to create relationship.');
      return;
    }

    const existingRelIds = new Set(relationships.map(r => r.id));
    const newRelId = generateEntityId('rel', existingRelIds);

    const newRelationship: Relationship = {
      id: newRelId,
      type: relType,
      sourceType: typeDef.sourceType,
      sourceId,
      targetType: typeDef.targetType,
      targetId
    };

    onAddRelationship(newRelationship);
    setIsCreating(false);
    setSelectedRelId(newRelId);
    setValidationError(null);
  };

  const handleUnlink = (relId: string) => {
    const rel = relationships.find(r => r.id === relId);
    if (!rel) return;

    const source = getEntityDisplay(dataset, rel.sourceType, rel.sourceId);
    const target = getEntityDisplay(dataset, rel.targetType, rel.targetId);

    const confirmed = window.confirm(
      `Remove '${rel.type}' alignment between "${source.full}" and "${target.full}"?\n\nBoth linked entities will remain intact.`
    );

    if (confirmed && onRemoveRelationship) {
      onRemoveRelationship(relId);
      if (selectedRelId === relId) {
        setSelectedRelId(null);
      }
    }
  };

  // Programme Membership Handlers
  const handleAddProgrammeMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progMemberProgId || !progMemberModId || !onSaveProgramme) return;

    const prog = programmes.find(p => p.id === progMemberProgId);
    if (!prog) return;

    if (prog.moduleIds.includes(progMemberModId)) {
      alert('This module is already part of this programme.');
      return;
    }

    const updatedProg: Programme = {
      ...prog,
      moduleIds: [...prog.moduleIds, progMemberModId]
    };

    onSaveProgramme(updatedProg);
    setProgMemberModId('');
  };

  const handleRemoveProgrammeMembership = (progId: string, modId: string) => {
    if (!onSaveProgramme) return;
    const prog = programmes.find(p => p.id === progId);
    if (!prog) return;

    const mod = modules.find(m => m.id === modId);
    const modLabel = mod ? `[${mod.code}] ${mod.title}` : modId;

    if (window.confirm(`Remove ${modLabel} from programme "${prog.name}"? The module will not be deleted.`)) {
      const updatedProg: Programme = {
        ...prog,
        moduleIds: prog.moduleIds.filter(id => id !== modId)
      };
      onSaveProgramme(updatedProg);
    }
  };

  // Color-coded badge helper for relationship type
  const getTypeBadgeClass = (type: RelationshipType) => {
    switch (type) {
      case 'aligns':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assesses':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'develops':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'prerequisite':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="relationship-editor-workspace">
      {/* 1. Header Overview & Stats */}
      <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>🔗</span> Curriculum Relationships & Alignments
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect modules to learning outcomes, evaluate outcomes with assessments, track skill development, and establish prerequisite pathways.
            </p>
          </div>
          <button
            type="button"
            id="btn-create-relationship"
            className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
            onClick={handleStartCreate}
          >
            <span>➕</span> New Relationship
          </button>
        </div>

        {/* Breakdown Badges */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
            Total Active Links: <strong>{relationships.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            Alignments: <strong>{relationships.filter(r => r.type === 'aligns').length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            Assessment Mappings: <strong>{relationships.filter(r => r.type === 'assesses').length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            Skill Developments: <strong>{relationships.filter(r => r.type === 'develops').length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            Prerequisites: <strong>{relationships.filter(r => r.type === 'prerequisite').length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            Programme Members: <strong>{programmes.reduce((sum, p) => sum + p.moduleIds.length, 0)}</strong>
          </span>
        </div>
      </div>

      {/* 2. Master-Detail Layout */}
      <div className="authoring-master-detail grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Pane: Filter & Relationship List (5 cols) */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col max-h-[680px]">
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              type="button"
              id="rel-filter-all"
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setFilterType('all')}
            >
              All Links ({relationships.length})
            </button>
            <button
              type="button"
              id="rel-filter-aligns"
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterType === 'aligns' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              onClick={() => setFilterType('aligns')}
            >
              Alignments
            </button>
            <button
              type="button"
              id="rel-filter-assesses"
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterType === 'assesses' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
              onClick={() => setFilterType('assesses')}
            >
              Assesses
            </button>
            <button
              type="button"
              id="rel-filter-develops"
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterType === 'develops' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
              onClick={() => setFilterType('develops')}
            >
              Develops
            </button>
            <button
              type="button"
              id="rel-filter-prerequisite"
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterType === 'prerequisite' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
              onClick={() => setFilterType('prerequisite')}
            >
              Prerequisites
            </button>
            <button
              type="button"
              id="rel-filter-pm"
              className={`px-2 py-1 text-xs font-semibold rounded ${
                filterType === 'programme_membership' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
              onClick={() => setFilterType('programme_membership')}
            >
              Programmes
            </button>
          </div>

          {/* Search Box */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control text-xs"
              placeholder="Search by module code, outcome, or title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* List Section */}
          <div className="entity-list flex-1 overflow-y-auto space-y-2 pr-1">
            {filterType === 'programme_membership' ? (
              // Programme Membership View
              programmes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
                  No programmes defined. Create a programme in the Programmes tab first.
                </div>
              ) : (
                programmes.map(prog => (
                  <div key={prog.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="font-bold text-slate-800 text-sm mb-1.5 flex items-center justify-between">
                      <span>🎓 {prog.name}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-200">
                        {prog.moduleIds.length} modules
                      </span>
                    </div>
                    {prog.moduleIds.length === 0 ? (
                      <p className="text-slate-400 italic">No modules associated yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {prog.moduleIds.map(mId => {
                          const m = modules.find(x => x.id === mId);
                          return (
                            <div key={mId} className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-100">
                              <span className="font-medium">{m ? `[${m.code}] ${m.title}` : mId}</span>
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700 text-[10px] font-semibold"
                                onClick={() => handleRemoveProgrammeMembership(prog.id, mId)}
                                title="Remove from programme"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )
            ) : filteredRelationships.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
                {searchQuery ? 'No relationships match your search query.' : 'No relationships found in this category. Click "+ New Relationship" to create one.'}
              </div>
            ) : (
              filteredRelationships.map(rel => {
                const isSelected = selectedRelId === rel.id && !isCreating;
                const source = getEntityDisplay(dataset, rel.sourceType, rel.sourceId);
                const target = getEntityDisplay(dataset, rel.targetType, rel.targetId);
                const def = RELATIONSHIP_TYPE_DEFINITIONS[rel.type];

                return (
                  <div
                    key={rel.id}
                    className={`entity-item-card p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleSelectRelationship(rel)}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(rel.type)}`}>
                        {def?.label || rel.type}
                      </span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 text-[11px] font-medium px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                        onClick={e => {
                          e.stopPropagation();
                          handleUnlink(rel.id);
                        }}
                        title="Unlink relationship"
                      >
                        ✕ Unlink
                      </button>
                    </div>

                    <div className="text-xs text-slate-700">
                      <div className="font-semibold text-slate-900 truncate" title={source.full}>
                        {source.full}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 my-0.5">
                        <span>↳</span>
                        <span className="italic">{def?.verb || 'relates to'}</span>
                      </div>
                      <div className="font-semibold text-slate-900 truncate" title={target.full}>
                        {target.full}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Creation Form or Inspection Details (7 cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {filterType === 'programme_membership' ? (
            // Quick Module Membership Association Form
            <div>
              <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                <span>🎓</span> Add Module to Programme
              </h3>
              <form onSubmit={handleAddProgrammeMembership} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="pm-prog">Select Target Programme</label>
                  <select
                    id="pm-prog"
                    className="form-control"
                    value={progMemberProgId}
                    onChange={e => setProgMemberProgId(e.target.value)}
                    required
                  >
                    <option value="">Choose programme...</option>
                    {programmes.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="pm-mod">Select Course Module</label>
                  <select
                    id="pm-mod"
                    className="form-control"
                    value={progMemberModId}
                    onChange={e => setProgMemberModId(e.target.value)}
                    required
                  >
                    <option value="">Choose module to add...</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>[{m.code}] {m.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!progMemberProgId || !progMemberModId}
                >
                  Add Module to Programme
                </button>
              </form>
            </div>
          ) : isCreating ? (
            // Creation Form
            <form onSubmit={handleSaveRelationship} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  Create New Curriculum Relationship
                </h3>
                <button
                  type="button"
                  className="btn btn-outline btn-sm text-slate-500"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  ⚠️ {validationError}
                </div>
              )}

              {/* Step 1: Select Type */}
              <div className="form-group">
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  1. Relationship Classification <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(RELATIONSHIP_TYPE_DEFINITIONS) as RelationshipType[]).map(t => {
                    const def = RELATIONSHIP_TYPE_DEFINITIONS[t];
                    const isSelected = relType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-400'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => handleTypeChange(t)}
                      >
                        <div className="font-bold text-slate-900 mb-0.5">{def.label}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2">{def.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Source */}
              <div className="form-group">
                <label htmlFor="rel-source" className="text-xs font-bold text-slate-700 mb-1 block">
                  2. {typeDef.sourceLabel} (Source) <span className="text-red-500">*</span>
                </label>
                <select
                  id="rel-source"
                  className="form-control text-xs"
                  value={sourceId}
                  onChange={e => {
                    setSourceId(e.target.value);
                    setValidationError(null);
                  }}
                  required
                >
                  <option value="">Select source entity...</option>
                  {availableSources.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
                {availableSources.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No available {typeDef.sourceLabel.toLowerCase()} entities found. Create entities in earlier Build tabs first.
                  </p>
                )}
              </div>

              {/* Step 3: Select Target */}
              <div className="form-group">
                <label htmlFor="rel-target" className="text-xs font-bold text-slate-700 mb-1 block">
                  3. {typeDef.targetLabel} (Target) <span className="text-red-500">*</span>
                </label>
                <select
                  id="rel-target"
                  className="form-control text-xs"
                  value={targetId}
                  onChange={e => {
                    setTargetId(e.target.value);
                    setValidationError(null);
                  }}
                  required
                >
                  <option value="">Select target entity...</option>
                  {availableTargets.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                {availableTargets.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No available {typeDef.targetLabel.toLowerCase()} entities found. Create entities in earlier Build tabs first.
                  </p>
                )}
              </div>

              {/* Live Preview Card */}
              {sourceId && targetId && (
                <div className={`p-3 rounded-lg border text-xs ${
                  liveValidation?.isValid
                    ? 'bg-blue-50/60 border-blue-200'
                    : 'bg-red-50/70 border-red-300'
                }`}>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Educational Link Statement Preview:
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap font-medium text-slate-800">
                    <span className="font-bold text-blue-900">{getEntityDisplay(dataset, typeDef.sourceType, sourceId).full}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-300 text-slate-600">
                      {typeDef.verb}
                    </span>
                    <span className="font-bold text-emerald-900">{getEntityDisplay(dataset, typeDef.targetType, targetId).full}</span>
                  </div>

                  {!liveValidation?.isValid && liveValidation?.error && (
                    <div className="mt-2 text-xs font-semibold text-red-700 flex items-center gap-1">
                      <span>⚠️</span> {liveValidation.error}
                    </div>
                  )}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!sourceId || !targetId || liveValidation?.isValid === false}
                >
                  Create Relationship
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : activeRelationship ? (
            // Inspection View for Active Relationship
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>Inspection:</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getTypeBadgeClass(activeRelationship.type)}`}>
                    {RELATIONSHIP_TYPE_DEFINITIONS[activeRelationship.type]?.label || activeRelationship.type}
                  </span>
                </h3>
                <button
                  type="button"
                  id="btn-unlink-relationship"
                  className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 btn-sm"
                  onClick={() => handleUnlink(activeRelationship.id)}
                  title="Remove relationship without deleting linked entities"
                >
                  🗑️ Unlink Relationship
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Educational Meaning</div>
                  <p className="text-slate-700 mt-0.5">
                    {RELATIONSHIP_TYPE_DEFINITIONS[activeRelationship.type]?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Source Entity ({activeRelationship.sourceType})
                    </span>
                    <span className="font-bold text-slate-900 block text-sm">
                      {getEntityDisplay(dataset, activeRelationship.sourceType, activeRelationship.sourceId).full}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {activeRelationship.sourceId}</span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Target Entity ({activeRelationship.targetType})
                    </span>
                    <span className="font-bold text-slate-900 block text-sm">
                      {getEntityDisplay(dataset, activeRelationship.targetType, activeRelationship.targetId).full}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {activeRelationship.targetId}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 text-[11px]">
                  <span>Relationship ID: <code className="font-mono text-slate-700">{activeRelationship.id}</code></span>
                  <span>Safe unlinking preserves both source and target entities.</span>
                </div>
              </div>
            </div>
          ) : (
            // Default Empty Selection State
            <div className="p-10 text-center text-slate-400">
              <div className="text-3xl mb-2">🔗</div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">No Relationship Selected</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Select an existing link on the left to inspect and manage it, or click "+ New Relationship" to connect curriculum entities.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleStartCreate}
              >
                ➕ Create Relationship
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipEditor;
