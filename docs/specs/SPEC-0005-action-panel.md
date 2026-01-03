# SPEC-0005: Action Panel and File Operations
- **Status**: Draft
- **Owner**: TBD
- **Target Release**: MVP-2
- **Created**: 2026-01-02

## 1. Summary
Defines the "Right-Side Actions Panel" to turn the editor into a hub. Focuses on export, file management, and quick sharing actions.

## 2. Problem / Motivation
Users need clear "Next Steps" after editing. The actions should be distinct from editing tools. A dedicated vertical strip for file operations separates "modifying" (Toolbar) from "using" (Action Panel).

## 3. Goals
-   Provide quick access to common file operations (Copy, Save, Delete).
-   Expose file metadata (location, size).

## 4. Requirements

### 4.1 Actions Panel
Position: Vertical strip on the Right side of the window.
Widgets:
1.  **Copy**: 📋 Copy image to clipboard.
2.  **Save/Save As**: 💾 Trigger save dialog or overwrite.
3.  **Reveal**: 📁 "Show in Finder".
4.  **Copy Path**: 🔗 Copy file path string.
5.  **Delete**: 🗑 Move to Trash (with confirmation).

### 4.2 File Status
-   Show "Saved" indicator.
-   Show basic resolution/size info (e.g., "1920x1080 • 1.2MB").

## 5. UX / UI
-   **Style**: Sidebar fixed width (e.g., 60px or 200px expanded).
-   **Icons**: Clear, standard iconography.

## 6. Architecture
-   **Renderer**: Flexbox layout right-column.
-   **IPC**:
    -   `FILE_ACTION`: Channel to handle Reveal, Delete, Save As in Main process.
