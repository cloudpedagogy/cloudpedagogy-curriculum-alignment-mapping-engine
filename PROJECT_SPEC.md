# PROJECT_SPEC: cloudpedagogy-curriculum-alignment-mapping-engine

## 1. Repo Name
`cloudpedagogy-curriculum-alignment-mapping-engine`

## 2. One-Sentence Purpose
A normalized relationship engine for mapping modules, learning outcomes, assessments, and skills into a coherent, queryable curriculum graph.

## 3. Problem the App Solves
Disconnected curriculum data (stored in silos) makes it impossible to verify alignment between outcomes and assessments or identify sequential skill development across an entire programme.

## 4. Primary User / Audience
Curriculum leads, quality assurance teams, and programme examiners.

## 5. Core Role in the CloudPedagogy Ecosystem
The "Source of Truth" for curriculum structure; defines the structural relationships that all other curriculum tools (Simulation, Dashboard, SDK) utilize for data flow.

## 6. Main Entities / Data Structures
- **Module**: High-level unit of curriculum (Title, Code, Level, Credits).
- **LearningOutcome**: Statements explicitly linked to modules.
- **Assessment**: Evaluation tasks (Exam, Coursework, etc.) linked to modules.
- **Skill**: Capability units (Name, Category).
- **Relationship**: The "Edge" data structure connecting any two entities (Outcome -> Skill, Assessment -> Outcome) with type-specific metadata (Aligns, Assesses, Develops).
- **MappingDataset**: The unified collection of all nodes and edges.

## 7. Main User Workflows
1. **Entity Population**: Define modules, outcomes, assessments, and skills.
2. **Alignment Mapping**: Establish typed relationships between entities (e.g., mapping a Skill to a Module it develops).
3. **Graph Analysis**: Review curriculum coverage and identifies orphan entities.
4. **Data Sync**: Export the dataset for use in simulation or governance tools.

## 8. Current Features
- Normalized, graph-based data model.
- Support for 4 core relationship types (`aligns`, `assesses`, `develops`, `prerequisite`).
- Interactive mapping UI with entity cross-linking.
- Persistent local storage (`curriculum_mapping_dataset`).
- Robust JSON Import/Export.

## 9. Stubbed / Partial / Incomplete Features
- Multi-programme alignment (Programme-to-Programme) is listed as a potential expansion.

## 10. Import / Export and Storage Model
- **Storage**: Browser `localStorage`.
- **Import/Export**: Full JSON `MappingDataset` structure for portability.

## 11. Relationship to Other CloudPedagogy Apps
Primary data provider for the `cloudpedagogy-integration-sdk` and the `shared-schema.json`; informs the visual hierarchies in the Governance Dashboard.

## 12. Potential Overlap or Duplication Risks
Overlaps with institutional Curriculum Management Systems (CMS); distinguished by its obsessive focus on "Skill-to-Outcome" relationship granularity.

## 13. Distinctive Value of This App
The most "Normalized" tool in the ecosystem; it ignores nesting where possible, treating every link as a first-class `Relationship` entity.

## 14. Recommended Future Enhancements
(Inferred) Visual graph explorer for interactive curriculum navigation; automated gap analysis (e.g. Outcomes with no linked Assessment).

## 15. Anything Unclear or Inferred from Repo Contents
Institutional credit-weight logic is inferred to be metadata on the `Module` entity rather than a core part of the `Relationship` logic in the current prototype.
