# TASK-0001: Capture Engine Setup
- **Linked Spec ID**: SPEC-0001
- **Owner**: TBD
- **Status**: Not Started
- **Created**: 2026-01-02
- **Updated**: 2026-01-02

## Scope
Implement core capture flows for full screen, region, and window, producing image buffers usable by annotation/export.

## Steps
1. Implement full screen capture pipeline.
2. Add region selection overlay and window selection logic.
3. Expose capture outputs to annotation module interface.

## Files to Change
- capture/engine/*
- ui/overlay/*

## Test Plan
- Unit: capture helpers for each mode.
- Integration: end-to-end capture producing expected buffer dimensions.
- E2E: manual capture across modes on target OS.

## Definition of Done Checklist
- [ ] Full screen, region, and window capture working.
- [ ] Tests added/updated and passing.
- [ ] Spec change log updated if scope shifts.
- [ ] Logging for capture attempts/failures present.

## Status Updates
- 2026-01-02: Draft task created.
