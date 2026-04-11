import React, { useMemo } from 'react';
import type { MappingDataset } from '../types';
import { calculateSkillHeatmap } from '../lib/analysis/coverage';

interface SkillCoverageHeatmapProps {
  dataset: MappingDataset;
  moduleIdFilter?: string[];
}

const SkillCoverageHeatmap: React.FC<SkillCoverageHeatmapProps> = ({ dataset, moduleIdFilter }) => {
  const { modules, skills } = dataset;

  const filteredModules = useMemo(() => {
    if (!moduleIdFilter) return modules;
    return modules.filter(m => moduleIdFilter.includes(m.id));
  }, [modules, moduleIdFilter]);

  const sortedModules = [...filteredModules].sort((a, b) => {
    const levelA = parseInt(a.level) || 0;
    const levelB = parseInt(b.level) || 0;
    if (levelA !== levelB) return levelA - levelB;
    return a.code.localeCompare(b.code);
  });

  const heatmap = useMemo(() => calculateSkillHeatmap(dataset), [dataset]);

  const getCoverage = (moduleId: string, skillId: string) => {
    return heatmap.find(h => h.moduleId === moduleId && h.skillId === skillId)?.isCovered;
  };

  return (
    <div className="skill-heatmap-panel p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="panel-header mb-6">
        <h2 className="text-xl font-bold text-slate-800">Skill Coverage Heatmap</h2>
        <p className="text-slate-500">Analysis of direct skill development across module levels (v1: Direct links only).</p>
      </div>

      <div className="overflow-x-auto">
        <table className="heatmap-table w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky-col first-col bg-slate-50 p-3 text-left border border-slate-200 min-w-[200px]">Skill</th>
              {sortedModules.map(m => (
                <th key={m.id} className="module-header p-3 text-center border border-slate-200 bg-slate-50 min-w-[100px]">
                  <div className="text-[10px] text-blue-600 font-bold">L{m.level}</div>
                  <div className="text-xs font-semibold">{m.code}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skills.map(skill => (
              <tr key={skill.id} className="hover:bg-slate-50 transition-colors">
                <td className="sticky-col first-col bg-white p-3 text-sm font-medium border border-slate-200">
                  {skill.name}
                  <div className="text-[10px] text-slate-400 font-normal">{skill.category}</div>
                </td>
                {sortedModules.map(m => {
                  const isCovered = getCoverage(m.id, skill.id);
                  return (
                    <td 
                      key={`${skill.id}-${m.id}`} 
                      className={`p-3 text-center border border-slate-200 ${
                        isCovered ? 'bg-blue-600' : 'bg-slate-50'
                      }`}
                      title={`${skill.name} in ${m.code}`}
                    >
                      {isCovered && (
                        <div className="text-white text-xs font-bold">✓</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-6 mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100 italic text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
          <span>Directly Developed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-100 border border-slate-300 rounded-sm"></div>
          <span>No Direct Relationship</span>
        </div>
      </div>
    </div>
  );
};

export default SkillCoverageHeatmap;
