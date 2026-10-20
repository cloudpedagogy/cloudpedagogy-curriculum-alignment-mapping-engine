import React, { useState, useMemo } from 'react';
import type { MappingDataset, Module } from '../../types';
import { generateEntityId } from '../../lib/data/idGenerator';
import { getModuleDeletionImpact } from '../../lib/data/safeDeletion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ModuleEditorProps {
  dataset: MappingDataset;
  onSaveModule: (module: Module, programmeIds?: string[]) => void;
  onDeleteModule: (moduleId: string) => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({
  dataset,
  onSaveModule,
  onDeleteModule
}) => {
  const modules = dataset.modules;
  const programmes = useMemo(() => dataset.programmes || [], [dataset.programmes]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('4');
  const [credits, setCredits] = useState(15);
  const [description, setDescription] = useState('');
  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);

  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch =
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLevel = levelFilter === 'all' || m.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [modules, searchQuery, levelFilter]);

  const activeModule = useMemo(() => {
    return modules.find(m => m.id === selectedId) || null;
  }, [modules, selectedId]);

  const getModuleProgrammeIds = (modId: string): string[] => {
    return programmes.filter(p => (p.moduleIds || []).includes(modId)).map(p => p.id);
  };

  const startCreate = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and create new module?')) {
      return;
    }
    setSelectedId(null);
    setIsCreating(true);
    setCode('');
    setTitle('');
    setLevel('4');
    setCredits(15);
    setDescription('');
    setSelectedProgrammeIds([]);
    setValidationError(null);
    setIsDirty(false);
  };

  const selectForEdit = (m: Module) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and select another module?')) {
      return;
    }
    setSelectedId(m.id);
    setIsCreating(false);
    setCode(m.code);
    setTitle(m.title);
    setLevel(m.level);
    setCredits(m.credits);
    setDescription(m.description || '');
    setSelectedProgrammeIds(getModuleProgrammeIds(m.id));
    setValidationError(null);
    setIsDirty(false);
  };

  const cancelEdit = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    if (isCreating) {
      setIsCreating(false);
      setSelectedId(null);
    } else if (activeModule) {
      setCode(activeModule.code);
      setTitle(activeModule.title);
      setLevel(activeModule.level);
      setCredits(activeModule.credits);
      setDescription(activeModule.description || '');
      setSelectedProgrammeIds(getModuleProgrammeIds(activeModule.id));
    }
    setValidationError(null);
    setIsDirty(false);
  };

  const toggleProgramme = (progId: string) => {
    setIsDirty(true);
    setSelectedProgrammeIds(prev =>
      prev.includes(progId) ? prev.filter(id => id !== progId) : [...prev, progId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedTitle = title.trim();

    if (!trimmedCode) {
      setValidationError('Module code is required.');
      return;
    }

    if (!trimmedTitle) {
      setValidationError('Module title is required.');
      return;
    }

    if (credits < 0) {
      setValidationError('Credits must be a non-negative number.');
      return;
    }

    // Code uniqueness check
    const isDuplicate = modules.some(m =>
      m.code.toUpperCase() === trimmedCode &&
      m.id !== (isCreating ? '' : selectedId)
    );

    if (isDuplicate) {
      setValidationError(`A module with code "${trimmedCode}" already exists.`);
      return;
    }

    const existingIds = new Set(modules.map(m => m.id));
    const moduleId = isCreating
      ? generateEntityId('m', existingIds)
      : (selectedId as string);

    const updatedModule: Module = {
      id: moduleId,
      code: trimmedCode,
      title: trimmedTitle,
      level,
      credits: Number(credits),
      description: description.trim() || undefined
    };

    onSaveModule(updatedModule, selectedProgrammeIds);
    setIsDirty(false);
    setValidationError(null);
    setIsCreating(false);
    setSelectedId(moduleId);
  };

  const promptDelete = (m: Module) => {
    setModuleToDelete(m);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!moduleToDelete) return;
    onDeleteModule(moduleToDelete.id);
    setDeleteModalOpen(false);
    if (selectedId === moduleToDelete.id) {
      setSelectedId(null);
      setIsCreating(false);
      setIsDirty(false);
    }
    setModuleToDelete(null);
  };

  const deletionImpact = useMemo(() => {
    if (!moduleToDelete) return null;
    return getModuleDeletionImpact(dataset, moduleToDelete.id);
  }, [dataset, moduleToDelete]);

  return (
    <div className="authoring-container">
      <div className="authoring-layout grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Pane: Master List */}
        <div className="authoring-list-pane bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Modules ({modules.length})
              </h3>
              <p className="text-xs text-slate-500">Course components and syllabus units.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={startCreate}
            >
              <span>➕</span> New Module
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="form-control text-xs flex-1"
              placeholder="Search code, title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className="form-control text-xs w-28"
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
              <option value="6">Level 6</option>
              <option value="7">Level 7</option>
            </select>
          </div>

          <div className="entity-list flex-1 overflow-y-auto space-y-2 max-h-[500px]">
            {filteredModules.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
                {searchQuery ? 'No modules match your filter.' : 'No modules created yet. Click "New Module" to begin.'}
              </div>
            ) : (
              filteredModules.map(m => {
                const isSelected = selectedId === m.id && !isCreating;
                const progCount = getModuleProgrammeIds(m.id).length;
                const outcomeCount = dataset.outcomes.filter(o => o.moduleId === m.id).length;
                return (
                  <div
                    key={m.id}
                    className={`entity-item-card p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => selectForEdit(m)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                          {m.code}
                        </span>
                        <span className="font-bold text-slate-800 text-sm truncate max-w-[200px]" title={m.title}>
                          {m.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        L{m.level} · {m.credits}cr
                      </span>
                    </div>

                    <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                      <span>{outcomeCount} {outcomeCount === 1 ? 'outcome' : 'outcomes'}</span>
                      <span>·</span>
                      <span>{progCount > 0 ? `In ${progCount} programme(s)` : 'No programme'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Detail / Editing Form */}
        <div className="authoring-detail-pane bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {isCreating || activeModule ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  {isCreating ? 'Create Module' : `Edit Module: [${activeModule?.code}]`}
                </h3>
                {!isCreating && activeModule && (
                  <button
                    type="button"
                    className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 btn-sm"
                    onClick={() => promptDelete(activeModule)}
                    title="Safely delete this module"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  ⚠️ {validationError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label htmlFor="mod-code">
                    Module Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mod-code"
                    type="text"
                    className="form-control font-mono uppercase"
                    placeholder="e.g. PH101"
                    value={code}
                    onChange={e => {
                      setCode(e.target.value);
                      setIsDirty(true);
                      setValidationError(null);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mod-level">
                    Academic Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="mod-level"
                    className="form-control"
                    value={level}
                    onChange={e => {
                      setLevel(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="4">Level 4 (CertHE / First Year)</option>
                    <option value="5">Level 5 (DipHE / Second Year)</option>
                    <option value="6">Level 6 (Bachelors / Final Year)</option>
                    <option value="7">Level 7 (Masters / Postgraduate)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="form-group col-span-2">
                  <label htmlFor="mod-title">
                    Module Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mod-title"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Foundations of Epidemiology"
                    value={title}
                    onChange={e => {
                      setTitle(e.target.value);
                      setIsDirty(true);
                      setValidationError(null);
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mod-credits">
                    Credits <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mod-credits"
                    type="number"
                    min="0"
                    step="5"
                    className="form-control"
                    value={credits}
                    onChange={e => {
                      setCredits(Number(e.target.value));
                      setIsDirty(true);
                      setValidationError(null);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mod-desc">Description</label>
                <textarea
                  id="mod-desc"
                  className="form-control"
                  rows={2}
                  placeholder="Optional module overview or syllabus summary..."
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              {/* Programme Membership Checklist */}
              {programmes.length > 0 && (
                <div className="form-group">
                  <label className="mb-1 block">Programme Membership</label>
                  <div className="border border-slate-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1 bg-slate-50">
                    {programmes.map(p => {
                      const isChecked = selectedProgrammeIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                            isChecked ? 'bg-blue-50/80 font-medium text-blue-900' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProgramme(p.id)}
                            className="rounded border-slate-300"
                          />
                          <span className="flex-1 truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                >
                  {isCreating ? 'Create Module' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">📘</div>
              <h4 className="font-bold text-slate-600 text-sm mb-1">Module Details</h4>
              <p className="text-xs max-w-xs text-slate-400 mb-4">
                Select an existing module to inspect its parameters, or click "New Module" to author a new curriculum unit.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={startCreate}
              >
                ➕ Create Module
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        entityType="Module"
        entityName={moduleToDelete ? `${moduleToDelete.code}: ${moduleToDelete.title}` : ''}
        impactMessage={deletionImpact?.summaryMessage || ''}
        hasDependencies={deletionImpact?.hasDependencies || false}
        onCancel={() => {
          setDeleteModalOpen(false);
          setModuleToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ModuleEditor;
