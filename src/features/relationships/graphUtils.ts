import type { MappingDataset } from '../../types';

export interface GraphMetrics {
  totalRelationships: number;
  connectedComponents: number;
  orphanedEntities: number;
  isolatedEntityIds: string[];
}

export const calculateGraphMetrics = (dataset: MappingDataset): GraphMetrics => {
  const { modules, outcomes, assessments, skills, relationships } = dataset;
  
  // Combine all entity IDs
  const allEntityIds = new Set<string>([
    ...modules.map(m => m.id),
    ...outcomes.map(o => o.id),
    ...assessments.map(a => a.id),
    ...skills.map(s => s.id)
  ]);

  // Build adjacency list for an undirected graph
  const adj = new Map<string, string[]>();
  allEntityIds.forEach(id => adj.set(id, []));

  relationships.forEach(rel => {
    // Add edges in both directions for connected component analysis
    if (adj.has(rel.sourceId) && adj.has(rel.targetId)) {
      adj.get(rel.sourceId)!.push(rel.targetId);
      adj.get(rel.targetId)!.push(rel.sourceId);
    }
  });

  const visited = new Set<string>();
  let components = 0;
  const isolatedEntityIds: string[] = [];

  allEntityIds.forEach(id => {
    if (!visited.has(id)) {
      components++;
      
      // BFS/DFS to find all nodes in this component
      const stack = [id];
      visited.add(id);
      let componentSize = 0;

      while (stack.length > 0) {
        const node = stack.pop()!;
        componentSize++;
        
        const neighbors = adj.get(node) || [];
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            stack.push(neighbor);
          }
        });
      }

      // If the component size is 1, it's an orphan
      if (componentSize === 1) {
        isolatedEntityIds.push(id);
      }
    }
  });

  return {
    totalRelationships: relationships.length,
    connectedComponents: components,
    orphanedEntities: isolatedEntityIds.length,
    isolatedEntityIds
  };
};
