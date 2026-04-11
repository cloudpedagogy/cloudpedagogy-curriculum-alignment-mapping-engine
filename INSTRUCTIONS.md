# Curriculum Alignment Mapping Engine — User Instructions

---
### 2. What This Tool Does
This tool allows academic teams to structurally map and align university learning outcomes, assessment components, and professional skills. It provides a visual interface to ensure that the designed curriculum is coherent and well-structured before it is simulated or audited.

---
### 3. Role in the Ecosystem
- **Phase:** Phase 1 — Curriculum Spine
- **Role:** Structural mapping and relational alignment of curriculum entities.
- **Reference:** [../SYSTEM_OVERVIEW.md](../SYSTEM_OVERVIEW.md)

---
### 4. When to Use This Tool
- When designing a new programme or module from scratch.
- When reviewing and adjusting the alignment of existing assessments and learning outcomes.
- To export a structured baseline curriculum for workload simulation or governance checks.

---
### 5. Inputs
- Manual entry of modules, outcomes, assessments, and skills via the browser interface.
- Import of pre-existing curriculum data via a structured JSON file.

---
### 6. How to Use (Step-by-Step)
1. Add programme modules, defining their basic metadata.
2. Define the learning outcomes associated with each module.
3. Add assessment components, indicating their weight and which outcomes they test.
4. Align professional skills or capability frameworks to the relevant modules.
5. Review the alignment to identify any unassessed outcomes or disconnected skills.
6. Export the finalized curriculum map as a JSON file.

---
### 7. Key Outputs
- A cohesive, visual representation of curriculum alignment on-screen.
- A downloadable JSON dataset defining the curriculum structure, ready for downstream processing.

---
### 8. How It Connects to Other Tools
- **Upstream:** Often the starting point; can receive inputs from shared module repositories.
- **Downstream:** Outputs from this tool are directly consumed by the **Curriculum Simulation Tool** and the **Programme Governance Dashboard**.

---
### 9. Limitations
- Does not automatically calculate chronological student workload (this requires the Simulation Tool).
- Provides structural validation only; it does not check the quality or rigor of the text content.

---
### 10. Tips
- Ensure every learning outcome is mapped to at least one assessment to prevent governance warnings downstream.
