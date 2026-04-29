import React, { useRef, useState, useMemo } from 'react';
import SummaryCard from './components/SummaryCard';
import CurriculumGraph from './components/CurriculumGraph';
import StructuralSignals from './components/StructuralSignals';
import OutcomeCoverageMatrix from './components/OutcomeCoverageMatrix';
import AssessmentMappingView from './components/AssessmentMappingView';
import StructureEditor from './components/StructureEditor';
import ValidationStatus from './components/ValidationStatus';
import MethodologyPanel from './components/MethodologyPanel';
import GovernancePanel from './components/GovernancePanel';
import ProgrammeSelector from './features/programmes/ProgrammeSelector';
import SkillCoverageHeatmap from './components/SkillCoverageHeatmap';
import ProgressionExplorer from './components/ProgressionExplorer';
import { useMappingEngine } from './features/mapping/useMappingEngine';
import { calculateGraphMetrics } from './features/relationships/graphUtils';
import { validateDataset } from './lib/validation/validator';
import './index.css';

const App: React.FC = () => {
  const { 
    dataset, 
    isLoaded, 
    loadDemo, 
    resetData, 
    importData, 
    exportData,
    addModule,
    addRelationship,
    removeModule,
    removeAssessment,
    activeProgrammeId,
    selectProgramme,
    updateDataset
  } = useMappingEngine();
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProgramme = useMemo(() => 
    dataset?.programmes?.find(p => p.id === activeProgrammeId) || null
  , [dataset, activeProgrammeId]);

  const filteredDataset = useMemo(() => {
    if (!dataset || !activeProgrammeId || !activeProgramme) return dataset;

    const moduleIds = new Set(activeProgramme.moduleIds);
    const filteredModules = dataset.modules.filter(m => moduleIds.has(m.id));
    const filteredOutcomes = dataset.outcomes.filter(o => moduleIds.has(o.moduleId));
    const filteredAssessments = dataset.assessments.filter(a => moduleIds.has(a.moduleId));
    
    const validEntityIds = new Set([
      ...filteredModules.map(m => m.id),
      ...filteredOutcomes.map(o => o.id),
      ...filteredAssessments.map(a => a.id),
      ...dataset.skills.map(s => s.id)
    ]);

    const filteredRelationships = dataset.relationships.filter(r => 
      validEntityIds.has(r.sourceId) && validEntityIds.has(r.targetId)
    );

    return {
      ...dataset,
      modules: filteredModules,
      outcomes: filteredOutcomes,
      assessments: filteredAssessments,
      relationships: filteredRelationships
    };
  }, [dataset, activeProgrammeId, activeProgramme]);

  const metrics = useMemo(() => filteredDataset ? calculateGraphMetrics(filteredDataset) : null, [filteredDataset]);
  const validationIssues = useMemo(() => filteredDataset ? validateDataset(filteredDataset) : [], [filteredDataset]);

  if (!isLoaded) return <div className="app-container">Loading...</div>;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="cp-branding">
          <a href="https://www.cloudpedagogy.com/" className="cp-link" target="_blank" rel="noopener noreferrer">
            CloudPedagogy
          </a>
        </div>
        
        <div className="header-top">
          <h1>Curriculum Alignment & Mapping Engine</h1>
          <button className="btn btn-outline btn-sm" onClick={() => setIsMethodologyOpen(true)}>
            📖 How this works
          </button>
        </div>
        
        <p className="description">
          A local-first tool for defining and visualising curriculum structure and alignment.
        </p>
        
        <div className="disclaimer-banner">
          <span className="warning-icon">⚠️</span>
          <span>
            This tool supports structured curriculum design and analysis. 
            It does not prescribe decisions or replace academic judgement.
          </span>
        </div>

        <div className="controls">
          <button className="btn btn-primary" onClick={loadDemo}>
            🚀 Load Demo Data
          </button>

          <button className="btn btn-outline" onClick={() => setIsEditorOpen(true)}>
            🏗️ Structure Explorer
          </button>
          
          <button className="btn btn-outline" onClick={handleImportClick}>
            📥 Import JSON
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="file-input" 
            accept=".json"
            onChange={handleFileChange}
          />

          <button 
            className="btn btn-outline" 
            onClick={exportData}
            disabled={!dataset}
          >
            📤 Export JSON
          </button>

          <button className="btn btn-danger" onClick={resetData}>
            🧹 Reset Data
          </button>
        </div>

        <ValidationStatus issues={validationIssues} />

        {metrics && (
          <div className="metrics-row">
            <div className="metric-tag">
              <span className="label">Relationships:</span>
              <span className="value">{metrics.totalRelationships}</span>
            </div>
            <div className="metric-tag">
              <span className="label">Connected Components:</span>
              <span className="value">{metrics.connectedComponents}</span>
            </div>
            {metrics.orphanedEntities > 0 && (
              <div className="metric-tag">
                <span className="label">Isolated Entities:</span>
                <span className="value">{metrics.orphanedEntities}</span>
                <span>⚠️</span>
              </div>
            )}
          </div>
        )}
      </header>

      <main>
        {dataset ? (
          <>
            <div className="summary-grid">
              <SummaryCard 
                label="Modules" 
                count={dataset.modules.length} 
                icon="📘" 
              />
              <SummaryCard 
                label="Outcomes" 
                count={dataset.outcomes.length} 
                icon="🎯" 
              />
              <SummaryCard 
                label="Assessments" 
                count={dataset.assessments.length} 
                icon="📝" 
              />
              <SummaryCard 
                label="Skills" 
                count={dataset.skills.length} 
                icon="🛠️" 
              />
            </div>

            <section className="mt-4">
              <ProgrammeSelector 
                programmes={dataset.programmes || []}
                activeProgrammeId={activeProgrammeId}
                onSelectProgramme={selectProgramme}
              />
            </section>

            <section className="mt-4">
              <h2 className="mb-4">Curriculum Alignment Map</h2>
              <CurriculumGraph dataset={filteredDataset || dataset} />
            </section>

            <section className="mt-4">
              <SkillCoverageHeatmap 
                dataset={filteredDataset || dataset} 
                moduleIdFilter={activeProgramme?.moduleIds}
              />
            </section>

            <section className="mt-4">
              <ProgressionExplorer 
                dataset={filteredDataset || dataset} 
                moduleIdFilter={activeProgramme?.moduleIds}
              />
            </section>

            <section className="mt-4">
              <OutcomeCoverageMatrix 
                dataset={filteredDataset || dataset} 
                onRemoveModule={removeModule}
              />
            </section>

            <section className="mt-4">
              <AssessmentMappingView 
                dataset={filteredDataset || dataset} 
                onRemoveAssessment={removeAssessment}
              />
            </section>

            <section className="mt-4">
              <StructuralSignals dataset={filteredDataset || dataset} />
            </section>

            {isEditorOpen && (
              <StructureEditor 
                dataset={dataset}
                onAddModule={addModule}
                onAddRelationship={addRelationship}
                onClose={() => setIsEditorOpen(false)}
              />
            )}

            <GovernancePanel 
              dataset={dataset}
              onUpdate={updateDataset}
            />

            {isMethodologyOpen && (
              <MethodologyPanel 
                onClose={() => setIsMethodologyOpen(false)}
              />
            )}
          </>
        ) : (
          <>
            <div className="empty-state text-center mt-4">
              <p className="text-secondary">No data loaded. Use the controls above to start.</p>
            </div>
            {isMethodologyOpen && (
              <MethodologyPanel 
                onClose={() => setIsMethodologyOpen(false)}
              />
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p className="footer-text">
          CloudPedagogy · Governance-ready AI and curriculum systems
        </p>
      </footer>
    </div>
  );
};

export default App;
