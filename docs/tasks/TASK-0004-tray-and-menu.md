# TASK-0004: Tray/Menu Bar Setup
- **Linked Spec ID**: SPEC-0002
- **Owner**: TBD
- **Status**: Not Started
- **Created**: 2026-01-02
- **Updated**: 2026-01-02

## Scope
Implement Electron tray/menu bar icon creation with required menu items across macOS, Windows, and Linux.

## Steps
1. Add tray/status bar initialization on app startup.
2. Implement menu items for capture modes, settings, and quit.
3. Ensure macOS status bar style and cross-platform fallbacks.

## Files to Change
- electron/main/tray.ts
- electron/main/menu.ts

## Test Plan
- Manual: verify tray/menu bar appears and menu actions fire handlers on macOS and Windows/Linux.
- Unit: menu construction helpers.

## Definition of Done Checklist
- [ ] Tray/menu bar icon created on startup with required items.
- [ ] Menu actions invoke capture handlers.
- [ ] Status documented in spec change log.

## Status Updates
- 2026-01-02: Draft task created.
