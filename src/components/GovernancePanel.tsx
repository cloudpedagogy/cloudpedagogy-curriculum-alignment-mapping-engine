import React, { useState } from 'react';
import type { MappingDataset } from '../types';

interface GovernancePanelProps {
  dataset: MappingDataset;
  onUpdate: (dataset: MappingDataset) => void;
}

const GovernancePanel: React.FC<GovernancePanelProps> = ({ dataset, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (field: keyof MappingDataset, value: string) => {
    onUpdate({
      ...dataset,
      [field]: value
    });
  };

  return (
    <div className="governance-panel mt-4" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          padding: '12px 16px', 
          textAlign: 'left', 
          backgroundColor: '#f8fafc', 
          border: 'none', 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#475569',
          fontSize: '14px',
          fontWeight: 500
        }}
      >
        <span>Capability & Governance Notes (Optional)</span>
        <span>{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div style={{ padding: '16px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>AI Involvement</label>
            <textarea 
              value={dataset.aiInvolvement || ''} 
              onChange={(e) => handleChange('aiInvolvement', e.target.value)}
              placeholder="Describe how AI was used in generating or reviewing this mapping..."
              style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Assumptions</label>
            <textarea 
              value={dataset.assumptions || ''} 
              onChange={(e) => handleChange('assumptions', e.target.value)}
              placeholder="List any key assumptions made during this alignment..."
              style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Risks or Concerns</label>
            <textarea 
              value={dataset.risks || ''} 
              onChange={(e) => handleChange('risks', e.target.value)}
              placeholder="Note any potential risks, misalignments, or areas needing review..."
              style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Rationale</label>
            <textarea 
              value={dataset.rationale || ''} 
              onChange={(e) => handleChange('rationale', e.target.value)}
              placeholder="Explain the pedagogical reasoning behind these alignments..."
              style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Human Review Notes</label>
            <textarea 
              value={dataset.reviewNotes || ''} 
              onChange={(e) => handleChange('reviewNotes', e.target.value)}
              placeholder="Document the human review process and any expert judgement applied..."
              style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', minHeight: '60px', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernancePanel;
