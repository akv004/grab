# TASK-0005: Global Shortcuts
- **Linked Spec ID**: SPEC-0002
- **Owner**: TBD
- **Status**: Not Started
- **Created**: 2026-01-02
- **Updated**: 2026-01-02

## Scope
Register global shortcuts for capture modes that work when the app is unfocused and clean up on quit.

## Steps
1. Register Cmd+Shift+1/2/3 for full screen, region, and window capture.
2. Wire shortcuts to capture handlers and confirm operation while unfocused.
3. Unregister shortcuts on quit and handle conflicts gracefully.

## Files to Change
- electron/main/shortcuts.ts
- electron/main/app.ts

## Test Plan
- Manual: trigger shortcuts when app unfocused on macOS and Windows/Linux.
- Unit: shortcut registration logic and conflict handling.

## Definition of Done Checklist
- [ ] Shortcuts registered and trigger capture actions.
- [ ] Shortcuts unregistered on app quit.
- [ ] Conflicts handled and surfaced in settings/logs.

## Status Updates
- 2026-01-02: Draft task created.
