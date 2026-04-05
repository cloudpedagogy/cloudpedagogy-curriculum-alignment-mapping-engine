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
  isDimmed: boolean;
  onClick: () => void;
}

const CurriculumNode: React.FC<CurriculumNodeProps> = ({
  type,
  label,
  subtitle,
  x,
  y,
  isSelected,
  isDimmed,
  onClick
}) => {
  const typeColors: Record<EntityType, string> = {
    module: '#6366f1',
    outcome: '#ec4899',
    assessment: '#10b981',
    skill: '#f59e0b'
  };

  return (
    <div
      className={`graph-node node-${type} ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''}`}
      style={{
        left: x,
        top: y,
        borderColor: typeColors[type]
      }}
      onClick={onClick}
    >
      <div className="node-badge" style={{ backgroundColor: typeColors[type] }}>
        {type.charAt(0).toUpperCase()}
      </div>
      <div className="node-content">
        <div className="node-label">{label}</div>
        {subtitle && <div className="node-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default CurriculumNode;
