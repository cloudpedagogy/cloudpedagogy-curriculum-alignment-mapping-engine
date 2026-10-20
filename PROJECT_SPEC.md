# PROJECT_SPEC: Curriculum Alignment & Mapping Engine (CAME)

## 1. Repository Name
`cloudpedagogy-curriculum-alignment-mapping-engine`

## 2. One-Sentence Purpose
A local-first, normalized relationship engine for modeling, authoring, and reviewing programmes, modules, learning outcomes, assessments, and graduate skills in a queryable curriculum graph.

## 3. Problem the Application Solves
Curriculum design data is commonly fragmented across administrative course specifications, institutional syllabi, and assessment briefs. This siloed storage makes it difficult to verify constructive alignment between intended outcomes and summative assessments, evaluate graduate skill coverage across module levels, or identify study progression breaks and prerequisite cycles.

## 4. Primary User / Audience
Curriculum directors, academic quality assurance teams, accreditation evaluators, and educational developers.

## 5. Core Role in the CloudPedagogy Ecosystem
CAME defines the structural "Curriculum Spine" of the CloudPedagogy ecosystem:
- Serves as the foundational structural authoring and alignment verification engine.
- Generates validated relational datasets (`MappingDataset`) that can be exported as standard JSON.
- **Commercial Boundary**: Commercial integration with *CloudPedagogy Curriculum Studio* is planned for future phases; interoperability with Curriculum Studio has not yet been tested or verified in this open-source release.

## 6. Main Entities / Data Structures
All entities are modeled in `src/types/index.ts`:

- **Programme**: Academic award structure defining a degree diet (`id`, `name`, `description?`, `moduleIds: string[]`).
- **Module**: Discrete unit of study (`id`, `code`, `title`, `description?`, `credits`, `level`).
- **LearningOutcome**: Statements of intended capability (`id`, `code`, `description`, `moduleId?`). Can belong to a parent module or exist independently as a programme-level outcome.
- **Assessment**: Evaluative tasks (`id`, `title`, `type`, `weight`, `moduleId?`).
- **Skill**: Graduate attributes and competencies (`id`, `name`, `category`, `description?`).
- **Relationship**: Explicit directional edge connecting two entities (`id`, `sourceId`, `sourceType`, `targetId`, `targetType`, `type`, `metadata?`).
  - Supported types: `aligns`, `assesses`, `develops`, `prerequisite`.
- **MappingDataset**: Unified root data structure (`id`, `name`, `version`, `lastUpdated`, `programmes?`, `modules`, `outcomes`, `assessments`, `skills`, `relationships`, plus optional governance fields).

## 7. Main Workspaces & Workflows
CAME is structured around five specialized workspaces:

1. **Overview Workspace**:
   - Topology & cohesion metrics (total alignments, connected clusters, standalone elements, programme counts).
   - Summary count cards for all core entity types.
   - Prioritised alignment observations (unassessed outcomes, single-module skills, high assessment density).
   - Programme filter selector.
2. **Build Workspace**:
   - Tabular CRUD authoring across Programmes, Modules, Learning Outcomes, Assessments, Skills, and Relationships.
   - Real-time relationship validation: duplicate rejection, entity endpoint type enforcement, and cycle detection.
   - Safe deletion modals with downstream dependency impact analysis.
3. **Explore Workspace**:
   - Interactive multipartite SVG graph (Modules → Outcomes → Assessments → Skills) with smooth cubic bezier curves.
   - Node selection highlighting connected paths and dimming unrelated entities.
   - Entity inspection drawer with one-click relationship traversal.
   - Skill coverage heatmap cross-tabulating competencies against module levels.
   - Progression explorer displaying prerequisite chains and study pathways.
4. **Review Workspace**:
   - Outcome coverage matrix mapping outcomes across module levels with delivered vs assessed status.
   - Assessment structural mapping view verifying weighting totals and outcome mappings.
   - Structural alignment analysis grouping heuristic observations across outcomes, skills, assessments, and progression.
5. **Data Workspace**:
   - Technical data integrity status checking for duplicate IDs, broken references, and missing parent links.
   - Educational design observations separated from structural data errors.
   - JSON export and import with reference sanitization.
   - Demonstration dataset loader with safe overwrite confirmation.
   - Session reset with confirmation modal.
   - Optional capability and governance context documentation panel.

## 8. Relational Validation & Integrity Rules
- **Endpoint Compatibility**:
  - `aligns`: Module → LearningOutcome
  - `assesses`: Assessment → LearningOutcome
  - `develops`: Module → Skill
  - `prerequisite`: Module → Module
- **Duplicate Prevention**: Rejects creation of duplicate edges sharing identical source, target, and relationship type.
- **Acyclic Prerequisite Pathways**: Uses breadth-first search to detect self-prerequisites and direct or transitive dependency cycles, displaying the full cycle path.
- **Safe Deletion Cascades**:
  - Module deletion automatically preserves shared learning outcomes aligned with or assessed by other modules.
  - Deleting an entity cleanly prunes all incident relationships, preventing broken links.
  - Deleting a programme preserves all member modules and their internal mappings.

## 9. Diagnostic Philosophy: Structural Integrity vs Pedagogical Observations
CAME explicitly distinguishes between:
- **Technical Structural Issues**: Software-level data anomalies (e.g., duplicate entity IDs, relationships pointing to non-existent entities). These represent data corruption and are surfaced as system warnings/errors.
- **Educational Design Observations**: Rule-based pedagogical advisories (e.g., unassessed learning outcomes, single-module skills, unlinked modules). These reflect curricular decisions and serve as discussion prompts for academic committees rather than software errors or compliance failures.

## 10. Technology Stack & Deployment Model
- **Frontend Framework**: React 19 + TypeScript.
- **Bundler & Tooling**: Vite 8, ESLint 9.
- **Styling**: Vanilla CSS with curated responsive design tokens.
- **Persistence**: Browser `localStorage` (`curriculum_mapping_dataset`).
- **Dependencies**: Fully deterministic, rule-based algorithmic engine (no backend, no database, no runtime AI or external API dependencies).
- **Deployment**: Pure static bundle deployable to any static host.
