import React from 'react';

interface MethodologySectionProps {
  title: string;
  children: React.ReactNode;
}

const MethodologySection: React.FC<MethodologySectionProps> = ({ title, children }) => (
  <div className="methodology-section mb-6">
    <h3 className="section-title mb-2">{title}</h3>
    <div className="section-content text-secondary text-sm">
      {children}
    </div>
  </div>
);

interface MethodologyPanelProps {
  onClose: () => void;
}

const MethodologyPanel: React.FC<MethodologyPanelProps> = ({ onClose }) => {
  return (
    <div className="methodology-modal-overlay">
      <div className="methodology-modal-panel">
        <div className="modal-header">
          <h2>Governance & Methodology</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content p-6 overflow-y-auto">
          <div className="methodology-intro mb-6">
            <p>This tool is designed to provide a structural foundation for curriculum architecture. It serves as an interpretive aid for academic leadership and curriculum designers, reinforcing the role of professional judgement in alignmnent mapping.</p>
          </div>

          <MethodologySection title="1. What This Tool Does">
            <ul className="list-disc pl-5">
              <li>Represents curriculum architecture as a relational graph.</li>
              <li>Maps explicit connections between modules, outcomes, assessments, and skills.</li>
              <li>Identifies structural signals (gaps, density, concentration).</li>
              <li>Provides real-time feedback on the architectural impact of structural changes.</li>
            </ul>
          </MethodologySection>

          <MethodologySection title="2. What This Tool Does NOT Do">
            <div className="outcome-tag mb-3">Notice: Non-Prescriptive System</div>
            <ul className="list-disc pl-5">
              <li>**No Workload Simulation**: It does not model time or student/staff workload dynamics.</li>
              <li>**No Performance Scoring**: It does not assign weighted grades or evaluate content quality.</li>
              <li>**No Pathway Generation**: It does not construct personalized student routes or personalized learning plans.</li>
              <li>**No AI Refactoring**: It does not automatically merge, rewrite, or synthesize curriculum content.</li>
            </ul>
          </MethodologySection>

          <MethodologySection title="3. How Alignment is Identified">
            <p className="mb-2">Alignment is defined through explicit 1:1 or 1:N structural relationships. No connections are inferred implicitly by the system.</p>
            <ul className="list-disc pl-5">
              <li>**Module Alignment**: Connects a high-level module to specific Learning Outcomes.</li>
              <li>**Assessment Anchoring**: Links a specific assessment task to the Learning Outcome(s) it formally validates.</li>
              <li>**Skill Development**: Maps modules to the core skills they are designed to develop.</li>
            </ul>
          </MethodologySection>

          <MethodologySection title="4. How Structural Signals are Generated">
            <p className="mb-2">Signals are derived from graph metrics using deterministic logic:</p>
            <ul className="list-disc pl-5">
              <li>**Gaps**: Identified when an entity (like an outcome) is not reachable via explicit relationships.</li>
              <li>**Density**: Calculated by comparing relationship volumes (e.g., assessments per outcome).</li>
              <li>**Orphans**: Detected when nodes exist without any incoming or outgoing edges.</li>
            </ul>
          </MethodologySection>

          <MethodologySection title="5. Interpretation Guidance">
            <div className="disclaimer-banner">
              <div>
                <p><strong>Important: Descriptive, Not Evaluative</strong></p>
                <p>Validation and diagnostic signals are strictly **descriptive**. For example, "High Assessment Density" is a structural observation, not an evaluative judgement of over-assessment. All signals require academic context to interpret and resolve.</p>
              </div>
            </div>
          </MethodologySection>
        </div>

        <div className="modal-footer p-4 border-t border-border-color bg-tertiary text-center">
          <p className="text-secondary text-xs">Curriculum Alignment & Mapping Engine • Governance Release v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default MethodologyPanel;
