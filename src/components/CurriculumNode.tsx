import React from 'react';
import type { EntityType } from '../types';

interface CurriculumNodeProps {
  id: string;
  type: EntityType;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  isSelected: boolean;
  isConnected?: boolean;
  isDimmed: boolean;
  onClick: () => void;
}

const TYPE_CONFIG: Record<EntityType, { label: string; badgeClass: string }> = {
  module: { label: 'Module', badgeClass: 'badge-module' },
  outcome: { label: 'Outcome', badgeClass: 'badge-outcome' },
  assessment: { label: 'Assessment', badgeClass: 'badge-assessment' },
  skill: { label: 'Skill', badgeClass: 'badge-skill' }
};

const CurriculumNode: React.FC<CurriculumNodeProps> = ({
  type,
  label,
  subtitle,
  x,
  y,
  isSelected,
  isConnected = false,
  isDimmed,
  onClick
}) => {
  const config = TYPE_CONFIG[type];
  const fullTooltip = `[${config.label}] ${subtitle ? `${subtitle} — ` : ''}${label}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={fullTooltip}
      title={fullTooltip}
      className={`graph-node node-${type} ${isSelected ? 'selected' : ''} ${isConnected ? 'connected' : ''} ${isDimmed ? 'dimmed' : ''}`}
      style={{
        left: x,
        top: y
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="node-content">
        <div className="node-top-row">
          <span className={`node-type-pill ${config.badgeClass}`}>{config.label}</span>
          {subtitle && <span className="node-subtitle" title={subtitle}>{subtitle}</span>}
        </div>
        <div className="node-label" title={label}>{label}</div>
      </div>
    </div>
  );
};

export default CurriculumNode;
