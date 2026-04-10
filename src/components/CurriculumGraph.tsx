import React, { useState, useMemo } from 'react';
import type { MappingDataset, EntityType } from '../types';
import { calculateLayout } from '../features/relationships/graphLayout';
import CurriculumNode from './CurriculumNode';

interface CurriculumGraphProps {
  dataset: MappingDataset;
}

const CurriculumGraph: React.FC<CurriculumGraphProps> = ({ dataset }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<EntityType | 'all'>('all');

  const { nodes, edges } = useMemo(() => {
    return calculateLayout(dataset, selectedId);
  }, [dataset, selectedId]);

  const handleNodeClick = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  };

  const filteredNodes = nodes.filter(node => filter === 'all' || node.type === filter);
  const activeNodeIds = new Set(filteredNodes.map(n => n.id));

  // A node is dimmed if something is selected and this node is not part of the selection
  const isNodeDimmed = (nodeId: string) => {
    if (!selectedId) return false;
    if (selectedId === nodeId) return false;
    
    // Check if there's an edge between selectedId and nodeId
    return !edges.some(e => 
      (e.sourceId === selectedId && e.targetId === nodeId) ||
      (e.sourceId === nodeId && e.targetId === selectedId)
    );
  };

  return (
    <div className="graph-container">
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color"></div>
          <span>Module</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker">○</div>
          <span>Outcome</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker">□</div>
          <span>Assessment</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker">◇</div>
          <span>Skill</span>
        </div>
      </div>

      <div className="controls">
         <button 
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
        > All </button>
        <button 
          className={`btn ${filter === 'module' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('module')}
        > Modules </button>
        <button 
          className={`btn ${filter === 'outcome' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('outcome')}
        > Outcomes </button>
        <button 
          className={`btn ${filter === 'assessment' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('assessment')}
        > Assessments </button>
        <button 
          className={`btn ${filter === 'skill' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('skill')}
        > Skills </button>
      </div>

      <div className="graph-viewport">
        <svg className="graph-svg">
          {edges.map(edge => {
            const isVisible = activeNodeIds.has(edge.sourceId) && activeNodeIds.has(edge.targetId);
            if (!isVisible) return null;

            const isDimmed = selectedId && !edge.isActive;

            return (
              <path
                key={edge.id}
                d={edge.path}
                className={`graph-edge ${edge.isActive ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
              />
            );
          })}
        </svg>

        {filteredNodes.map(node => {
          let label = '';
          let subtitle = '';

          // Find original data for labeling
          if (node.type === 'module') {
            const m = dataset.modules.find(x => x.id === node.id);
            label = m?.title || '';
            subtitle = m?.code || '';
          } else if (node.type === 'outcome') {
            const o = dataset.outcomes.find(x => x.id === node.id);
            label = o?.description || '';
            subtitle = o?.code || '';
          } else if (node.type === 'assessment') {
            const a = dataset.assessments.find(x => x.id === node.id);
            label = a?.title || '';
            subtitle = a?.type || '';
          } else if (node.type === 'skill') {
            const s = dataset.skills.find(x => x.id === node.id);
            label = s?.name || '';
            subtitle = s?.category || '';
          }

          return (
            <CurriculumNode
              key={node.id}
              id={node.id}
              type={node.type}
              label={label}
              subtitle={subtitle}
              x={node.x}
              y={node.y}
              isSelected={selectedId === node.id}
              isDimmed={isNodeDimmed(node.id)}
              onClick={() => handleNodeClick(node.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CurriculumGraph;
