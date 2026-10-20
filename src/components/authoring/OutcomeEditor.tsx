import React, { useState, useMemo } from 'react';
import type { MappingDataset, LearningOutcome } from '../../types';
import { generateEntityId } from '../../lib/data/idGenerator';
import { getOutcomeDeletionImpact } from '../../lib/data/safeDeletion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface OutcomeEditorProps {
  dataset: MappingDataset;
  onSaveOutcome: (outcome: LearningOutcome) => void;
  onDeleteOutcome: (outcomeId: string) => void;
}

const OutcomeEditor: React.FC<OutcomeEditorProps> = ({
  dataset,
  onSaveOutcome,
  onDeleteOutcome
}) => {
  const outcomes = dataset.outcomes;
  const modules = dataset.modules;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Form State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [moduleId, setModuleId] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [outcomeToDelete, setOutcomeToDelete] = useState<LearningOutcome | null>(null);

  const filteredOutcomes = useMemo(() => {
    return outcomes.filter(o => {
      const matchesSearch =
        o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = moduleFilter === 'all'
        ? true
        : moduleFilter === 'unassigned'
          ? !o.moduleId
          : o.moduleId === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [outcomes, searchQuery, moduleFilter]);

  const activeOutcome = useMemo(() => {
    return outcomes.find(o => o.id === selectedId) || null;
  }, [outcomes, selectedId]);

  const startCreate = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and create new outcome?')) {
      return;
    }
    setSelectedId(null);
    setIsCreating(true);
    setCode('');
    setDescription('');
    setModuleId(modules.length > 0 ? modules[0].id : '');
    setValidationError(null);
    setIsDirty(false);
  };

  const selectForEdit = (o: LearningOutcome) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and select another outcome?')) {
      return;
    }
    setSelectedId(o.id);
    setIsCreating(false);
    setCode(o.code);
    setDescription(o.description);
    setModuleId(o.moduleId || '');
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
    } else if (activeOutcome) {
      setCode(activeOutcome.code);
      setDescription(activeOutcome.description);
      setModuleId(activeOutcome.moduleId || '');
    }
    setValidationError(null);
    setIsDirty(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedDesc = description.trim();

    if (!trimmedCode) {
      setValidationError('Outcome code is required.');
      return;
    }

    if (!trimmedDesc) {
      setValidationError('Outcome description is required.');
      return;
    }

    const existingIds = new Set(outcomes.map(o => o.id));
    const outcomeId = isCreating
      ? generateEntityId('lo', existingIds)
      : (selectedId as string);

    const updatedOutcome: LearningOutcome = {
      id: outcomeId,
      code: trimmedCode,
      description: trimmedDesc,
      moduleId: moduleId ? moduleId : undefined
    };

    onSaveOutcome(updatedOutcome);
    setIsDirty(false);
    setValidationError(null);
    setIsCreating(false);
    setSelectedId(outcomeId);
  };

  const promptDelete = (o: LearningOutcome) => {
    setOutcomeToDelete(o);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!outcomeToDelete) return;
    onDeleteOutcome(outcomeToDelete.id);
    setDeleteModalOpen(false);
    if (selectedId === outcomeToDelete.id) {
      setSelectedId(null);
      setIsCreating(false);
      setIsDirty(false);
    }
    setOutcomeToDelete(null);
  };

  const deletionImpact = useMemo(() => {
    if (!outcomeToDelete) return null;
    return getOutcomeDeletionImpact(dataset, outcomeToDelete.id);
  }, [dataset, outcomeToDelete]);

  // Find all modules aligned to active outcome via relationships
  const alignedModules = useMemo(() => {
    if (!activeOutcome) return [];
    const alignedModuleIds = new Set(
      dataset.relationships
        .filter(r => r.type === 'aligns' && r.targetId === activeOutcome.id && r.sourceType === 'module')
        .map(r => r.sourceId)
    );
    return modules.filter(m => alignedModuleIds.has(m.id));
  }, [dataset.relationships, modules, activeOutcome]);

  const assessingAssessments = useMemo(() => {
    if (!activeOutcome) return [];
    const assessmentIds = new Set(
      dataset.relationships
        .filter(r => r.type === 'assesses' && r.targetId === activeOutcome.id && r.sourceType === 'assessment')
        .map(r => r.sourceId)
    );
    return dataset.assessments.filter(a => assessmentIds.has(a.id));
  }, [dataset.relationships, dataset.assessments, activeOutcome]);

  return (
    <div className="authoring-container">
      <div className="authoring-layout grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Pane: Master List */}
        <div className="authoring-list-pane bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Learning Outcomes ({outcomes.length})
              </h3>
              <p className="text-xs text-slate-500">Pedagogical goals and observable criteria.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={startCreate}
            >
              <span>➕</span> New Outcome
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="form-control text-xs flex-1"
              placeholder="Search outcome code or text..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className="form-control text-xs w-36"
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
            >
              <option value="all">All Modules</option>
              <option value="unassigned">Unassigned</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>[{m.code}] {m.title}</option>
              ))}
            </select>
          </div>

          <div className="entity-list flex-1 overflow-y-auto space-y-2 max-h-[500px]">
            {filteredOutcomes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
                {searchQuery ? 'No outcomes match your filter.' : 'No outcomes created yet. Click "New Outcome" to begin.'}
              </div>
            ) : (
              filteredOutcomes.map(o => {
                const isSelected = selectedId === o.id && !isCreating;
                const parentModule = modules.find(m => m.id === o.moduleId);
                return (
                  <div
                    key={o.id}
                    className={`entity-item-card p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => selectForEdit(o)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                        {o.code}
                      </span>
                      {parentModule ? (
                        <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {parentModule.code}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          Shared / Unassigned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 mt-1">{o.description}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Detail / Editing Form */}
        <div className="authoring-detail-pane bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {isCreating || activeOutcome ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  {isCreating ? 'Create Learning Outcome' : `Edit Outcome: [${activeOutcome?.code}]`}
                </h3>
                {!isCreating && activeOutcome && (
                  <button
                    type="button"
                    className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 btn-sm"
                    onClick={() => promptDelete(activeOutcome)}
                    title="Safely delete this learning outcome"
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
                  <label htmlFor="lo-code">
                    Outcome Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lo-code"
                    type="text"
                    className="form-control font-mono uppercase"
                    placeholder="e.g. LO1"
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
                  <label htmlFor="lo-module">
                    Primary Module
                  </label>
                  <select
                    id="lo-module"
                    className="form-control"
                    value={moduleId}
                    onChange={e => {
                      setModuleId(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    <option value="">None (Shared / Programme-level)</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.code}] {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="lo-desc">
                  Outcome Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="lo-desc"
                  className="form-control"
                  rows={3}
                  placeholder="Articulate what students should understand, evaluate, or be able to demonstrate..."
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                    setValidationError(null);
                  }}
                  required
                />
              </div>

              {/* Connected Context View */}
              {!isCreating && activeOutcome && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="font-semibold text-slate-700">Relational Connections</div>
                  <div className="flex flex-col gap-1">
                    <div className="text-slate-600">
                      <strong>Aligned Modules:</strong> {alignedModules.length > 0 ? alignedModules.map(m => m.code).join(', ') : 'None mapped via relationship edges'}
                    </div>
                    <div className="text-slate-600">
                      <strong>Assessing Components:</strong> {assessingAssessments.length > 0 ? assessingAssessments.map(a => a.title).join(', ') : 'No formal assessment mapped'}
                    </div>
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
                  {isCreating ? 'Create Outcome' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-bold text-slate-600 text-sm mb-1">Outcome Details</h4>
              <p className="text-xs max-w-xs text-slate-400 mb-4">
                Select an existing outcome to view or update its articulation, or click "New Outcome" to formulate a new educational objective.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={startCreate}
              >
                ➕ Create Outcome
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        entityType="Learning Outcome"
        entityName={outcomeToDelete ? `${outcomeToDelete.code}: ${outcomeToDelete.description.substring(0, 30)}...` : ''}
        impactMessage={deletionImpact?.summaryMessage || ''}
        hasDependencies={deletionImpact?.hasDependencies || false}
        onCancel={() => {
          setDeleteModalOpen(false);
          setOutcomeToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default OutcomeEditor;
