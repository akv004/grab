# SPEC-0004: Editor and Annotation Workflow
- **Status**: Draft
- **Owner**: TBD
- **Target Release**: MVP-1
- **Created**: 2026-01-02
- **Updated**: 2026-01-02
- **Linked Tasks**: TASK-0004, TASK-0005

## 1. Summary
Define the workflow for the Editor Window, including how it is triggered (auto vs manual) and its capabilities (preview, annotation, saving).

## 2. Problem / Motivation
Users found the automatic opening of the editor intrusive for quick captures ("capture desktop screen"). Users need a "Snagit-style" workflow where they can choose to edit *after* capture or open a recent capture manually, rather than being forced into the editor every time.

## 3. Goals
- **Opt-in Editor**: Users can configure whether the editor opens automatically.
- **Manual Access**: Users can open the editor from the Tray menu.
- **Preview & Edit**: The editor displays the most recent capture and allows basic actions (Copy, Save). *Future: Annotations.*

## 4. User Stories
- As a user, I want to capture a screen and have it just save/copy (no window).
- As a user, I want to click "Open Editor" in the tray to see my last capture.
- As a user, I want to toggle "Open Editor after capture" in settings.

## 5. Requirements
### Functional
1.  **Tray Action**: "Open Editor" menu item.
    -   Opens the editor window.
    -   Loads the most recent capture if available.
2.  **Auto-Open Toggle**: A preference `openEditorAfterCapture` (default: `false` for MVP, or user choice).
    -   If `true`, editor opens immediately after capture.
    -   If `false`, notification shows "Click to edit" or similar (or just notification).
3.  **Editor State**:
    -   Should persist window size/position.
    -   Should handle "no capture yet" state gracefully.

### Non-Functional
-   Editor load time < 500ms.
-   Dark mode UI by default.

## 6. UX / UI
-   **Tray Menu**: Add `Open Editor`.
-   **Editor Window**: Simple toolbar (Save, Copy, Close) and Image Canvas.

## 7. Architecture
-   **Renderer**: `src/renderer/` (HTML/CSS/TS).
-   **Preferences**: Add `openEditorAfterCapture` boolean.
-   **IPC**: `SHOW_CAPTURE` event to update renderer.

## 8. Open Questions
-   Should we show a history of captures? (Out of scope for MVP-1).

## 9. Change Log
-   2026-01-02: Initial draft based on user feedback.
