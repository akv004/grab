# Modern Editor UX Proposal
**Philosophy**: "Calm, Intent-Driven Canvas"

## 1. The Core Shift
We are moving from a **Toolbox** metaphor (Snagit: "Here are 50 tools, pick one") to a **Studio** metaphor (Grab: "Here is your image, what's the one thing you want to do?").

**The New Layout:**
```
+---------------------------------------------------------------+
|  [Sidebar: Recent]  |        [  Floating Toolbar  ]         | [Side: Export] |
|                     |                                         |                |
|  Current Capture    |          (IMAGE CANVAS)               | Copy           |
|  Yesterday          |                                         | Save           |
|                     |                                         | Reveal         |
|                     |                                         |                |
+---------------------------------------------------------------+
```

## 2. Layout Breakdown

### A. The Stage (Canvas)
-   **Visuals**: Dark grey background (`#1e1e1e`), subtle drop shadow on the image.
-   **Interaction**: Pan/Zoom enabled.
-   **Empty State**: "Press ⌘⇧1 to Capture" (Calm typography).

### B. Context Toolbar (Top-Center, Floating)
*Appears only when mouse enters canvas.*
**Tools (Left to Right):**
1.  **Crop (C)**: Standard crop.
2.  **Focus (F)**: **(Star Feature)** Draws a "spotlight". Everything *outside* the box is dimmed (opacity 50%) and slightly blurred. Inside stays sharp. Great for bug reports.
3.  **Text (T)**: Simple bold text overlay.
4.  **Blur (B)**: Pixelate sensitive data.
5.  **Undo (⌘Z)**: Revert.
6.  **More (...)**: Hidden menu for less used items (Arrow, Box).

### C. Export Panel (Right, Fixed)
*No "Tools" here. Only "Outcomes".*
**Items:**
-   **Primary Action**: Big "Copy" button (Default action).
-   **Secondary**: "Save As..." (Filename preview: `capture-2024...png`).
-   **Utility**: "Reveal in Finder", "Copy Path".
-   **Status**: "Saved locally" indicator.

### D. Recent Sidebar (Left, Collapsible)
-   **Grouping**: "Today", "Yesterday".
-   **Density**: Cozy. No dates, just time and mode icon.

## 3. Why This is Faster than Snagit
1.  **Fewer Decisions**: Snagit shows effects, borders, shadows, and stamps immediately. We show *nothing* until you ask.
2.  **Focus Tool**: Replaces the 3-step workflow (Draw Box -> Set Color -> Dim Background) with **1 click**.
3.  **Separation of Concerns**:
    -   *Editing* happens in the **Center** (Toolbar).
    -   *Using* happens on the **Right** (Export).
    -   *History* happens on the **Left**.
    -   Your eyes don't bounce around looking for "Save".

## 4. Implementation Priorities
1.  **Move Toolbar**: Center align, add hover animation.
2.  **Build "Export" Panel**: Create the right vertical strip.
3.  **Implement Focus Tool**: This is the "Wow" factor.
4.  **Refine Sidebar**: Add date grouping.

## 5. Keyboard Shortcuts
-   `C` -> Crop Mode
-   `F` -> Focus Mode
-   `Esc` -> Cancel / Exit
-   `⌘+C` -> Copy Result
-   `⌘+S` -> Save/Update
