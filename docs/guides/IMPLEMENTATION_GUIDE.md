# Implementation Guide

## Working from a Spec
- Read the spec end-to-end; do not invent requirements.
- Confirm spec status is **Approved** before starting; set to **In Progress** during implementation.
- Ensure each task references a spec ID and is tracked in `docs/tasks/INDEX.md`.

## Coding Standards (adapt to stack)
- Prefer small, composable units; keep side effects isolated.
- Add logging at key decision points and failure paths; avoid sensitive data.
- Validate inputs, handle errors explicitly, and map them to user-friendly outputs.
- Maintain backward compatibility where applicable; use feature flags for rollout.

## Testing Expectations
- Derive tests from **Functional Requirements** and **Acceptance Criteria**.
- Cover unit, integration, and e2e as defined in the spec.
- Include regression checks for edge cases and error handling.

## Traceability
- Update spec and task statuses as progress is made.
- Commit messages should include relevant `SPEC-####` (and task IDs when applicable).
- PR descriptions must list linked Spec ID(s) and Task ID(s), plus check results.
- Update the spec **Change Log** and task **Status updates** with meaningful notes.

## Observability & Security
- Emit structured logs and metrics called out in the spec.
- Avoid logging secrets or personal data; follow least-privilege principles.
