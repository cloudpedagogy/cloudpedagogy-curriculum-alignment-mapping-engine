# Curriculum Alignment & Mapping Engine (CAME) — User Instructions

This user guide walks you through navigating CAME, creating and editing curricula, authoring validated relationships, exploring relational topology, reviewing alignment matrices, and managing dataset exports.

---

## 1. Overview & First-Use Experience

When you first open CAME without an active dataset in your browser, you will see the **Welcome Screen** offering three starting points:

1. **Create Blank Curriculum**: Initializes an empty curriculum structure and opens the **Build** workspace so you can begin authoring from scratch.
2. **Import JSON File**: Prompts you to select a previously exported `.json` curriculum dataset from your computer.
3. **Load Example Curriculum**: Loads the curated **BSc Public Health Sciences** demonstration model, illustrating an 8-module undergraduate degree with 16 outcomes, 15 assessments, 10 skills, and intentional pedagogical review observations.

---

## 2. Navigating the Five Workspaces

Use the top navigation bar to switch between the five primary workspaces:

- **📊 Overview**: Review curriculum topology metrics, entity count cards, and high-priority educational observations.
- **🏗️ Build**: Author and edit programmes, modules, learning outcomes, assessments, skills, and relationships.
- **🧭 Explore**: Navigate the interactive multipartite graph, inspect connected entities, and review skill coverage and progression chains.
- **🔍 Review**: Evaluate the outcome coverage matrix, verify assessment weighting distributions, and examine pedagogical alignment heuristics.
- **💾 Data**: Verify technical data integrity, download JSON backups, import curriculum files, reload demo data, or reset your local session.

---

## 3. Authoring Curriculum Entities (Build Workspace)

Select the **Build** workspace to create and edit curriculum elements across six sub-tabs:

### Programmes
- Click **Create Programme** to define an academic degree award.
- Enter the programme name, optional description, and select the modules that constitute its curriculum diet.

### Modules
- Click **Create Module** to define a course unit.
- Provide the module code (e.g. `PUB101`), title, credit value (e.g. `15` or `30`), study level (e.g. `4`, `5`, `6`, or `7`), and optional syllabus description.
- Select which programme(s) include this module.

### Learning Outcomes
- Click **Create Outcome** to define a competency or knowledge statement.
- Enter an outcome code (e.g. `LO1`, `LO2`) and a descriptive statement.
- Optionally associate the outcome with a specific parent module, or leave it unassigned to treat it as an overarching programme-level outcome.

### Assessments
- Click **Create Assessment** to define an evaluative component.
- Specify the title (e.g. `Final Written Examination`), assessment type (`Exam`, `Coursework`, `Practical`, etc.), percentage weighting (e.g. `50`), and the parent module.

### Skills
- Click **Create Skill** to register graduate attributes or professional capabilities.
- Enter the skill name, capability category (e.g. `Research & Inquiry`, `Communication`, `Digital Literacy`), and optional description.

### Safe Deletion & Impact Analysis
- Clicking the **Delete** button on any entity opens an impact confirmation modal.
- The modal details all downstream dependencies (linked assessments, prerequisite chains, shared outcomes, and programme memberships).
- When a module is deleted, any learning outcomes that are shared with other modules are automatically preserved.
- Deleting an entity cleanly unlinks all incident relationships, preventing broken references.

---

## 4. Authoring and Validating Relationships

Navigate to the **Relationships** tab in the **Build** workspace to link curriculum entities.

### Supported Relationship Types
1. **Module Outcome Alignment (`aligns`)**: Connects a teaching module to a learning outcome it delivers.
2. **Assessment Outcome Mapping (`assesses`)**: Maps an assessment task to a learning outcome it evaluates.
3. **Module Skill Development (`develops`)**: Maps a module to a graduate skill it explicitly fosters.
4. **Module Prerequisite (`prerequisite`)**: Specifies that a module requires prior completion of another module.

