import React, { useState, useMemo } from 'react';
import type { MappingDataset, EntityType } from '../types';
import { calculateLayout } from '../features/relationships/graphLayout';
import CurriculumNode from './CurriculumNode';

interface CurriculumGraphProps {
  dataset: MappingDataset;
}

interface ConnectedRelation {
  otherId: string;
  otherType: EntityType;
  relType: string;
  isOutgoing: boolean;
  label: string;
  subtitle: string;
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

  // Connected nodes map for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach(e => {
      if (e.sourceId === selectedId) set.add(e.targetId);
      if (e.targetId === selectedId) set.add(e.sourceId);
    });
    return set;
  }, [selectedId, edges]);

  // A node is dimmed if something is selected and this node is neither selected nor directly connected
  const isNodeDimmed = (nodeId: string) => {
    if (!selectedId) return false;
    if (selectedId === nodeId) return false;
    return !connectedNodeIds.has(nodeId);
  };

  // Render active edges on top for clean visibility
  const sortedEdges = useMemo(() => {
    return [...edges].sort((a, b) => {
      if (a.isActive && !b.isActive) return 1;
      if (!a.isActive && b.isActive) return -1;
      return 0;
    });
  }, [edges]);

  // Compute SVG dimensions so curves are not clipped
  const { svgWidth, svgHeight } = useMemo(() => {
    if (nodes.length === 0) return { svgWidth: 1400, svgHeight: 600 };
    const maxX = Math.max(...nodes.map(n => n.x + 260), 1400);
    const maxY = Math.max(...nodes.map(n => n.y + 120), 650);
    return { svgWidth: maxX + 100, svgHeight: maxY + 100 };
  }, [nodes]);

  // Compute selected entity details
  const selectedEntity = useMemo(() => {
    if (!selectedId) return null;
    const m = dataset.modules.find(x => x.id === selectedId);
    if (m) {
      return {
        id: m.id,
        type: 'module' as const,
        code: m.code,
        title: m.title,
        level: m.level,
        description: m.description,
        extra: `Level ${m.level}`
      };
    }
    const o = dataset.outcomes.find(x => x.id === selectedId);
    if (o) {
      const parentM = dataset.modules.find(x => x.id === o.moduleId);
      return {
        id: o.id,
        type: 'outcome' as const,
        code: o.code,
        title: o.description,
        description: o.description,
        extra: parentM ? `Module: ${parentM.code}` : 'Independent Outcome'
      };
    }
    const a = dataset.assessments.find(x => x.id === selectedId);
    if (a) {
      const parentM = dataset.modules.find(x => x.id === a.moduleId);
      return {
        id: a.id,
        type: 'assessment' as const,
        code: a.type,
        title: a.title,
        description: `Weight: ${a.weight}%`,
        extra: parentM ? `Module: ${parentM.code}` : undefined
      };
    }
    const s = dataset.skills.find(x => x.id === selectedId);
    if (s) {
      return {
        id: s.id,
        type: 'skill' as const,
        code: s.category,
        title: s.name,
        description: s.description,
        extra: `Category: ${s.category}`
      };
    }
    return null;
  }, [dataset, selectedId]);

  // Find all direct relationships with the selected entity
  const directRelations = useMemo((): ConnectedRelation[] => {
    if (!selectedId) return [];
    const list: ConnectedRelation[] = [];

    dataset.relationships.forEach(rel => {
      if (rel.sourceId === selectedId || rel.targetId === selectedId) {
        const isOutgoing = rel.sourceId === selectedId;
        const otherId = isOutgoing ? rel.targetId : rel.sourceId;
        const otherType = (isOutgoing ? rel.targetType : rel.sourceType) as EntityType;

        let label: string = otherId;
        let subtitle: string = otherType;

        if (otherType === 'module') {
          const m = dataset.modules.find(x => x.id === otherId);
          if (m) { label = m.title; subtitle = `${m.code} (L${m.level})`; }
        } else if (otherType === 'outcome') {
          const o = dataset.outcomes.find(x => x.id === otherId);
          if (o) { label = o.description; subtitle = o.code; }
        } else if (otherType === 'assessment') {
          const a = dataset.assessments.find(x => x.id === otherId);
          if (a) { label = a.title; subtitle = `${a.type} (${a.weight}%)`; }
        } else if (otherType === 'skill') {
          const s = dataset.skills.find(x => x.id === otherId);
          if (s) { label = s.name; subtitle = s.category; }
        }

        list.push({
          otherId,
          otherType,
          relType: rel.type,
          isOutgoing,
          label,
          subtitle
        });
      }
    });

    return list;
  }, [dataset, selectedId]);

  return (
    <div className="graph-container space-y-4">
      {/* Legend & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl">
        <div className="legend flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-700">Entity Types:</span>
          <div className="legend-item flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
            <span>Module</span>
          </div>
          <div className="legend-item flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
            <span>Outcome</span>
          </div>
          <div className="legend-item flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span>Assessment</span>
          </div>
          <div className="legend-item flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-600"></span>
            <span>Skill</span>
          </div>
        </div>

        <div className="controls flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('all')}
          >
            All ({nodes.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'module' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('module')}
          >
            Modules ({dataset.modules.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'outcome' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('outcome')}
          >
            Outcomes ({dataset.outcomes.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'assessment' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('assessment')}
          >
            Assessments ({dataset.assessments.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'skill' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('skill')}
          >
            Skills ({dataset.skills.length})
          </button>
        </div>
      </div>

      {/* Selection Feedback Banner */}
      <div className="selection-status-bar p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-3">
        {selectedEntity ? (
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span>
              Selected <strong>{selectedEntity.type.toUpperCase()}</strong>: <strong>{selectedEntity.code}</strong> — {selectedEntity.title}
              {' '}({directRelations.length} direct connection{directRelations.length !== 1 ? 's' : ''})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600">
            <span>💡</span>
            <span>Click any entity node to highlight its direct alignment paths and inspect relational details.</span>
          </div>
        )}
        {selectedId && (
          <button
            type="button"
            className="btn btn-outline btn-sm text-[11px] py-1 px-2.5"
            onClick={() => setSelectedId(null)}
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Graph Viewport */}
      <div className="graph-viewport border border-slate-200 rounded-xl bg-white relative overflow-auto" style={{ minHeight: '560px' }}>
        <svg
          className="graph-svg absolute top-0 left-0 pointer-events-none"
          width={svgWidth}
          height={svgHeight}
          style={{ width: svgWidth, height: svgHeight }}
        >
          {sortedEdges.map(edge => {
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

          if (node.type === 'module') {
            const m = dataset.modules.find(x => x.id === node.id);
            label = m?.title || '';
            subtitle = m ? `${m.code} · L${m.level}` : '';
          } else if (node.type === 'outcome') {
            const o = dataset.outcomes.find(x => x.id === node.id);
            label = o?.description || '';
            subtitle = o?.code || '';
          } else if (node.type === 'assessment') {
            const a = dataset.assessments.find(x => x.id === node.id);
            label = a?.title || '';
            subtitle = a ? `${a.type} · ${a.weight}%` : '';
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
              isConnected={connectedNodeIds.has(node.id)}
              isDimmed={isNodeDimmed(node.id)}
              onClick={() => handleNodeClick(node.id)}
            />
          );
        })}
      </div>

      {/* Selected Entity Inspector Panel */}
      {selectedEntity && (
        <div className="entity-inspector-panel p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase text-white ${
                selectedEntity.type === 'module' ? 'bg-blue-600' :
                selectedEntity.type === 'outcome' ? 'bg-emerald-600' :
                selectedEntity.type === 'assessment' ? 'bg-amber-600' : 'bg-purple-600'
              }`}>
                {selectedEntity.type}
              </span>
              <h4 className="text-base font-bold text-slate-800">
                {selectedEntity.code}: {selectedEntity.title}
              </h4>
              {selectedEntity.extra && (
                <span className="text-xs text-slate-500 font-medium">({selectedEntity.extra})</span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm text-xs"
              onClick={() => setSelectedId(null)}
            >
              ✕ Close Inspector
            </button>
          </div>

          <div className="mt-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Direct Relationships ({directRelations.length})
            </h5>
            {directRelations.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No direct relationships recorded for this entity.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {directRelations.map((rel, idx) => (
                  <button
                    key={`rel-${idx}`}
                    type="button"
                    className="p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left transition-all flex flex-col justify-between"
                    onClick={() => setSelectedId(rel.otherId)}
                    title={`Focus on ${rel.subtitle}: ${rel.label}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase">
                        {rel.isOutgoing ? `→ ${rel.relType}` : `← ${rel.relType}`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{rel.otherType}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 line-clamp-1">{rel.subtitle}</div>
                    <div className="text-[11px] text-slate-600 line-clamp-1">{rel.label}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumGraph;
