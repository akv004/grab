# Review Guide

## PR Checklist
- References Spec ID(s) and Task ID(s) in the description.
- Spec status is appropriate (Approved or In Progress) and Change Log updated.
- Tasks list is current; statuses reflect reality.
- Tests added/updated per Testing Plan and Acceptance Criteria.
- Traceability to ADRs where architectural decisions were made.

## Quality Bar
- Requirements and acceptance criteria are met; no unexplained deviations.
- Code is readable, minimal, and consistent with existing style.
- Error handling, logging, and observability match the spec.
- Security/privacy considerations addressed; no sensitive data logged.
- Rollout/feature-flag plans are in place if required.

## Review Outcomes
- **Approve** when criteria met and risks understood.
- **Request changes** with clear blocking reasons tied to the spec.
- Ensure status transitions: move spec/task to **Done** when shipped, or **Deprecated** when retired.
