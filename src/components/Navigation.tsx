import React from 'react';

export type WorkspaceTab = 'overview' | 'build' | 'explore' | 'review' | 'data';

interface NavigationProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  datasetLoaded: boolean;
}

interface NavItem {
  id: WorkspaceTab;
  label: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: '📊', description: 'Curriculum structure, summary metrics, and prioritised findings' },
  { id: 'build', label: 'Build', icon: '🏗️', description: 'Create and maintain modules, outcomes, and alignment relationships' },
  { id: 'explore', label: 'Explore', icon: '🧭', description: 'Understand relationships, multipartite graphs, and progression chains' },
  { id: 'review', label: 'Review', icon: '🔍', description: 'Evaluate outcome coverage matrix, assessment mappings, and structural signals' },
  { id: 'data', label: 'Data', icon: '💾', description: 'Import, export, validate, and manage curriculum datasets' }
];

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  datasetLoaded
}) => {
  return (
    <nav className="workspace-nav" aria-label="Curriculum workspaces" role="tablist">
      <div className="workspace-tabs flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`workspace-${item.id}`}
              id={`tab-${item.id}`}
              className={`workspace-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              title={item.description}
            >
              <span className="tab-icon">{item.icon}</span>
              <span className="tab-label font-medium">{item.label}</span>
              {item.id === 'data' && !datasetLoaded && (
                <span className="empty-indicator" title="No dataset loaded">●</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
