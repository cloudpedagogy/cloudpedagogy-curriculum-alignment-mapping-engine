import React from 'react';
import type { Programme } from '../../types';

interface ProgrammeSelectorProps {
  programmes: Programme[];
  activeProgrammeId: string | null;
  onSelectProgramme: (id: string | null) => void;
}

const ProgrammeSelector: React.FC<ProgrammeSelectorProps> = ({ 
  programmes, 
  activeProgrammeId, 
  onSelectProgramme 
}) => {
  if (programmes.length === 0) return null;

  return (
    <div className="programme-selector-container mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-slate-700">Scope View:</label>
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeProgrammeId === null 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-300 hover:border-blue-400'
            }`}
            onClick={() => onSelectProgramme(null)}
          >
            All Modules
          </button>
          
          {programmes.map(p => (
            <button
              key={p.id}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeProgrammeId === p.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-300 hover:border-blue-400'
              }`}
              onClick={() => onSelectProgramme(p.id)}
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      {activeProgrammeId && (
        <div className="mt-2 text-xs text-slate-500 italic">
          {programmes.find(p => p.id === activeProgrammeId)?.description}
        </div>
      )}
    </div>
  );
};

export default ProgrammeSelector;
