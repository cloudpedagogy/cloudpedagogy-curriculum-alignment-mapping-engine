import React, { useRef, useState, useMemo, useCallback } from 'react';
import type { MappingDataset } from './types';
import Navigation, { type WorkspaceTab } from './components/Navigation';
import WelcomeScreen from './components/WelcomeScreen';
import OverviewWorkspace from './components/OverviewWorkspace';
import BuildWorkspace from './components/BuildWorkspace';
import DataWorkspace from './components/DataWorkspace';
import CurriculumGraph from './components/CurriculumGraph';
import StructuralSignals from './components/StructuralSignals';
import OutcomeCoverageMatrix from './components/OutcomeCoverageMatrix';
import AssessmentMappingView from './components/AssessmentMappingView';
import StructureEditor from './components/StructureEditor';
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
    removeRelationship,
    removeModule,
    removeAssessment,
    removeOutcome,
    activeProgrammeId,
    selectProgramme,
    updateDataset
  } = useMappingEngine();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    const saved = localStorage.getItem('came_active_workspace') as WorkspaceTab | null;
    if (saved && ['overview', 'build', 'explore', 'review', 'data'].includes(saved)) {
      return saved;
    }
    return 'overview';
  });

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTab = useCallback((tab: WorkspaceTab) => {
    setActiveTab(tab);
    localStorage.setItem('came_active_workspace', tab);
  }, []);

  const handleCreateBlank = useCallback(() => {
    const blankDataset: MappingDataset = {
      id: `curriculum_${Date.now()}`,
      name: 'New Curriculum Model',
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      programmes: [
        {
          id: 'prog_default',
          name: 'Primary Programme',
          description: 'Initial curriculum programme structure',
          moduleIds: []
        }
      ],
      modules: [],
      outcomes: [],
      assessments: [],
      skills: [],
      relationships: []
    };
    updateDataset(blankDataset);
    handleSelectTab('build');
  }, [updateDataset, handleSelectTab]);

  const handleLoadDemo = useCallback(() => {
    loadDemo();
    handleSelectTab('overview');
  }, [loadDemo, handleSelectTab]);

  const handleResetData = useCallback(() => {
    resetData();
    handleSelectTab('overview');
  }, [resetData, handleSelectTab]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file);
      handleSelectTab('overview');
    }
  }, [importData, handleSelectTab]);

  const activeProgramme = useMemo(() =>
    dataset?.programmes?.find(p => p.id === activeProgrammeId) || null
  , [dataset, activeProgrammeId]);

  const filteredDataset = useMemo(() => {
    if (!dataset || !activeProgrammeId || !activeProgramme) return dataset;

    const moduleIds = new Set(activeProgramme.moduleIds);
    const filteredModules = dataset.modules.filter(m => moduleIds.has(m.id));
    const filteredOutcomes = dataset.outcomes.filter(o => o.moduleId ? moduleIds.has(o.moduleId) : false);
    const filteredAssessments = dataset.assessments.filter(a => a.moduleId ? moduleIds.has(a.moduleId) : false);

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
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsMethodologyOpen(true)}
          >
            📖 How this works
          </button>
        </div>

        <p className="description">
          A local-first, standalone environment for defining, mapping, and analysing curriculum structures and alignment.
        </p>

        <div className="disclaimer-banner">
          <span className="warning-icon">⚠️</span>
          <span>
            This tool supports structured curriculum design and analysis.
            It does not prescribe decisions or replace academic judgement.
          </span>
        </div>

        {/* Persistent Workspace Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          datasetLoaded={Boolean(dataset)}
        />

        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          className="file-input hidden"
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
      </header>

      <main id={`workspace-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {!dataset ? (
          activeTab === 'data' ? (
            <DataWorkspace
              dataset={null}
              validationIssues={[]}
              onImportClick={handleImportClick}
              onExportData={exportData}
              onLoadDemo={handleLoadDemo}
              onResetData={handleResetData}
            />
          ) : (
            <WelcomeScreen
              onCreateNew={handleCreateBlank}
              onImportClick={handleImportClick}
              onLoadDemo={handleLoadDemo}
            />
          )
        ) : (
          <>
            {/* 1. Overview Workspace */}
            {activeTab === 'overview' && (
              <OverviewWorkspace
                dataset={filteredDataset || dataset}
                activeProgramme={activeProgramme}
                activeProgrammeId={activeProgrammeId}
                metrics={metrics}
                onNavigate={handleSelectTab}
                onSelectProgramme={selectProgramme}
              />
            )}

            {/* 2. Build Workspace */}
            {activeTab === 'build' && (
              <BuildWorkspace
                dataset={dataset}
                activeProgrammeId={activeProgrammeId}
                onSelectProgramme={selectProgramme}
                onAddModule={addModule}
                onAddRelationship={addRelationship}
                onRemoveRelationship={removeRelationship}
              />
            )}

            {/* 3. Explore Workspace */}
            {activeTab === 'explore' && (
              <div className="explore-workspace">
                <div className="panel-header mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Relational Topology & Progression</h2>
                  <p className="text-secondary text-sm">
                    Explore multipartite relational networks, evaluate module skill development coverage, and trace dependency progression pathways.
                  </p>
                </div>

                {dataset.programmes && dataset.programmes.length > 0 && (
                  <div className="mb-6">
                    <ProgrammeSelector
                      programmes={dataset.programmes}
                      activeProgrammeId={activeProgrammeId}
                      onSelectProgramme={selectProgramme}
                    />
                  </div>
                )}

                <section className="mb-8">
                  <h3 className="text-base font-semibold mb-3">Curriculum Alignment Map</h3>
                  <CurriculumGraph dataset={filteredDataset || dataset} />
                </section>

                <section className="mb-8">
                  <h3 className="text-base font-semibold mb-3">Skill Coverage Heatmap</h3>
                  <SkillCoverageHeatmap
                    dataset={filteredDataset || dataset}
                    moduleIdFilter={activeProgramme?.moduleIds}
                  />
                </section>

                <section className="mb-8">
                  <h3 className="text-base font-semibold mb-3">Dependency & Progression Mapping</h3>
                  <ProgressionExplorer
                    dataset={filteredDataset || dataset}
                    moduleIdFilter={activeProgramme?.moduleIds}
                  />
                </section>
              </div>
            )}

            {/* 4. Review Workspace */}
            {activeTab === 'review' && (
              <div className="review-workspace">
                <div className="panel-header mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Alignment Review & Quality Assurance</h2>
                  <p className="text-secondary text-sm">
                    Evaluate module outcome distributions, verify assessment mapping evidence, and review automated pedagogical structural observations.
                  </p>
                </div>

                {dataset.programmes && dataset.programmes.length > 0 && (
                  <div className="mb-6">
                    <ProgrammeSelector
                      programmes={dataset.programmes}
                      activeProgrammeId={activeProgrammeId}
                      onSelectProgramme={selectProgramme}
                    />
                  </div>
                )}

                <section className="mb-8">
                  <h3 className="text-base font-semibold mb-3">Outcome Coverage Matrix</h3>
                  <OutcomeCoverageMatrix
                    dataset={filteredDataset || dataset}
                    onRemoveModule={removeModule}
                    onRemoveOutcome={removeOutcome}
                  />
                </section>

                <section className="mb-8">
                  <h3 className="text-base font-semibold mb-3">Assessment Structural Mapping</h3>
                  <AssessmentMappingView
                    dataset={filteredDataset || dataset}
                    onRemoveAssessment={removeAssessment}
                  />
                </section>

                <section className="mb-8">
                  <h3 className="text-base font-semibold mb-3">Structural Alignment Analysis</h3>
                  <StructuralSignals dataset={filteredDataset || dataset} />
                </section>
              </div>
            )}

            {/* 5. Data Workspace */}
            {activeTab === 'data' && (
              <div className="data-workspace-container">
                <DataWorkspace
                  dataset={dataset}
                  validationIssues={validationIssues}
                  onImportClick={handleImportClick}
                  onExportData={exportData}
                  onLoadDemo={handleLoadDemo}
                  onResetData={handleResetData}
                />

                <div className="mt-8">
                  <GovernancePanel
                    dataset={dataset}
                    onUpdate={updateDataset}
                  />
                </div>
              </div>
            )}

            {/* Optional Overlay Structure Editor (if manually opened) */}
            {isEditorOpen && (
              <StructureEditor
                dataset={dataset}
                onAddModule={addModule}
                onAddRelationship={addRelationship}
                onRemoveRelationship={removeRelationship}
                onClose={() => setIsEditorOpen(false)}
              />
            )}
          </>
        )}

        {isMethodologyOpen && (
          <MethodologyPanel
            onClose={() => setIsMethodologyOpen(false)}
          />
        )}
      </main>

      <footer className="footer">
        <p className="footer-text">
          CloudPedagogy · Governance-ready AI and curriculum systems · Standalone Open Source Edition
        </p>
      </footer>
    </div>
  );
};

export default App;
