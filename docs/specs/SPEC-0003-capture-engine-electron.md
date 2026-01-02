# SPEC-0003: Capture Engine (Electron)
- **Status**: Draft
- **Owner**: TBD
- **Target Release**: MVP-1
- **Created**: 2026-01-02
- **Updated**: 2026-01-02
- **Linked Tasks**: TASK-0007

## 1. Summary
Implement a cross-platform Electron capture engine that can capture full screen, a specific display, a selected window, or a user-defined region. The engine is callable from menu bar actions and global shortcuts, outputs a normalized PNG buffer with metadata, and by default saves to disk and copies to clipboard for downstream export pipelines.

## 2. Problem / Motivation
Users need fast, reliable capture from menu bar or shortcuts without opening a heavy UI. Electron’s desktop capture APIs require a clean engine layer to standardize capture flows, normalize outputs, and hand off images to export/annotation pipelines.

## 3. Goals
- Capture full screen across all displays.
- Capture a specific display when requested.
- Capture a window (choose from available windows).
- Capture a region via a simple selection overlay.
- Output a normalized in-memory PNG buffer (with metadata) to downstream components.
- Default behaviors: save to disk in configured output folder and copy to clipboard with consistent file naming.

## 4. Non-Goals
- Advanced annotation tools beyond placeholder hook.
- Video/GIF capture.
- Cloud sync/sharing integrations.
- OCR.

## 5. User Stories / Use Cases
- As a user, I can trigger a full-screen capture from the menu bar or shortcut and get the file saved plus copied.
- As a user, I can pick a specific display to capture when multiple monitors are connected.
- As a user, I can select a window from a list and capture only that window.
- As a user, I can drag a region overlay to capture a portion of the screen and then continue with my workflow.

## 6. Requirements
### Functional Requirements
1. FR-1: Provide a capture engine API callable by menu bar actions and global shortcuts for modes: full screen, display, window, and region.
2. FR-2: Support targeting a specific display ID; default to primary if not provided.
3. FR-3: Enumerate eligible windows, allow selection, and capture the chosen window while respecting OS-protected windows.
4. FR-4: Provide a region selection overlay (click-drag, resize handles, escape to cancel) that feeds coordinates to the engine.
5. FR-5: Normalize output to PNG buffer with metadata (timestamp, mode, display/window ID, bounds, scale).
6. FR-6: Default export behavior saves to configured output folder with consistent naming and copies image to clipboard; both are toggleable via settings.
7. FR-7: Expose hooks for downstream annotation/export pipelines to receive the normalized buffer.
8. FR-8: Log capture attempts, successes/failures, and emit errors when permissions or resources are unavailable.

### Non-Functional Requirements
- Performance: Initiate capture within 200ms from trigger and produce exportable PNG within 1s on target hardware.
- Reliability: Handle 10 consecutive captures across modes without crash; resilient to unplugged/missing displays.
- Security: Respect OS-level capture permissions; avoid capturing protected content; sanitize file naming to prevent path injection.
- Compatibility: macOS, Windows, and major Linux desktop environments with equivalent behavior where APIs allow.

## 7. UX / UI (if applicable)
- Region selection overlay with crosshair cursor, draggable edges/corners, and cancel/confirm affordances.
- Window selection presented as a lightweight chooser (list or thumbnail) when multiple windows are available.
- Minimal notifications/toasts for success/failure (e.g., “Saved to ~/Pictures/Grab/… and copied”).

## 8. API Contract (if applicable)
```ts
type CaptureMode = "full-screen" | "display" | "window" | "region";

interface CaptureRequest {
  mode: CaptureMode;
  displayId?: string;
  windowId?: string;
  region?: { x: number; y: number; width: number; height: number };
  copyToClipboard?: boolean;
  saveToDisk?: boolean;
}

interface CaptureResult {
  buffer: Buffer; // PNG
  filePath?: string;
  metadata: {
    mode: CaptureMode;
    displayId?: string;
    windowId?: string;
    bounds: { x: number; y: number; width: number; height: number };
    timestamp: string;
    scaleFactor: number;
    fileName?: string;
  };
}
```
Invocation: `captureEngine.capture(request): Promise<CaptureResult>`, resolving after disk/clipboard actions complete.

## 9. Data Model / Storage
- Preferences: output folder path, clipboard toggle, default mode, optional naming template.
- File naming convention: `grab-YYYYMMDD-HHmmss-{mode}-{display|window|region}.png`.
- Metadata stored alongside file (JSON sidecar or in-memory handoff) for downstream workflows.

## 10. Architecture / Flow
```mermaid
graph LR
  Trigger[Menu Bar / Shortcut] --> CE[Capture Engine]
  CE --> Mode[Display/Window/Region Selector]
  Mode --> Capture[Desktop Capture APIs]
  Capture --> Normalize[Normalize + PNG Buffer]
  Normalize --> Export[Export Pipeline]
  Export --> FS[(Output Folder)]
  Export --> CB[(Clipboard)]
  Normalize --> Annotate[Annotation/OCR hooks (future)]
```

## 11. Edge Cases & Error Handling
- Missing permissions → surface OS guidance and error state, do not crash.
- Protected windows (DRM/video) → exclude from selection and log reason.
- Multi-display with different scale factors → normalize coordinates and DPI correctly.
- Output folder missing/unwritable → prompt for new path; still copy to clipboard when enabled.
- Capture target disappears mid-flow (window closed, display unplugged) → abort gracefully and notify.

## 12. Observability (logs/metrics/traces)
- Log events: trigger received, selection started/completed, capture success/failure, export success/failure.
- Metrics: capture duration per mode, failure rates, clipboard copy duration, file write duration, counts per mode.
- Optional trace spans around selection, capture, normalization, export.

## 13. Security & Privacy considerations
- Enforce and respect OS capture permissions; never bypass protected surfaces.
- Avoid logging pixel data; redact sensitive identifiers when logging window names if needed.
- Sanitize output paths/names; ensure temp files are cleaned up.
- Clipboard copies should be explicit and revocable where OS supports it.

## 14. Testing Plan (unit/integration/e2e)
- Unit: coordinate normalization, naming helper, metadata generation, toggle handling.
- Integration: capture per mode yields PNG buffer of expected dimensions; export writes file and clipboard copy when enabled.
- E2E/manual: multi-display capture, window selection accuracy, region overlay UX, permission-denied flow.

## 15. Rollout Plan (feature flags, backward compatibility)
- Feature flag `captureEngine.electron` gated per platform.
- Staged rollout: enable full-screen first, then window/region once stable.
- Fallback: clipboard-only capture when disk write fails; disable capture actions when permissions missing.

## 16. Open Questions
- Should window selection be thumbnail-based or list-only for MVP?
- Do we need per-OS default output folders or a unified app directory?

## 17. Acceptance Criteria
- [ ] Full-screen capture works across multi-display setups and returns normalized PNG buffer.
- [ ] Specific display capture honors requested display ID.
- [ ] Window capture lists available windows (excluding protected) and captures the chosen window.
- [ ] Region capture overlay supports drag/resize and cancellation.
- [ ] Default behavior saves to configured output folder with consistent naming and copies to clipboard.
- [ ] Metadata accompanies capture for downstream annotation/export consumers.

## 18. Change Log
- 2026-01-02: Draft created.
