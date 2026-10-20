import React, { useState, useMemo } from 'react';
import type { MappingDataset, Programme } from '../../types';
import { generateEntityId } from '../../lib/data/idGenerator';
import { getProgrammeDeletionImpact } from '../../lib/data/safeDeletion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface ProgrammeEditorProps {
  dataset: MappingDataset;
  onSaveProgramme: (programme: Programme) => void;
  onDeleteProgramme: (programmeId: string) => void;
}

const ProgrammeEditor: React.FC<ProgrammeEditorProps> = ({
  dataset,
  onSaveProgramme,
  onDeleteProgramme
}) => {
  const programmes = useMemo(() => dataset.programmes || [], [dataset.programmes]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [programmeToDelete, setProgrammeToDelete] = useState<Programme | null>(null);

  const filteredProgrammes = useMemo(() => {
    return programmes.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [programmes, searchQuery]);

  const activeProgramme = useMemo(() => {
    return programmes.find(p => p.id === selectedId) || null;
  }, [programmes, selectedId]);

  const startCreate = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and create new programme?')) {
      return;
    }
    setSelectedId(null);
    setIsCreating(true);
    setName('');
    setDescription('');
    setSelectedModuleIds([]);
    setValidationError(null);
    setIsDirty(false);
  };

  const selectForEdit = (prog: Programme) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and select another programme?')) {
      return;
    }
    setSelectedId(prog.id);
    setIsCreating(false);
    setName(prog.name);
    setDescription(prog.description || '');
    setSelectedModuleIds([...(prog.moduleIds || [])]);
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
    } else if (activeProgramme) {
      setName(activeProgramme.name);
      setDescription(activeProgramme.description || '');
      setSelectedModuleIds([...(activeProgramme.moduleIds || [])]);
    }
    setValidationError(null);
    setIsDirty(false);
  };

  const toggleModule = (moduleId: string) => {
    setIsDirty(true);
    setSelectedModuleIds(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationError('Programme name is required.');
      return;
    }

    // Duplicate check
    const isDuplicate = programmes.some(p =>
      p.name.toLowerCase() === trimmedName.toLowerCase() &&
      p.id !== (isCreating ? '' : selectedId)
    );

    if (isDuplicate) {
      setValidationError(`A programme named "${trimmedName}" already exists.`);
      return;
    }

    const existingIds = new Set(programmes.map(p => p.id));
    const programmeId = isCreating
      ? generateEntityId('prog', existingIds)
      : (selectedId as string);

    const updatedProgramme: Programme = {
      id: programmeId,
      name: trimmedName,
      description: description.trim() || undefined,
      moduleIds: selectedModuleIds
    };

    onSaveProgramme(updatedProgramme);
    setIsDirty(false);
    setValidationError(null);
    setIsCreating(false);
    setSelectedId(programmeId);
  };

  const promptDelete = (prog: Programme) => {
    setProgrammeToDelete(prog);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!programmeToDelete) return;
    onDeleteProgramme(programmeToDelete.id);
    setDeleteModalOpen(false);
    if (selectedId === programmeToDelete.id) {
      setSelectedId(null);
      setIsCreating(false);
      setIsDirty(false);
    }
    setProgrammeToDelete(null);
  };

  const deletionImpact = useMemo(() => {
    if (!programmeToDelete) return null;
    return getProgrammeDeletionImpact(dataset, programmeToDelete.id);
  }, [dataset, programmeToDelete]);

  const filteredAvailableModules = useMemo(() => {
    return dataset.modules.filter(m =>
      m.code.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(moduleSearchQuery.toLowerCase())
    );
  }, [dataset.modules, moduleSearchQuery]);

  return (
    <div className="authoring-container">
      <div className="authoring-layout grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Pane: Master List */}
        <div className="authoring-list-pane bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Programmes & Diets ({programmes.length})
              </h3>
              <p className="text-xs text-slate-500">Degree structures and modular diets.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={startCreate}
            >
              <span>➕</span> New Programme
            </button>
          </div>

          <div className="mb-3">
            <input
              type="text"
              className="form-control text-xs"
              placeholder="Search programmes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="entity-list flex-1 overflow-y-auto space-y-2 max-h-[500px]">
            {filteredProgrammes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
                {searchQuery ? 'No programmes match your search.' : 'No programmes defined yet. Click "New Programme" to begin.'}
              </div>
            ) : (
              filteredProgrammes.map(prog => {
                const isSelected = selectedId === prog.id && !isCreating;
                const modCount = prog.moduleIds ? prog.moduleIds.length : 0;
                return (
                  <div
                    key={prog.id}
                    className={`entity-item-card p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => selectForEdit(prog)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm">{prog.name}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {modCount} {modCount === 1 ? 'module' : 'modules'}
                      </span>
                    </div>
                    {prog.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{prog.description}</p>
                    )}
                    <div className="text-[10px] font-mono text-slate-400">ID: {prog.id}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Detail / Editing Form */}
        <div className="authoring-detail-pane bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {isCreating || activeProgramme ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  {isCreating ? 'Create Programme' : `Edit Programme: ${activeProgramme?.name}`}
                </h3>
                {!isCreating && activeProgramme && (
                  <button
                    type="button"
                    className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 btn-sm"
                    onClick={() => promptDelete(activeProgramme)}
                    title="Safely delete this programme"
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

              <div className="form-group">
                <label htmlFor="prog-name">
                  Programme Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="prog-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. BSc Public Health & Epidemiology"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setIsDirty(true);
                    setValidationError(null);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prog-desc">Description</label>
                <textarea
                  id="prog-desc"
                  className="form-control"
                  rows={2}
                  placeholder="Optional degree summary or accreditation notes..."
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              {/* Module Associations Checklist */}
              <div className="form-group">
                <div className="flex justify-between items-center mb-1">
                  <label>
                    Associated Modules ({selectedModuleIds.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Modules can be shared across programmes
                  </span>
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control text-xs"
                    placeholder="Filter available modules..."
                    value={moduleSearchQuery}
                    onChange={e => setModuleSearchQuery(e.target.value)}
                  />
                </div>

                <div className="module-checklist max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {dataset.modules.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">
                      No modules exist yet. Create modules in the Modules tab to associate them.
                    </p>
                  ) : filteredAvailableModules.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">
                      No modules match your search filter.
                    </p>
                  ) : (
                    filteredAvailableModules.map(m => {
                      const isChecked = selectedModuleIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors text-xs ${
                            isChecked ? 'bg-blue-50/80 font-medium text-blue-900' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleModule(m.id)}
                            className="rounded border-slate-300"
                          />
                          <span className="font-mono text-[11px] font-bold text-slate-600">[{m.code}]</span>
                          <span className="flex-1 truncate">{m.title}</span>
                          <span className="text-[10px] text-slate-400">L{m.level} · {m.credits}cr</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

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
                  {isCreating ? 'Create Programme' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">🎓</div>
              <h4 className="font-bold text-slate-600 text-sm mb-1">Programme Details</h4>
              <p className="text-xs max-w-xs text-slate-400 mb-4">
                Select an existing programme to inspect and edit its details, or click "New Programme" to define a new degree structure.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={startCreate}
              >
                ➕ Create Programme
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        entityType="Programme"
        entityName={programmeToDelete?.name || ''}
        impactMessage={deletionImpact?.summaryMessage || ''}
        hasDependencies={deletionImpact?.hasDependencies || false}
        onCancel={() => {
          setDeleteModalOpen(false);
          setProgrammeToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ProgrammeEditor;
