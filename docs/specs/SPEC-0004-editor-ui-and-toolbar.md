# SPEC-0004: Editor UI and Annotation Toolbar
- **Status**: Draft
- **Owner**: TBD
- **Target Release**: MVP-1
- **Created**: 2026-01-02
- **Updated**: 2026-01-02
- **Linked Tasks**: TASK-0004, TASK-0005

## 1. Summary
Defines the core UI of the Editor Window, specifically focusing on the "Context Toolbar" for annotations and the "Empty State" experience. This spec shifts the editor from a passive viewer to an active workspace.

## 2. Problem / Motivation
Current editor is just a window. Users lack immediate tools to modify capture ("What can I do now?"). Using a floating context toolbar instead of heavy sidebars keeps the experience lightweight and fast ("Snagit-style" but modern).

## 3. Goals
-   **Context Toolbar**: Floating overlay with essential annotation tools.
-   **Empty State**: clear calls to action when no image is loaded.
-   **Visual Polish**: Subtle shadows, animations, and professional feel.

## 4. User Stories
-   As a user, I want to see a toolbar *on* the image to quickly crop or draw.
-   As a user, I want to undo my last annotation.
-   As a user, I want to see "Press Cmd+Shift+2 to capture" when the editor is empty.

## 5. Requirements

### 5.1 Context Toolbar (Floating)
Position: Top-center or Top-right overlay on the canvas.
Tools (MVP):
1.  **Selection/Move**: Default tool.
2.  **Crop**: ✂️ Trim image.
3.  **Box/Rectangle**: 🟥 Draw bounding boxes (red default).
4.  **Blur**: 🔒 Obscure sensitive info (pixelate/blur).
5.  **Undo**: ↩️ Revert last action.

**Future Items (Post-MVP):** Highlights, Pen, Text.

### 5.2 Empty State
When `lastCapturedPath` is null/empty:
-   Display centered widget/text: "Waiting for capture..."
-   Sub-text: "Press ⌘⇧1 for Full Screen, ⌘⇧2 for Region".
-   Button: "Open File..." (Manual load).

### 5.3 Visual Polish
-   **Canvas**: Checkerboard pattern for transparency.
-   **Shadow**: Drop shadow on the image element.
-   **Animation**: Smooth fade-in (150ms) for image load.

## 6. UX / UI Details
-   **Toolbar Style**: Dark glassmorphism background, icon-only buttons with tooltips.
-   **Canvas Interaction**: Pan/Zoom support (essential for large screenshots).

## 7. Architecture
-   **Canvas Tech**: HTML5 Canvas or SVG overlay on top of `<img>`.
    -   *Recommendation*: Use a lightweight library like `Fabric.js` or simple SVG overlay to avoid rebuilding vector logic.
-   **State Management**: Track annotation stack for Undo.

## 8. Change Log
-   2026-01-02: Updated to focus on Toolbar and Empty States based on user feedback.
