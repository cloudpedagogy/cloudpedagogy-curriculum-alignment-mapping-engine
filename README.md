# Curriculum Alignment & Mapping Engine (CAME)

A local-first, professional-grade open-source web application for curriculum architecture, relational alignment mapping, and educational structure review.

CAME provides academic leaders, curriculum designers, and quality assurance teams with a high-fidelity environment to model, inspect, and evaluate relationships between programmes, modules, learning outcomes, assessments, and graduate skills.

---

## 🎯 Target Audience & Purpose

CAME is designed for:
- **Curriculum Leaders & Programme Directors**: Designing new awards, restructuring course diets, or preparing for periodic academic review.
- **Academic Quality & Accreditation Teams**: Verifying constructive alignment, identifying assessment load distribution, and auditing competency coverage.
- **Educational Developers & Teaching Fellows**: Mapping module learning outcomes to summative assessments and tracking vertical progression across study levels.

### What CAME Does
- **Normalises Curriculum Topology**: Models educational structures as an explicit, queryable multipartite graph connecting programmes, modules, learning outcomes, assessments, and skills.
- **Validates Relational Integrity**: Enforces directional validity across relationship types, prevents duplicate links, and detects direct and transitive prerequisite dependency cycles.
- **Distinguishes Integrity from Pedagogical Heuristics**: Strictly separates technical data-integrity issues (such as broken links or duplicate IDs) from constructive educational observations (such as unassessed outcomes or single-module skill development).
- **Protects Relational Consistency**: Implements safe deletion cascades with impact analysis, preserving shared learning outcomes and cleanly unlinking incident relationships.
- **Maintains Total Privacy**: Operates fully client-side in the browser with zero backend dependencies, persisting data directly in local browser storage.

---

## 🏛️ The Five Workspaces

CAME is organized into five specialized workspaces accessible via the top navigation bar:

### 1. 📊 Overview
- **Curriculum Topology & Cohesion**: Displays alignment counts, connected curriculum clusters, defined programmes, and unlinked elements, with expandable graph topology metrics.
- **Primary Metrics**: Immediate counts of active modules, learning outcomes, assessments, and skills.
- **Prioritised Alignment Observations**: Highlights key pedagogical review items, including unassessed outcomes, weakly reinforced skills, and assessment-dense modules.
- **Programme Selector**: Filter the curriculum view to a specific degree programme or examine the entire institution-wide portfolio.

### 2. 🏗️ Build (Curriculum Authoring)
- **Entity Management**: Dedicated authoring interfaces across six tabs:
  - **Programmes**: Create and configure degree programmes and assign module diets.
  - **Modules**: Define module code, title, credit weight, study level, and optional descriptions.
  - **Learning Outcomes**: Draft outcomes, associate them with parent modules or maintain them as independent programme-level outcomes.
  - **Assessments**: Configure assessment components, evaluation types, percentage weightings, and parent module associations.
  - **Skills**: Define graduate capabilities and competencies grouped by categories.
  - **Relationships**: Author validated connections between curriculum entities.
- **Relationship Types Supported**:
  - `aligns` (*Teaching Module → Learning Outcome*): Records that a module delivers or covers a specific learning outcome.
  - `assesses` (*Assessment Task → Learning Outcome*): Maps an assessment component to the outcome it formally evaluates.
  - `develops` (*Teaching Module → Graduate Skill*): Documents where a module explicitly develops a graduate capability.
  - `prerequisite` (*Dependent Module → Required Prior Module*): Establishes sequential study dependencies between modules.
- **Authoring Validation**:
  - Rejects invalid entity pairings (e.g. attempting to map a skill as a module prerequisite).
  - Prevents duplicate relationships with identical source, target, and type.
  - Rejects self-referencing prerequisites (a module requiring itself).
  - Uses breadth-first search to detect direct and transitive dependency cycles (e.g. `MOD101 → MOD201 → MOD101`), displaying the full cycle path.
- **Safe Deletion with Impact Analysis**:
  - Modal confirmation previews all downstream dependencies prior to deletion.
  - Deleting a module preserves shared outcomes aligned with other modules.
  - Deleting assessments, outcomes, or skills safely prunes incident edges while leaving parent and sibling entities intact.
  - Deleting a programme removes only the grouping structure; all underlying modules and mappings remain intact.

### 3. 🧭 Explore (Topology & Visualisation)
- **Interactive Multipartite Graph**:
  - Visualises curriculum flow across four progressive columns: **Modules → Outcomes → Assessments → Skills**.
  - Interactive click selection highlights direct upstream and downstream pathways with smooth cubic bezier curves and dims unrelated nodes.
  - Entity-type filtering buttons with live entity counts.
  - **Entity Inspection Drawer**: Details selected entity attributes, parent associations, and provides one-click relationship traversal to jump across connected entities in the graph.
  - Accessible keyboard navigation (`Tab`, `Enter`, `Space`) with ARIA roles and labels.
- **Skill Coverage Heatmap**:
  - Cross-tabulates graduate skills against modules ordered by study level, identifying where professional competencies are embedded.
- **Dependency & Progression Explorer**:
  - Identifies multi-stage prerequisite chains (e.g. Level 4 → Level 5 → Level 6 study pathways) and flags disconnected module levels.

