import React, { useState, useMemo } from 'react';
import type { MappingDataset, Assessment } from '../../types';
import { generateEntityId } from '../../lib/data/idGenerator';
import { getAssessmentDeletionImpact } from '../../lib/data/safeDeletion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface AssessmentEditorProps {
  dataset: MappingDataset;
  onSaveAssessment: (assessment: Assessment) => void;
  onDeleteAssessment: (assessmentId: string) => void;
}

const COMMON_ASSESSMENT_TYPES = [
  'Coursework',
  'Written Examination',
  'Practical Examination',
  'Presentation',
  'Portfolio',
  'Laboratory Report',
  'Dissertation / Project',
  'In-Class Test',
  'Oral Examination'
];

const AssessmentEditor: React.FC<AssessmentEditorProps> = ({
  dataset,
  onSaveAssessment,
  onDeleteAssessment
}) => {
  const assessments = dataset.assessments;
  const modules = dataset.modules;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Coursework');
  const [customType, setCustomType] = useState('');
  const [weight, setWeight] = useState<number>(50);
  const [moduleId, setModuleId] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = moduleFilter === 'all'
        ? true
        : moduleFilter === 'unassigned'
          ? !a.moduleId
          : a.moduleId === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [assessments, searchQuery, moduleFilter]);

  const activeAssessment = useMemo(() => {
    return assessments.find(a => a.id === selectedId) || null;
  }, [assessments, selectedId]);

  const startCreate = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and create new assessment?')) {
      return;
    }
    setSelectedId(null);
    setIsCreating(true);
    setTitle('');
    setType('Coursework');
    setCustomType('');
    setWeight(50);
    setModuleId(modules.length > 0 ? modules[0].id : '');
    setValidationError(null);
    setIsDirty(false);
  };

  const selectForEdit = (a: Assessment) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and select another assessment?')) {
      return;
    }
    setSelectedId(a.id);
    setIsCreating(false);
    setTitle(a.title);
    if (COMMON_ASSESSMENT_TYPES.includes(a.type)) {
      setType(a.type);
      setCustomType('');
    } else {
      setType('Other');
      setCustomType(a.type);
    }
    setWeight(a.weight);
    setModuleId(a.moduleId || '');
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
    } else if (activeAssessment) {
      setTitle(activeAssessment.title);
      if (COMMON_ASSESSMENT_TYPES.includes(activeAssessment.type)) {
        setType(activeAssessment.type);
        setCustomType('');
      } else {
        setType('Other');
        setCustomType(activeAssessment.type);
      }
      setWeight(activeAssessment.weight);
      setModuleId(activeAssessment.moduleId || '');
    }
    setValidationError(null);
    setIsDirty(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const finalType = type === 'Other' ? customType.trim() : type;

    if (!trimmedTitle) {
      setValidationError('Assessment title is required.');
      return;
    }

    if (!finalType) {
      setValidationError('Assessment type is required.');
      return;
    }

    if (weight < 0 || weight > 100) {
      setValidationError('Weighting must be between 0% and 100%.');
      return;
    }

    const existingIds = new Set(assessments.map(a => a.id));
    const assessmentId = isCreating
      ? generateEntityId('a', existingIds)
      : (selectedId as string);

    const updatedAssessment: Assessment = {
      id: assessmentId,
      title: trimmedTitle,
      type: finalType,
      weight: Number(weight),
      moduleId: moduleId ? moduleId : undefined
    };

    onSaveAssessment(updatedAssessment);
    setIsDirty(false);
    setValidationError(null);
    setIsCreating(false);
    setSelectedId(assessmentId);
  };

  const promptDelete = (a: Assessment) => {
    setAssessmentToDelete(a);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!assessmentToDelete) return;
    onDeleteAssessment(assessmentToDelete.id);
    setDeleteModalOpen(false);
    if (selectedId === assessmentToDelete.id) {
      setSelectedId(null);
      setIsCreating(false);
      setIsDirty(false);
    }
    setAssessmentToDelete(null);
  };

  const deletionImpact = useMemo(() => {
    if (!assessmentToDelete) return null;
    return getAssessmentDeletionImpact(dataset, assessmentToDelete.id);
  }, [dataset, assessmentToDelete]);

  const mappedOutcomes = useMemo(() => {
    if (!activeAssessment) return [];
    const outcomeIds = new Set(
      dataset.relationships
        .filter(r => r.type === 'assesses' && r.sourceId === activeAssessment.id)
        .map(r => r.targetId)
    );
    return dataset.outcomes.filter(o => outcomeIds.has(o.id));
  }, [dataset.relationships, dataset.outcomes, activeAssessment]);

  return (
    <div className="authoring-container">
      <div className="authoring-layout grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Pane: Master List */}
        <div className="authoring-list-pane bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Assessments ({assessments.length})
              </h3>
              <p className="text-xs text-slate-500">Evidence and evaluative components.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={startCreate}
            >
              <span>➕</span> New Assessment
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="form-control text-xs flex-1"
              placeholder="Search assessment title or type..."
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
            {filteredAssessments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
                {searchQuery ? 'No assessments match your filter.' : 'No assessments created yet. Click "New Assessment" to begin.'}
              </div>
            ) : (
              filteredAssessments.map(a => {
                const isSelected = selectedId === a.id && !isCreating;
                const parentModule = modules.find(m => m.id === a.moduleId);
                return (
                  <div
                    key={a.id}
                    className={`entity-item-card p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => selectForEdit(a)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm truncate max-w-[200px]" title={a.title}>
                        {a.title}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {a.weight}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                      <span>{a.type}</span>
                      {parentModule ? (
                        <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                          {parentModule.code}
                        </span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Detail / Editing Form */}
        <div className="authoring-detail-pane bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {isCreating || activeAssessment ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  {isCreating ? 'Create Assessment' : `Edit Assessment: ${activeAssessment?.title}`}
                </h3>
                {!isCreating && activeAssessment && (
                  <button
                    type="button"
                    className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 btn-sm"
                    onClick={() => promptDelete(activeAssessment)}
                    title="Safely delete this assessment"
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
                <label htmlFor="asmt-title">
                  Assessment Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="asmt-title"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Epidemiology Analysis Report"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                    setValidationError(null);
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label htmlFor="asmt-type">
                    Assessment Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="asmt-type"
                    className="form-control"
                    value={type}
                    onChange={e => {
                      setType(e.target.value);
                      setIsDirty(true);
                    }}
                  >
                    {COMMON_ASSESSMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Other">Other (Custom type)...</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="asmt-weight">
                    Weighting (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="asmt-weight"
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={weight}
                    onChange={e => {
                      setWeight(Number(e.target.value));
                      setIsDirty(true);
                      setValidationError(null);
                    }}
                    required
                  />
                </div>
              </div>

              {type === 'Other' && (
                <div className="form-group">
                  <label htmlFor="asmt-custom-type">
                    Custom Type Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="asmt-custom-type"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Simulation Lab, Objective Structured Exam"
                    value={customType}
                    onChange={e => {
                      setCustomType(e.target.value);
                      setIsDirty(true);
                    }}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="asmt-module">Associated Module</label>
                <select
                  id="asmt-module"
                  className="form-control"
                  value={moduleId}
                  onChange={e => {
                    setModuleId(e.target.value);
                    setIsDirty(true);
                  }}
                >
                  <option value="">None (Programme-level assessment)</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.code}] {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mapped Outcomes Context View */}
              {!isCreating && activeAssessment && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="font-semibold text-slate-700">Mapped Learning Outcomes ({mappedOutcomes.length})</div>
                  {mappedOutcomes.length === 0 ? (
                    <p className="text-slate-400 text-[11px]">
                      No learning outcomes currently mapped to this assessment.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mappedOutcomes.map(o => (
                        <span key={o.id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {o.code}
                        </span>
                      ))}
                    </div>
                  )}
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
                  {isCreating ? 'Create Assessment' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">📝</div>
              <h4 className="font-bold text-slate-600 text-sm mb-1">Assessment Details</h4>
              <p className="text-xs max-w-xs text-slate-400 mb-4">
                Select an existing assessment to configure its weighting and module, or click "New Assessment" to add an evaluative component.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={startCreate}
              >
                ➕ Create Assessment
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        entityType="Assessment"
        entityName={assessmentToDelete ? `${assessmentToDelete.title} (${assessmentToDelete.weight}%)` : ''}
        impactMessage={deletionImpact?.summaryMessage || ''}
        hasDependencies={deletionImpact?.hasDependencies || false}
        onCancel={() => {
          setDeleteModalOpen(false);
          setAssessmentToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AssessmentEditor;
