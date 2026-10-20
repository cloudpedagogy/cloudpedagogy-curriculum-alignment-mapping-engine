import React, { useState } from 'react';
import type {
  MappingDataset,
  Programme,
  Module,
  LearningOutcome,
  Assessment,
  Skill,
  Relationship
} from '../types';
import ProgrammeSelector from '../features/programmes/ProgrammeSelector';
import ProgrammeEditor from './authoring/ProgrammeEditor';
import ModuleEditor from './authoring/ModuleEditor';
import OutcomeEditor from './authoring/OutcomeEditor';
import AssessmentEditor from './authoring/AssessmentEditor';
import SkillEditor from './authoring/SkillEditor';
import StructureEditor from './StructureEditor';

export type BuildEntityTab = 'programmes' | 'modules' | 'outcomes' | 'assessments' | 'skills' | 'relationships';

interface BuildWorkspaceProps {
  dataset: MappingDataset;
  activeProgrammeId: string | null;
  onSelectProgramme: (id: string | null) => void;
  // Programmes
  onSaveProgramme: (programme: Programme) => void;
  onDeleteProgramme: (programmeId: string) => void;
  // Modules
  onSaveModule: (module: Module, programmeIds?: string[]) => void;
  onDeleteModule: (moduleId: string) => void;
  // Outcomes
  onSaveOutcome: (outcome: LearningOutcome) => void;
  onDeleteOutcome: (outcomeId: string) => void;
  // Assessments
  onSaveAssessment: (assessment: Assessment) => void;
  onDeleteAssessment: (assessmentId: string) => void;
  // Skills
  onSaveSkill: (skill: Skill) => void;
  onDeleteSkill: (skillId: string) => void;
  // Relationships
  onAddRelationship: (rel: Relationship) => void;
  onRemoveRelationship?: (id: string) => void;
}

interface BuildTabConfig {
  id: BuildEntityTab;
  label: string;
  icon: string;
  getCount: (dataset: MappingDataset) => number;
}

const BUILD_TABS: BuildTabConfig[] = [
  { id: 'programmes', label: 'Programmes', icon: '🎓', getCount: d => d.programmes?.length || 0 },
  { id: 'modules', label: 'Modules', icon: '📘', getCount: d => d.modules.length },
  { id: 'outcomes', label: 'Learning Outcomes', icon: '🎯', getCount: d => d.outcomes.length },
  { id: 'assessments', label: 'Assessments', icon: '📝', getCount: d => d.assessments.length },
  { id: 'skills', label: 'Skills', icon: '🛠️', getCount: d => d.skills.length },
  { id: 'relationships', label: 'Relationships', icon: '🔗', getCount: d => d.relationships.length },
];

const BuildWorkspace: React.FC<BuildWorkspaceProps> = ({
  dataset,
  activeProgrammeId,
  onSelectProgramme,
  onSaveProgramme,
  onDeleteProgramme,
  onSaveModule,
  onDeleteModule,
  onSaveOutcome,
  onDeleteOutcome,
  onSaveAssessment,
  onDeleteAssessment,
  onSaveSkill,
  onDeleteSkill,
  onAddRelationship,
  onRemoveRelationship
}) => {
  const [activeTab, setActiveTab] = useState<BuildEntityTab>('modules');

  return (
    <div className="build-workspace">
      <div className="panel-header mb-4">
        <h2 className="text-xl font-bold text-slate-800">Curriculum Authoring & Structure</h2>
        <p className="text-secondary text-sm">
          Define programmes, course modules, learning outcomes, assessments, and graduate attributes with real-time relational integrity.
        </p>
      </div>

      {dataset.programmes && dataset.programmes.length > 0 && (
        <div className="mb-4">
          <ProgrammeSelector
            programmes={dataset.programmes}
            activeProgrammeId={activeProgrammeId}
            onSelectProgramme={onSelectProgramme}
          />
        </div>
      )}

      {/* Internal Sub-navigation Tabs */}
      <div className="build-subnav-tabs flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
        {BUILD_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const count = tab.getCount(dataset);
          return (
            <button
              key={tab.id}
              type="button"
              className={`build-tab-btn px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Authoring Panel */}
      <div className="build-content-area">
        {activeTab === 'programmes' && (
          <ProgrammeEditor
            dataset={dataset}
            onSaveProgramme={onSaveProgramme}
            onDeleteProgramme={onDeleteProgramme}
          />
        )}

        {activeTab === 'modules' && (
          <ModuleEditor
            dataset={dataset}
            onSaveModule={onSaveModule}
            onDeleteModule={onDeleteModule}
          />
        )}

        {activeTab === 'outcomes' && (
          <OutcomeEditor
            dataset={dataset}
            onSaveOutcome={onSaveOutcome}
            onDeleteOutcome={onDeleteOutcome}
          />
        )}

        {activeTab === 'assessments' && (
          <AssessmentEditor
            dataset={dataset}
            onSaveAssessment={onSaveAssessment}
            onDeleteAssessment={onDeleteAssessment}
          />
        )}

        {activeTab === 'skills' && (
          <SkillEditor
            dataset={dataset}
            onSaveSkill={onSaveSkill}
            onDeleteSkill={onDeleteSkill}
          />
        )}

        {activeTab === 'relationships' && (
          <div className="relationships-legacy-wrapper">
            <div className="mb-3 text-xs text-slate-500">
              Manage relational links and alignment edges across curriculum entities. Comprehensive visual relationship mapping will be extended in Phase 2B.
            </div>
            <StructureEditor
              dataset={dataset}
              isInline={true}
              onAddModule={() => {}}
              onAddRelationship={onAddRelationship}
              onRemoveRelationship={onRemoveRelationship}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildWorkspace;
