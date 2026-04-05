# Curriculum Alignment & Mapping Engine: User Instructions

This document provides detailed guidance on how to use the **Curriculum Alignment & Mapping Engine** for structural curriculum design, alignment auditing, and exploratory refactoring.

## 1. Getting Started

### Initial State
When you first open the application, the dashboard will be empty. You have several options to begin:
- **🚀 Load Demo Data**: Instantly populates the engine with a synthetic "Global Public Health & Epidemiology" curriculum.
- **📥 Import JSON**: Load a previously exported curriculum mapping dataset.
- **🏗️ Structure Explorer**: Start from scratch by adding your first module.

---

## 2. Navigating the Views

### Alignment Map (The Graph)
The central SVG graph represents your curriculum architecture.
- **Selection**: Click any entity (Module, Outcome, Assessment, Skill) to highlight its immediate structural relationships.
- **Nodes**:
  - **Modules (Blue)**: The core teaching units.
  - **Outcomes (Pink)**: The formal Learning Outcomes.
  - **Assessments (Green)**: The tasks that validate learning.
  - **Skills (Yellow)**: The professional capabilities developed.

### Outcome Coverage Matrix
A system-level heatmap showing how your Learning Outcomes are supported across different academic levels (L4-L6).
- **Gaps**: Rows with no markers indicate unmapped outcomes.
- **Concentration**: Multiple markers in a single row indicate high outcome repetition.
- **Direct Edit**: Use the **✕** button on module headers to remove a module from the curriculum.

### Assessment Mapping View
A hierarchical breakdown showing the path from Modules to Assessments and finally to the Outcomes they assess.
- **Weights**: Displays the descriptive weighting of each assessment.
- **Direct Edit**: Use the **✕** button on assessment cards to remove an assessment.

---

## 3. Structural Change Exploration

Click the **🏗️ Structure Explorer** button to open the side panel.

### Add Module
1. Enter a **Module Code** (e.g., PH101) and **Title**.
2. Select the **Academic Level** (4, 5, or 6).
3. Click "Add Module". The graph and matrices will update instantly.

### Manage Links (Relationships)
Use the human-readable dropdowns to define explicit ties:
- **Aligns**: Link a Module to a Learning Outcome.
- **Assesses**: Link an Assessment to the Outcome it validates.
- **Develops**: Link a Module to a specific Skill.
- **Prerequisite**: Define structural dependencies between Modules.

---

## 4. System Health & Validation

The **System Health** bar at the top monitors your curriculum for structural errors.
- **Broken Links**: Relationships pointing to entities that have been deleted.
- **Duplicate IDs**: Multiple entities sharing the same identifier.
- **Orphans**: Modules or outcomes with zero connections.
- **Missing References**: Outcomes claiming to belong to non-existent modules.

*Always address these warnings to ensure your alignment analysis is accurate.*

---

## 5. Exports & Data Management

- **📤 Export JSON**: Saves your current curriculum map to your local machine.
- **🧹 Reset Data**: Clears the current session and restores the engine to an empty state.
- **How this works**: Click the **📖 How this works** button in the header to view the formal methodology and governance disclaimers.

---
**Note**: This tool is designed for **structural auditing**. It does not perform student workload simulation or automated performance grading. Always interpret signals through the lens of academic judgement.
