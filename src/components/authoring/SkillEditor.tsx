import React, { useState, useMemo } from 'react';
import type { MappingDataset, Skill } from '../../types';
import { generateEntityId } from '../../lib/data/idGenerator';
import { getSkillDeletionImpact } from '../../lib/data/safeDeletion';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface SkillEditorProps {
  dataset: MappingDataset;
  onSaveSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
}

const DEFAULT_SKILL_CATEGORIES = [
  'Technical',
  'Transferable',
  'Professional',
  'Cognitive',
  'Practical',
  'Communication',
  'Research'
];

const SkillEditor: React.FC<SkillEditorProps> = ({
  dataset,
  onSaveSkill,
  onDeleteSkill
}) => {
  const skills = dataset.skills;
  const modules = dataset.modules;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technical');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);

  // Dynamically include all categories present in the current dataset to ensure exact preservation
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_SKILL_CATEGORIES.forEach(c => set.add(c));
    skills.forEach(s => {
      if (s.category && s.category.trim()) {
        set.add(s.category.trim());
      }
    });
    return Array.from(set);
  }, [skills]);

  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [skills, searchQuery, categoryFilter]);

  const activeSkill = useMemo(() => {
    return skills.find(s => s.id === selectedId) || null;
  }, [skills, selectedId]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(skills.map(s => s.category).filter(Boolean));
    return Array.from(set);
  }, [skills]);

  const startCreate = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and create new skill?')) {
      return;
    }
    setSelectedId(null);
    setIsCreating(true);
    setName('');
    setCategory('Technical');
    setCustomCategory('');
    setDescription('');
    setValidationError(null);
    setIsDirty(false);
  };

  const selectForEdit = (s: Skill) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard and select another skill?')) {
      return;
    }
    setSelectedId(s.id);
    setIsCreating(false);
    setName(s.name);
    if (availableCategories.includes(s.category)) {
      setCategory(s.category);
      setCustomCategory('');
    } else {
      setCategory('Other');
      setCustomCategory(s.category);
    }
    setDescription(s.description || '');
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
    } else if (activeSkill) {
      setName(activeSkill.name);
      if (availableCategories.includes(activeSkill.category)) {
        setCategory(activeSkill.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(activeSkill.category);
      }
      setDescription(activeSkill.description || '');
    }
    setValidationError(null);
    setIsDirty(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    if (!trimmedName) {
      setValidationError('Skill name is required.');
      return;
    }

    if (!finalCategory) {
      setValidationError('Skill category is required.');
      return;
    }

    // Duplicate check
    const isDuplicate = skills.some(s =>
      s.name.toLowerCase() === trimmedName.toLowerCase() &&
      s.id !== (isCreating ? '' : selectedId)
    );

    if (isDuplicate) {
      setValidationError(`A skill named "${trimmedName}" already exists.`);
      return;
    }

    const existingIds = new Set(skills.map(s => s.id));
    const skillId = isCreating
      ? generateEntityId('s', existingIds)
      : (selectedId as string);

    const updatedSkill: Skill = {
      id: skillId,
      name: trimmedName,
      category: finalCategory,
      description: description.trim() || undefined
    };

    onSaveSkill(updatedSkill);
    setIsDirty(false);
    setValidationError(null);
    setIsCreating(false);
    setSelectedId(skillId);
  };

  const promptDelete = (s: Skill) => {
    setSkillToDelete(s);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!skillToDelete) return;
    onDeleteSkill(skillToDelete.id);
    setDeleteModalOpen(false);
    if (selectedId === skillToDelete.id) {
      setSelectedId(null);
      setIsCreating(false);
      setIsDirty(false);
    }
    setSkillToDelete(null);
  };

  const deletionImpact = useMemo(() => {
    if (!skillToDelete) return null;
    return getSkillDeletionImpact(dataset, skillToDelete.id);
  }, [dataset, skillToDelete]);

  const relatedModules = useMemo(() => {
    if (!activeSkill) return [];
    const moduleIds = new Set(
      dataset.relationships
        .filter(r => r.type === 'develops' && (r.targetId === activeSkill.id || r.sourceId === activeSkill.id))
        .map(r => r.sourceId === activeSkill.id ? r.targetId : r.sourceId)
    );
    return modules.filter(m => moduleIds.has(m.id));
  }, [dataset.relationships, modules, activeSkill]);

  return (
    <div className="authoring-container">
      <div className="authoring-layout grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Pane: Master List */}
        <div className="authoring-list-pane bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Skills & Competencies ({skills.length})
              </h3>
              <p className="text-xs text-slate-500">Employability and graduate attributes.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={startCreate}
            >
              <span>➕</span> New Skill
            </button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="form-control text-xs flex-1"
              placeholder="Search skill name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className="form-control text-xs w-36"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="entity-list flex-1 overflow-y-auto space-y-2 max-h-[500px]">
            {filteredSkills.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
                {searchQuery ? 'No skills match your filter.' : 'No skills defined yet. Click "New Skill" to begin.'}
              </div>
            ) : (
              filteredSkills.map(s => {
                const isSelected = selectedId === s.id && !isCreating;
                const devCount = dataset.relationships.filter(
                  r => r.type === 'develops' && (r.targetId === s.id || r.sourceId === s.id)
                ).length;
                return (
                  <div
                    key={s.id}
                    className={`entity-item-card p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => selectForEdit(s)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {s.category}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mb-1">{s.description}</p>
                    )}
                    <div className="text-[10px] text-slate-400">
                      {devCount} development {devCount === 1 ? 'mapping' : 'mappings'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Detail / Editing Form */}
        <div className="authoring-detail-pane bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          {isCreating || activeSkill ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  {isCreating ? 'Create Skill' : `Edit Skill: ${activeSkill?.name}`}
                </h3>
                {!isCreating && activeSkill && (
                  <button
                    type="button"
                    className="btn btn-outline text-red-600 hover:bg-red-50 border-red-200 btn-sm"
                    onClick={() => promptDelete(activeSkill)}
                    title="Safely delete this skill"
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
                <label htmlFor="skill-name">
                  Skill Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="skill-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Statistical Modelling, Literature Synthesis"
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
                <label htmlFor="skill-category">
                  Category / Classification <span className="text-red-500">*</span>
                </label>
                <select
                  id="skill-category"
                  className="form-control"
                  value={category}
                  onChange={e => {
                    setCategory(e.target.value);
                    setIsDirty(true);
                  }}
                >
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other">Other (Custom category)...</option>
                </select>
              </div>

              {category === 'Other' && (
                <div className="form-group">
                  <label htmlFor="skill-custom-category">
                    Custom Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="skill-custom-category"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Clinical, Leadership, Digital"
                    value={customCategory}
                    onChange={e => {
                      setCustomCategory(e.target.value);
                      setIsDirty(true);
                    }}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="skill-desc">Description</label>
                <textarea
                  id="skill-desc"
                  className="form-control"
                  rows={2}
                  placeholder="Optional context on how this attribute is articulated in the curriculum..."
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                />
              </div>

              {/* Related Modules Context View */}
              {!isCreating && activeSkill && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="font-semibold text-slate-700">Developing Modules ({relatedModules.length})</div>
                  {relatedModules.length === 0 ? (
                    <p className="text-slate-400 text-[11px]">
                      No module currently has an explicit 'develops' relationship to this skill.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {relatedModules.map(m => (
                        <span key={m.id} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {m.code}
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
                  {isCreating ? 'Create Skill' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">🛠️</div>
              <h4 className="font-bold text-slate-600 text-sm mb-1">Skill Details</h4>
              <p className="text-xs max-w-xs text-slate-400 mb-4">
                Select an existing skill to inspect its classification and module mappings, or click "New Skill" to define an attribute.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={startCreate}
              >
                ➕ Create Skill
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        entityType="Skill"
        entityName={skillToDelete?.name || ''}
        impactMessage={deletionImpact?.summaryMessage || ''}
        hasDependencies={deletionImpact?.hasDependencies || false}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSkillToDelete(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default SkillEditor;
