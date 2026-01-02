# TASK-0006: Settings Window
- **Linked Spec ID**: SPEC-0002
- **Owner**: TBD
- **Status**: Not Started
- **Created**: 2026-01-02
- **Updated**: 2026-01-02

## Scope
Create a minimal settings window to configure output folder, shortcut mappings, and clipboard toggle; opens only on request.

## Steps
1. Build minimal settings UI (renderer) to edit output folder, shortcuts, and clipboard toggle.
2. Persist preferences (e.g., JSON store) and apply to main process capture behavior.
3. Ensure window opens only via menu/settings action and closes cleanly.

## Files to Change
- electron/renderer/settings/*
- electron/main/settings-window.ts
- electron/main/preferences-store.ts

## Test Plan
- Manual: change output folder and confirm capture saves there; toggle clipboard copy; remap shortcuts and validate.
- Unit: preference persistence and IPC wiring.

## Definition of Done Checklist
- [ ] Settings window opens on request and persists changes.
- [ ] Preferences affect capture output and shortcuts.
- [ ] Clipboard toggle honored by capture flow.

## Status Updates
- 2026-01-02: Draft task created.
