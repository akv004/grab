# SPEC-0005: Export Panel and File Operations
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

### 4.1 Export Panel (Right-Side)
Position: Fixed vertical strip on the Right side.
Items:
1.  **Copy**: 📋 Big primary button (Copy to Clipboard).
2.  **Save As...**: 💾 Secondary action (with filename preview).
3.  **Reveal**: 📁 "Reveal in Finder".
4.  **Copy Path**: 🔗 Copy file path string.

*Note: No effects or resize options here. pure output.*

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
