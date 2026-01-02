# TASK-0007: Electron Capture Engine
- **Linked Spec ID**: SPEC-0003
- **Owner**: TBD
- **Status**: Not Started
- **Created**: 2026-01-02
- **Updated**: 2026-01-02

## Scope
Build the Electron capture engine that supports full-screen, display-specific, window, and region capture, normalizes output to PNG buffers with metadata, and triggers default export (save to disk + clipboard).

## Steps
1. Implement capture engine entry points in Electron main for full-screen and specific-display capture.
2. Add window enumeration/selection and capture path with protected window filtering.
3. Implement region selection overlay in renderer and coordinate normalization.
4. Wire normalized PNG buffer to export pipeline with default save + clipboard behaviors and consistent naming.
5. Add logging/telemetry for capture attempts, failures, and export outcomes.

## Files to Change
- electron/main/capture/*
- electron/renderer/overlay/*
- electron/main/export/*
- config/preferences/*

## Test Plan
- Unit: coordinate normalization, naming helper, metadata generation, toggle handling.
- Integration: capture per mode yields PNG buffer of expected dimensions; export writes file and clipboard copy when enabled.
- E2E: multi-display full-screen, window picker accuracy, region overlay UX, permission-denied flow.

## Definition of Done Checklist
- [ ] Full-screen, display, window, and region capture flows implemented.
- [ ] Default save-to-disk and clipboard behaviors wired with consistent naming.
- [ ] Tests updated/added per plan and passing.
- [ ] Logging/telemetry for capture and export outcomes present.
- [ ] Spec change log updated if scope shifts.

## Status Updates
- 2026-01-02: Draft task created.
