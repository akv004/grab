# Spec Authoring Guide

Good specs remove ambiguity and drive traceability.

## Before You Write
- Confirm the problem and stakeholders.
- Choose the right template (general, API, UI).
- Define scope and non-goals explicitly.

## Writing Tips
- Keep the **Summary** to one paragraph.
- List **Goals** and **Non-Goals** as bullets.
- Capture **User Stories/Use Cases** with actors and outcomes.
- Number **Functional Requirements**; make them testable.
- Include **Non-Functional Requirements** (performance, security, reliability).
- Use **Mermaid** placeholders for flows/architecture.
- Add **API contracts** with request/response examples when relevant.
- Document **Edge Cases**, **Error Handling**, and **Observability** expectations.
- Fill **Testing Plan** and **Acceptance Criteria** as checklists.
- Record **Open Questions** and keep the **Change Log** updated with dates.

## Status & Naming
- Lifecycle: Draft → Review → Approved → In Progress → Done → Deprecated.
- Filenames: `SPEC-####-title.md` (API: `SPEC-####-api.md`, UI: `SPEC-####-ui.md`).
- Update `docs/specs/INDEX.md` when adding or changing a spec.

## Review Expectations
- Another reviewer confirms clarity and testability.
- All open questions addressed or explicitly deferred.
- Traceability to ADRs and tasks is clear.