### 4. 🔍 Review (Alignment & Quality Assurance)
- **Outcome Coverage Matrix**:
  - Level-grouped matrix evaluating learning outcomes against modules.
  - Distinguishes where an outcome is delivered (`aligns`), formally evaluated (`assesses`), or both.
  - Highlights outcome distribution and flags unassessed outcomes.
- **Assessment Structural Mapping**:
  - Reviews assessment components by module, verifying total weighting distribution (target 100%) and mapping coverage.
  - Flags modules with high assessment density relative to mapped outcomes.
- **Structural Alignment Analysis**:
  - Synthesises heuristic pedagogical signals across outcome coverage, skill development, assessment workload, and study progression.

### 5. 💾 Data (Health & Local Persistence)
- **Technical Data Integrity Diagnostics**:
  - Continuous validation checking for duplicate IDs, broken relationship references, and missing parent references.
  - Displays explicit status (`✓ Technically Consistent` or detailed structural error cards).
- **Educational Design Observations**:
  - Pedagogical advisories (unassessed outcomes, unlinked modules, undeveloped skills) categorized clearly as design discussion prompts rather than technical bugs.
- **Dataset Operations**:
  - **Export JSON**: Download the complete curriculum structure as a portable, standardized JSON file.
  - **Import JSON**: Load an existing curriculum dataset from local disk with automatic reference sanitization.
  - **Load Demo Data**: Load the comprehensive *BSc Public Health Sciences* demonstration model (includes safe overwrite warning).
  - **Reset Data**: Clear the local browser workspace and return to the first-use screen with confirmation safeguard.
- **Capability & Governance Panel**:
  - Optional metadata capture for documenting AI involvement, design rationale, assumptions, risks, and committee review notes.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18.0.0 or higher.
- **npm**: Version 9.0.0 or higher.

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/cloudpedagogy/cloudpedagogy-curriculum-alignment-mapping-engine.git
cd cloudpedagogy-curriculum-alignment-mapping-engine
npm install
```

### Running Locally
Start the local Vite development server:
```bash
npm run dev
```
Open your browser to the displayed URL (typically `http://localhost:5173/`).

### Running Tests
Execute the automated test suite (42 tests verifying relationship validation, cycle detection, safe deletion cascades, referential integrity, and diagnostics):
```bash
npm test
```

### Building for Production
Compile the TypeScript code and generate the optimized static production bundle:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```
Or serve the static `dist/` directory using any HTTP server:
```bash
python3 -m http.server 8000 --directory dist
```

---

## 🏁 First-Use Experience

When launched without an existing dataset in local storage, CAME presents a guided welcome screen offering three entry pathways:

1. **Create Blank Curriculum**: Starts with a clean slate (`New Curriculum Model`), opening the **Build** workspace immediately so you can define programmes, modules, and outcomes from scratch.
2. **Import JSON File**: Allows loading any previously exported CAME JSON dataset from your computer.
3. **Load Example Curriculum**: Loads the curated **BSc Public Health Sciences** demonstration dataset. This dataset illustrates an 8-module undergraduate degree across Levels 4, 5, and 6 with 16 outcomes, 15 assessments, 10 skills, and intentional curriculum gaps designed to demonstrate diagnostic signals.

---

## 💾 Data Model & Storage

### Storage
All curriculum data is saved automatically to the browser's `localStorage` under the key `curriculum_mapping_dataset`. No data is ever transmitted to remote servers.

### Core JSON Schema (`MappingDataset`)
```typescript
interface MappingDataset {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  programmes?: Programme[];
  modules: Module[];
  outcomes: LearningOutcome[];
  assessments: Assessment[];
  skills: Skill[];
  relationships: Relationship[];

  // Optional governance & pedagogical context
  aiInvolvement?: string;
  assumptions?: string;
  risks?: string;
  rationale?: string;
  reviewNotes?: string;
}
```

### Relationship Schema (`Relationship`)
```typescript
interface Relationship {
  id: string;
  sourceId: string;
  sourceType: 'module' | 'outcome' | 'assessment' | 'skill';
  targetId: string;
  targetType: 'module' | 'outcome' | 'assessment' | 'skill';
  type: 'aligns' | 'assesses' | 'develops' | 'prerequisite';
  metadata?: Record<string, unknown>;
}
```

---

## 🛡️ Boundaries & Important Limitations

1. **Standalone Open-Source Tool**: CAME is a self-contained, client-side web application. It requires no backend server, database, or external AI/LLM service to run.
2. **Ecosystem & Commercial Boundaries**: In the CloudPedagogy ecosystem, CAME serves as the foundational curriculum spine. Commercial integration with *CloudPedagogy Curriculum Studio* is planned for future phases; **interoperability with Curriculum Studio has not yet been tested or verified in this open-source release**.
3. **Pedagogical Heuristics vs Quality Audits**: Diagnostic indicators generated by CAME (such as assessment density or unassessed outcomes) are rule-based structural observations intended to prompt collegial discussion in curriculum committees. They **do not constitute normative judgements or compliance audits of educational quality**.
4. **Synthetic Demonstration Data**: All example data included in the demonstration dataset are synthetic models created for illustrative and testing purposes.
5. **Single-User Local Storage**: Browser `localStorage` is scoped to the specific browser and machine used. To share curricula across teams, use the **Export JSON** and **Import JSON** workflows.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

Copyright (c) 2026 Jonathan Wong.
