# TASK-0002: Annotation and Export
- **Linked Spec ID**: SPEC-0001
- **Owner**: TBD
- **Status**: Not Started
- **Created**: 2026-01-02
- **Updated**: 2026-01-02

## Scope
Provide basic annotation tools (arrow, rectangle, text) and export pipeline to PNG/JPEG with clipboard support.

## Steps
1. Implement annotation overlay tools and rendering onto captures.
2. Add export options for PNG/JPEG and clipboard copy.
3. Handle failure paths (disk errors, unsupported formats).

## Files to Change
- annotation/*
- export/*

## Test Plan
- Unit: annotation rendering utilities; export format handlers.
- Integration: annotate then export flows.
- E2E: user flow from capture to annotated export and clipboard copy.

## Definition of Done Checklist
- [ ] Annotation tools usable and render correctly.
- [ ] Exports succeed for PNG/JPEG; clipboard copy works.
- [ ] Tests added/updated and passing.
- [ ] Spec change log updated for scope adjustments.

## Status Updates
- 2026-01-02: Draft task created.
