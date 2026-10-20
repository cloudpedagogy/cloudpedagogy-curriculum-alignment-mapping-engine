import React from 'react';
import type { MappingDataset, Module, Relationship } from '../types';
import StructureEditor from './StructureEditor';
import ProgrammeSelector from '../features/programmes/ProgrammeSelector';

interface BuildWorkspaceProps {
  dataset: MappingDataset;
  activeProgrammeId: string | null;
  onSelectProgramme: (id: string | null) => void;
  onAddModule: (module: Module) => void;
  onAddRelationship: (rel: Relationship) => void;
  onRemoveRelationship?: (id: string) => void;
}

const BuildWorkspace: React.FC<BuildWorkspaceProps> = ({
  dataset,
  activeProgrammeId,
  onSelectProgramme,
  onAddModule,
  onAddRelationship,
  onRemoveRelationship
}) => {
  return (
    <div className="build-workspace">
      <div className="panel-header mb-6">
        <h2 className="text-xl font-bold text-slate-800">Curriculum Authoring & Structure</h2>
        <p className="text-secondary text-sm">
          Define core curriculum modules, establish relational mappings, and maintain pedagogical structures.
        </p>
      </div>

      {dataset.programmes && dataset.programmes.length > 0 && (
        <div className="mb-6">
          <ProgrammeSelector
            programmes={dataset.programmes}
            activeProgrammeId={activeProgrammeId}
            onSelectProgramme={onSelectProgramme}
          />
        </div>
      )}

      <div className="build-editor-container">
        <StructureEditor
          dataset={dataset}
          isInline={true}
          onAddModule={onAddModule}
          onAddRelationship={onAddRelationship}
          onRemoveRelationship={onRemoveRelationship}
        />
      </div>
    </div>
  );
};

export default BuildWorkspace;
