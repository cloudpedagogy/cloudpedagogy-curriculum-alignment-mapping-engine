import React, { useState } from 'react';
import {
  type ValidationIssue,
  isStructuralIssue,
  isEducationalObservation
} from '../lib/validation/validator';

interface ValidationStatusProps {
  issues: ValidationIssue[];
}

const ValidationStatus: React.FC<ValidationStatusProps> = ({ issues }) => {
  const [showStructuralDetails, setShowStructuralDetails] = useState(true);
  const [showEducationalDetails, setShowEducationalDetails] = useState(true);

  const structuralIssues = issues.filter(isStructuralIssue);
  const educationalIssues = issues.filter(isEducationalObservation);

  const structuralErrors = structuralIssues.filter(i => i.level === 'error');
  const structuralWarnings = structuralIssues.filter(i => i.level === 'warning');

  return (
    <div className="space-y-6">
      {/* 1. Technical Data Integrity Panel */}
      <div className="data-integrity-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${structuralIssues.length === 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
              {structuralIssues.length === 0 ? '✓' : '⚠️'}
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                {structuralIssues.length === 0
                  ? 'Data Integrity: Technically Consistent'
                  : `Data Integrity: ${structuralIssues.length} Structural Issue(s) Detected`}
              </h4>
              <p className="text-xs text-slate-500">
                {structuralIssues.length === 0
                  ? 'All entity identifiers, relationship endpoints, and module references are structurally valid.'
                  : `${structuralErrors.length} error(s), ${structuralWarnings.length} warning(s) affecting relational data consistency.`}
              </p>
            </div>
          </div>
          {structuralIssues.length > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs"
              onClick={() => setShowStructuralDetails(!showStructuralDetails)}
            >
              {showStructuralDetails ? 'Hide Issues' : 'Review Issues'}
            </button>
          )}
        </div>

        {structuralIssues.length > 0 && showStructuralDetails && (
          <div className="mt-4 space-y-2">
            {structuralIssues.map((issue, idx) => (
              <div
                key={`struct-${idx}`}
                className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                  issue.level === 'error'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      issue.level === 'error' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {issue.category.replace('_', ' ')}
                    </span>
                    <span className="font-semibold">{issue.message}</span>
                  </div>
                </div>
                {issue.entityId && (
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    ID: {issue.entityId}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Educational Design Observations Panel */}
      <div className="educational-observations-panel bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-blue-600">💡</span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                Educational Design Observations ({educationalIssues.length})
              </h4>
              <p className="text-xs text-slate-500">
                Pedagogical design considerations for curriculum committee review (e.g., unassessed outcomes, unlinked modules, undeveloped skills). These reflect curriculum design considerations rather than technical system errors.
              </p>
            </div>
          </div>
          {educationalIssues.length > 0 && (
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs"
              onClick={() => setShowEducationalDetails(!showEducationalDetails)}
            >
              {showEducationalDetails ? 'Hide Observations' : 'Review Observations'}
            </button>
          )}
        </div>

        {educationalIssues.length === 0 ? (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
            No educational design observations flagged. All outcomes, modules, and skills have active curriculum linkages.
          </div>
        ) : showEducationalDetails ? (
          <div className="mt-4 space-y-2">
            {educationalIssues.map((issue, idx) => (
              <div
                key={`edu-${idx}`}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                      Advisory
                    </span>
                    <span className="text-slate-800">{issue.message}</span>
                  </div>
                </div>
                {issue.entityId && (
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 text-slate-600">
                    ID: {issue.entityId}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ValidationStatus;
