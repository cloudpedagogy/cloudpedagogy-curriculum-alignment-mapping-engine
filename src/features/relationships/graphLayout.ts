import type { EntityType, MappingDataset } from '../../types';

export interface Point {
  x: number;
  y: number;
}

export interface NodePosition {
  id: string;
  type: EntityType;
  x: number;
  y: number;
}

export interface EdgePath {
  id: string;
  sourceId: string;
  targetId: string;
  path: string;
  isActive: boolean;
}

export const COLUMN_SPACING = 340;
export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 86;
export const NODE_SPACING = 24;

const TYPE_ORDER: EntityType[] = ['module', 'outcome', 'assessment', 'skill'];

export const calculateLayout = (
  dataset: MappingDataset,
  selectedId: string | null
): { nodes: NodePosition[]; edges: EdgePath[] } => {
  const nodes: NodePosition[] = [];
  const edges: EdgePath[] = [];

  const columns: Record<EntityType, Array<{ id: string }>> = {
    module: dataset.modules,
    outcome: dataset.outcomes,
    assessment: dataset.assessments,
    skill: dataset.skills
  };

  // 1. Position Nodes
  TYPE_ORDER.forEach((type, colIndex) => {
    const colNodes = columns[type];
    const x = colIndex * COLUMN_SPACING + 40; // Offset from left
    
    colNodes.forEach((node, rowIndex) => {
      const y = rowIndex * (NODE_HEIGHT + NODE_SPACING) + 40;
      nodes.push({ id: node.id, type, x, y });
    });
  });

  // 2. Build map for quick lookup
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // 3. Generate Edges (Filter out prerequisites for multipartite alignment graph)
  dataset.relationships.forEach(rel => {
    if (rel.type === 'prerequisite') return;

    const source = nodeMap.get(rel.sourceId);
    const target = nodeMap.get(rel.targetId);

    if (source && target) {
      // Connect right edge of source node to left edge of target node
      const startX = source.x + NODE_WIDTH;
      const startY = source.y + Math.round(NODE_HEIGHT / 2);
      const endX = target.x;
      const endY = target.y + Math.round(NODE_HEIGHT / 2);

      const cp1x = startX + (endX - startX) / 2;
      const cp2x = startX + (endX - startX) / 2;

      const path = `M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`;
      
      const isActive = selectedId 
        ? (rel.sourceId === selectedId || rel.targetId === selectedId)
        : true;

      edges.push({
        id: rel.id,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        path,
        isActive
      });
    }
  });

  return { nodes, edges };
};