### Built-in Validation Rules
CAME validates every relationship in real time before creating it:
- **Duplicate Prevention**: If an identical link already exists between the source and target, creation is rejected with an explanatory message.
- **Endpoint Type Verification**: Only valid entity types for that relationship type can be selected.
- **Prerequisite Cycle Detection**: When adding module prerequisites, CAME evaluates direct and transitive dependencies. If a circular path is detected (e.g. `PUB201 → PUB301 → PUB201`), the link is blocked and the full cycle path is displayed so you can resolve the circular dependency.

---

## 5. Visual Exploration (Explore Workspace)

### Interactive Curriculum Graph
- The graph visualises curriculum relationships across four vertical stages: **Modules → Outcomes → Assessments → Skills**.
- **Inspect Entities**: Click any node to select it. The graph will highlight all direct upstream and downstream connections with smooth curves and dim unrelated nodes.
- **Entity Inspector Drawer**: When a node is selected, an inspector panel appears detailing entity metadata, parent associations, and a list of direct connections. Clicking any connected entity in the drawer instantly transitions selection to that entity.
- **Filter by Type**: Use the filter buttons at the top of the graph (`All`, `Modules`, `Outcomes`, `Assessments`, `Skills`) to focus on specific entity types.
- **Keyboard Navigation**: Press `Tab` to navigate between nodes; press `Enter` or `Space` to select or deselect a node.

### Skill Coverage Heatmap
- Located below the graph, the heatmap cross-tabulates graduate skills against modules sorted by study level.
- Identifies where skills are introduced, reinforced, or absent across the curriculum.

### Progression Explorer
- Displays multi-step prerequisite sequences across study levels.
- Identifies potential progression gaps (e.g. higher-level modules lacking foundational prerequisites).

---

## 6. Review & Quality Assurance (Review Workspace)

### Outcome Coverage Matrix
- Cross-tabulates all learning outcomes against modules grouped by academic level.
- Visual badges indicate whether an outcome is taught (`aligns`), formally assessed (`assesses`), or both.
- Identifies outcomes with single vs multi-module reinforcement.

### Assessment Mapping View
- Groups assessment components by module.
- Displays percentage weightings and calculates total module assessment weight (highlighting totals that differ from 100%).
- Flags modules with high assessment density relative to mapped outcomes.

### Structural Alignment Signals
- Rule-based pedagogical observations categorized into four areas:
  - **Outcome Observations**: Unmapped or unassessed outcomes.
  - **Skill Observations**: Skills concentrated in a single module.
  - **Assessment Workload**: High assessment density per outcome.
  - **Architecture & Progression**: Average assessment ratios and prerequisite pathways.
- *Note*: These signals represent heuristic prompts for academic discussion rather than definitive compliance audits.

---

## 7. Data Management & Persistence (Data Workspace)

### Local-First Persistence
- All additions, edits, and deletions persist automatically to your browser's local storage (`curriculum_mapping_dataset`).
- No account registration or internet connection is required.

### Exporting and Importing Data
- **Export JSON**: Click **Export JSON** to download a portable backup file of your curriculum model.
- **Import JSON**: Click **Import JSON** to load a `.json` dataset from your computer. The engine automatically sanitizes imported data, removing any orphaned or broken references.

### Reloading Demo Data and Resetting
- **Load Demo Data**: Reloads the *BSc Public Health Sciences* dataset. If you have active changes in memory, a confirmation modal warns you before overwriting and offers a one-click backup download.
- **Reset Data**: Clears your local browser storage and returns to the initial Welcome Screen. A confirmation dialog prevents accidental data loss.

### Capability and Governance Documentation
- At the bottom of the Data workspace, an optional governance panel allows you to record metadata regarding:
  - AI Involvement in curriculum drafting.
  - Key pedagogical rationale and assumptions.
  - Identified curriculum risks and mitigating actions.
  - Committee review notes and approval records.
- These fields are entirely optional and do not block normal authoring or export workflows.
