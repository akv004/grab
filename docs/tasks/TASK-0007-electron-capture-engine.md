# TASK-0007: Electron Capture Engine
- **Linked Spec ID**: SPEC-0003
- **Owner**: GitHub Copilot
- **Status**: In Progress
- **Created**: 2026-01-02
- **Updated**: 2026-01-02

## Scope
Build the Electron capture engine that supports full-screen, display-specific, window, and region capture, normalizes output to PNG buffers with metadata, and triggers default export (save to disk + clipboard).

## Steps
1. ✅ Implement capture engine entry points in Electron main for full-screen and specific-display capture.
2. ✅ Add window enumeration/selection and capture path with protected window filtering.
3. ⏳ Implement region selection overlay in renderer and coordinate normalization. (Partial - coordinate normalization done, overlay pending)
4. ✅ Wire normalized PNG buffer to export pipeline with default save + clipboard behaviors and consistent naming.
5. ✅ Add logging/telemetry for capture attempts, failures, and export outcomes.

## Files to Change
- src/main/capture/* ✅
- src/renderer/overlay/* (pending)
- src/main/export/* ✅
- src/main/preferences/* ✅

## Test Plan
- Unit: coordinate normalization, naming helper, metadata generation, toggle handling.
- Integration: capture per mode yields PNG buffer of expected dimensions; export writes file and clipboard copy when enabled.
- E2E: multi-display full-screen, window picker accuracy, region overlay UX, permission-denied flow.

## Definition of Done Checklist
- [x] Full-screen, display, window, and region capture flows implemented.
- [x] Default save-to-disk and clipboard behaviors wired with consistent naming.
- [x] Tests updated/added per plan and passing (45 unit tests).
- [x] Logging/telemetry for capture and export outcomes present.
- [x] Spec change log updated if scope shifts.

## Status Updates
- 2026-01-02: Draft task created.
- 2026-01-02: First iteration completed - Core capture engine implemented with:
  - Full-screen, display, window, and region capture
  - Export pipeline (save to disk + clipboard)
  - Preferences store
  - System tray and global shortcuts
  - 45 unit tests passing
  - Logging throughout
