# SPEC-0006: Capture Profiles and Smart Library
- **Status**: Draft
- **Owner**: TBD
- **Target Release**: MVP-2
- **Created**: 2026-01-02

## 1. Summary
Enhances the "Recent" sidebar into a "Smart Library" and introduces "Capture Profiles" to allow users to pre-determine capture behavior (Quick vs Edit vs Docs).

## 2. Problem / Motivation
-   **Library**: The current sidebar is a flat list. It needs better organization (grouping by date) and metadata.
-   **Profiles**: Users have different modes of working. Sometimes they want speed (no editor), sometimes precision (immediate edit). Global settings are too rigid.

## 3. Requirements

### 3.1 Smart Library (Sidebar Upgrade)
-   **Grouping**: Group items by "Today", "Yesterday", "Older".
-   **Source Icons**: Show icon for Capture Mode (Fullscreen 🖥, Region ◻, Window ⬛).
-   **Hover Actions**: Quick Copy/Delete buttons on the thumbnail itself.
-   **Drag & Drop**: Drag thumbnail to external apps.

### 3.2 Capture Profiles
Define behavior presets:
1.  **Quick/Raw**: Capture -> Clipboard + Save (No Editor).
2.  **Edit**: Capture -> Open Editor Immediately.
3.  **Documentation**: Capture -> Open Editor + Auto-Highlight (Future).

**Implementation:**
-   Add "Profiles" section in Preferences.
-   Allow mapping shortcuts to specific profiles (e.g., `Cmd+Shift+1` = Quick, `Cmd+Opt+1` = Edit).
-   Add Tray Menu submenu: "Capture via Profile..."

## 4. UX / UI
-   **Sidebar**: Collapsible headers for date groups.
-   **Preferences**: New tab for Profile management.

## 5. Architecture
-   **HistoryStore**: Update to index date groups efficiently.
-   **PreferencesStore**: Add `profiles` array and `shortcutMapping`.
