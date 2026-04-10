import React from 'react';

interface SummaryCardProps {
  label: string;
  count: number;
  icon?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, count, icon }) => {
  return (
    <div className="summary-card">
      <div className="summary-card-inner">
        <div className="summary-icon">{icon || '📊'}</div>
        <div className="summary-content">
          <span className="summary-count">{count}</span>
          <span className="summary-label">{label}</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
