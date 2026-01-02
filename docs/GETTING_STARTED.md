# Getting Started: Spec-Based Development

This repository runs on specs as the source of truth. Every change traces back to a spec and a task.

## Workflow Overview
1. **Propose a feature (create a spec)**
   - Copy an appropriate template from `docs/specs/templates/` (general, API, or UI).
   - Name it `SPEC-####-title.md` (API: `SPEC-####-api.md`, UI: `SPEC-####-ui.md`).
   - Fill required sections, set status to **Draft**, and add it to `docs/specs/INDEX.md`.
   - Request review; move status to **Review** and capture questions/assumptions.
2. **Break work into tasks**
   - Use `docs/tasks/templates/TASK_TEMPLATE.md` and name `TASK-####-short-title.md`.
   - Link to the spec ID, define scope, steps, files, and tests.
   - Add tasks to `docs/tasks/INDEX.md`.
3. **Implement and test**
   - Pick tasks in **In Progress**; update task status as you work.
   - Commit messages should include relevant `SPEC-####` and task IDs; PR descriptions must reference spec and task IDs.
   - Follow `docs/guides/IMPLEMENTATION_GUIDE.md` for coding, logging, and testing expectations.
4. **Record decisions (ADRs)**
   - Significant architectural decisions go to `docs/architecture/adr/` using the ADR template.
   - Link ADRs from `docs/architecture/DECISIONS.md` and from the relevant spec/task change log.
5. **Review and merge (acceptance checklist)**
   - Use `docs/guides/REVIEW_GUIDE.md` for PR review steps and acceptance criteria.
   - Ensure spec status moves to **Approved** before merge; set to **In Progress** during implementation and **Done** once shipped (or **Deprecated** when retired).

## Spec Status Lifecycle
Draft → Review → Approved → In Progress → Done → Deprecated

## AI Agent Operating Rules
- Always read the relevant spec first.
- Do not invent requirements. If a section is missing, ask clarifying questions; otherwise proceed with documented assumptions only.
- Keep assumptions explicit inside the spec (e.g., Change Log or Open Questions).
- Always update spec and task status and change logs as you implement.

## Additional References
- Spec templates and index: `docs/specs/`
- Task templates and index: `docs/tasks/`
- Architecture decisions: `docs/architecture/`
- Guides for authoring, implementation, and review: `docs/guides/`
