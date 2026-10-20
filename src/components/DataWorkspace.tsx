import React, { useState } from 'react';
import type { MappingDataset } from '../types';
import type { ValidationIssue } from '../lib/validation/validator';
import ValidationStatus from './ValidationStatus';

interface DataWorkspaceProps {
  dataset: MappingDataset | null;
  validationIssues: ValidationIssue[];
  onImportClick: () => void;
  onExportData: () => void;
  onLoadDemo: () => void;
  onResetData: () => void;
}

const DataWorkspace: React.FC<DataWorkspaceProps> = ({
  dataset,
  validationIssues,
  onImportClick,
  onExportData,
  onLoadDemo,
  onResetData
}) => {
  const [confirmingDemo, setConfirmingDemo] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleDemoClick = () => {
    if (dataset && dataset.modules.length > 0) {
      setConfirmingDemo(true);
      setConfirmingReset(false);
    } else {
      onLoadDemo();
    }
  };

  const handleResetClick = () => {
    setConfirmingReset(true);
    setConfirmingDemo(false);
  };

  return (
    <div className="data-workspace">
      <div className="panel-header mb-6">
        <h2 className="text-xl font-bold text-slate-800">Dataset Management & Integrity</h2>
        <p className="text-secondary text-sm">
          Import external curriculum models, export your current structure as JSON, manage demonstration files, and review system validation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Left: Dataset Information */}
        <div className="data-card p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>📋</span> Current Dataset Metadata
          </h3>
          {dataset ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-800">{dataset.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Dataset ID:</span>
                <span className="font-mono text-slate-700">{dataset.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Version:</span>
                <span className="font-bold text-slate-700">{dataset.version}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Last Updated:</span>
                <span className="text-slate-700">{new Date(dataset.lastUpdated).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Total Entities:</span>
                <span className="font-bold text-blue-600">
                  {dataset.modules.length} Modules · {dataset.outcomes.length} Outcomes · {dataset.assessments.length} Assessments · {dataset.skills.length} Skills
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded text-xs text-slate-500 text-center">
              No dataset is currently loaded in memory.
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="data-card p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>⚙️</span> Dataset Operations
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Manage your local-first storage. All changes persist automatically in your browser session.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="btn btn-outline flex flex-col items-center justify-center p-3 text-center"
              onClick={onImportClick}
            >
              <span className="text-xl mb-1">📥</span>
              <span className="text-xs font-bold">Import JSON</span>
              <span className="text-[10px] text-slate-500">Load from disk</span>
            </button>

            <button
              type="button"
              className="btn btn-outline flex flex-col items-center justify-center p-3 text-center"
              onClick={onExportData}
              disabled={!dataset}
            >
              <span className="text-xl mb-1">📤</span>
              <span className="text-xs font-bold">Export JSON</span>
              <span className="text-[10px] text-slate-500">Download backup</span>
            </button>

            <button
              type="button"
              className="btn btn-outline flex flex-col items-center justify-center p-3 text-center border-blue-300 hover:bg-blue-50"
              onClick={handleDemoClick}
            >
              <span className="text-xl mb-1">🚀</span>
              <span className="text-xs font-bold text-blue-700">Load Demo Data</span>
              <span className="text-[10px] text-slate-500">Public Health sample</span>
            </button>

            <button
              type="button"
              className="btn btn-outline flex flex-col items-center justify-center p-3 text-center text-red-600 hover:bg-red-50 border-red-200"
              onClick={handleResetClick}
              disabled={!dataset}
            >
              <span className="text-xl mb-1">🧹</span>
              <span className="text-xs font-bold text-red-600">Reset Data</span>
              <span className="text-[10px] text-slate-500">Clear local session</span>
            </button>
          </div>

          {/* Overwrite Confirmation Panel */}
          {confirmingDemo && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg mt-4 text-xs">
              <p className="font-semibold text-amber-900 mb-1">⚠️ Overwrite Confirmation</p>
              <p className="text-amber-800 mb-3">
                Loading demonstration data will replace your active curriculum ({dataset?.name || 'current model'}).
                Unexported changes will be replaced. Consider exporting your dataset first.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setConfirmingDemo(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={onExportData}
                >
                  Export Backup JSON
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setConfirmingDemo(false);
                    onLoadDemo();
                  }}
                >
                  Proceed & Load Demo
                </button>
              </div>
            </div>
          )}

          {/* Reset Confirmation Panel */}
          {confirmingReset && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg mt-4 text-xs">
              <p className="font-semibold text-red-900 mb-1">⚠️ Clear Workspace Confirmation</p>
              <p className="text-red-800 mb-3">
                Resetting will clear the current curriculum from browser storage and return to the starting screen.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setConfirmingReset(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setConfirmingReset(false);
                    onResetData();
                  }}
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation & System Health Status */}
      <div className="validation-section mt-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Validation & Structural Integrity Diagnostics
        </h3>
        <ValidationStatus issues={validationIssues} />
      </div>
    </div>
  );
};

export default DataWorkspace;
