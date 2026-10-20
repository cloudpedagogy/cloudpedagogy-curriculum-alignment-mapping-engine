import React from 'react';

interface WelcomeScreenProps {
  onCreateNew: () => void;
  onImportClick: () => void;
  onLoadDemo: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateNew,
  onImportClick,
  onLoadDemo
}) => {
  return (
    <div className="welcome-screen-container">
      <div className="welcome-hero text-center mb-8">
        <div className="welcome-badge mb-2">CloudPedagogy · Curriculum Alignment</div>
        <h2 className="welcome-title text-2xl font-bold mb-3">Welcome to Curriculum Alignment</h2>
        <p className="welcome-subtitle text-secondary max-w-xl mx-auto">
          Build, explore and review the relationships between modules, learning outcomes, assessments and skills.
        </p>
      </div>

      <div className="welcome-grid">
        <div className="welcome-card">
          <div className="welcome-card-icon">🏗️</div>
          <h3 className="welcome-card-title">Create a new curriculum</h3>
          <p className="welcome-card-desc">
            Start with a fresh structure. Define your programme and begin adding modules and learning outcomes directly in the workspace.
          </p>
          <button
            type="button"
            className="btn btn-primary w-full mt-4"
            onClick={onCreateNew}
          >
            Create Blank Curriculum
          </button>
        </div>

        <div className="welcome-card">
          <div className="welcome-card-icon">📥</div>
          <h3 className="welcome-card-title">Import an existing curriculum</h3>
          <p className="welcome-card-desc">
            Load a previously exported curriculum dataset in JSON format from your local storage to resume review and mapping.
          </p>
          <button
            type="button"
            className="btn btn-outline w-full mt-4"
            onClick={onImportClick}
          >
            Import JSON File
          </button>
        </div>

        <div className="welcome-card">
          <div className="welcome-card-icon">🚀</div>
          <h3 className="welcome-card-title">Explore an example</h3>
          <p className="welcome-card-desc">
            Load an illustrative undergraduate Public Health degree pre-populated with modules, outcomes, assessments, and intentional curriculum gaps.
          </p>
          <button
            type="button"
            className="btn btn-outline w-full mt-4"
            onClick={onLoadDemo}
          >
            Load Example Curriculum
          </button>
        </div>
      </div>

      <div className="welcome-footer mt-8 text-center text-xs text-secondary">
        <p>Local-first and private: your curriculum data stays entirely inside your browser.</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
