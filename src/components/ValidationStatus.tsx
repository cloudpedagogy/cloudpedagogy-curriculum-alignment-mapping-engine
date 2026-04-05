import React, { useState } from 'react';
import type { ValidationIssue } from '../lib/validation/validator';

interface ValidationStatusProps {
  issues: ValidationIssue[];
}

const ValidationStatus: React.FC<ValidationStatusProps> = ({ issues }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (issues.length === 0) return null;

  const errors = issues.filter(i => i.level === 'error');
  const warnings = issues.filter(i => i.level === 'warning');

  return (
    <div className={`validation-status-container ${isOpen ? 'is-open' : ''}`}>
      <div className="status-bar" onClick={() => setIsOpen(!isOpen)}>
        <div className="status-summary">
          <span className="status-icon">⚠️</span>
          <span className="status-text">
            <strong>System Health:</strong> {errors.length > 0 && `${errors.length} Errors, `}{warnings.length} Warnings detected
          </span>
        </div>
        <button className="toggle-btn">{isOpen ? 'Hide Details' : 'View Details'}</button>
      </div>

      {isOpen && (
        <div className="issue-details-panel">
          <div className="issue-list">
            {issues.map((issue, idx) => (
              <div key={idx} className={`issue-item ${issue.level}`}>
                <div className="issue-type-badge">{issue.level}</div>
                <div className="issue-message">
                  {issue.message}
                  {issue.entityId && <span className="entity-id">ID: {issue.entityId}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="issue-footer">
            <p>Validation detects structural inconsistencies (broken links, duplicates, etc.). These should be addressed to ensure mapping accuracy.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationStatus;
