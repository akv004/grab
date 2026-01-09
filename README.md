<div align="center">
  <img src="assets/icon.png" alt="Grab Icon" width="150" height="150">
  
  # grab
  
  A lightweight, developer-friendly tool for capturing, annotating, and exporting on-screen visuals for documentation, debugging, and knowledge sharing.
</div>

## Overview
- Capture full screen, application windows, or custom regions.
- Add quick annotations like arrows, rectangles, and text.
- Export to PNG/JPEG or copy straight to the clipboard.

## Screenshots

<div align="center">
  <img src="assets/screen2.png" alt="Grab Application Icon" width="200">
  <p><em>Grab Application Icon</em></p>
</div>

<div align="center">
  <img src="assets/screen1.png" alt="Grab Application Icon" width="600">
  <p><em>Grab Application Icon</em></p>
</div>

<!-- Application screenshots will be added here -->

## Download Pre-built Binaries

**Best Practice:** This repository follows industry-standard practices by keeping built binaries out of git. Binaries are distributed through GitHub Actions and Releases. [Learn more about our distribution strategy →](docs/DISTRIBUTION.md)

### For Development Builds (Latest from main branch)
Cross-platform binaries are automatically built for every commit to the `main` branch:

1. Go to the [Actions tab](https://github.com/akv004/grab/actions/workflows/build.yml)
2. Click on the latest successful workflow run with a green checkmark
3. Scroll down to the **Artifacts** section
4. Download the binary for your platform:
   - **macOS**: `macos-binaries` (contains .dmg installer and .zip archive)
   - **Linux**: `linux-binaries` (contains .AppImage portable and .deb package)
   - **Windows**: `windows-binaries` (contains .exe installer and .zip portable)

**Note**: Development build artifacts are retained for 90 days.

### For Stable Releases
When a version tag (e.g., `v1.0.0`) is pushed:
1. Go to the [Releases page](https://github.com/akv004/grab/releases)
2. Download the binary for your platform from the latest release

### Platform-Specific Distribution Formats

**macOS:**
- `.dmg` - Standard macOS disk image installer
- `.zip` - Portable archive

**Important for macOS users:** If you encounter a "damaged and can't be opened" error from Gatekeeper, run this command in Terminal:
```bash
sudo xattr -dr com.apple.quarantine "/Applications/grab.app"
```

**Linux:**
- `.AppImage` - Universal portable format (no installation required)
- `.deb` - Debian/Ubuntu package

**Windows:**
- `.exe` - NSIS installer (recommended)
- `.zip` - Portable archive

## Documentation
- Start with [`docs/README.md`](docs/README.md) for the documentation index.
- See [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) for the spec-based workflow used in this repo.
- Specs live in [`docs/specs/`](docs/specs/INDEX.md) and tasks in [`docs/tasks/`](docs/tasks/INDEX.md).

## Standard Practices for Spec and Task Tracking

This repository uses a **spec-based development system** to track what's done and what's pending. Here's how it works:

### Tracking What's Done vs. Pending

**Specs** ([`docs/specs/INDEX.md`](docs/specs/INDEX.md)):
- Each feature or requirement has a spec document (`SPEC-####-title.md`)
- **Status lifecycle**: Draft → Review → Approved → In Progress → Done → Deprecated
- Track progress by spec status:
  - **Pending**: Draft, Review, Approved
  - **Active**: In Progress
  - **Completed**: Done
  - **Archived**: Deprecated

**Tasks** ([`docs/tasks/INDEX.md`](docs/tasks/INDEX.md)):
- Each spec is broken down into implementation tasks (`TASK-####-short-title.md`)
- **Status options**: Not Started, In Progress, Done
- Track progress by task status:
  - **Pending**: Not Started
  - **Active**: In Progress
  - **Completed**: Done

### For AI Agent Development

When working with AI agents:
1. **Always read the relevant spec first** before making changes
2. **Update spec/task status** as work progresses (e.g., move from "Approved" to "In Progress")
3. **Update change logs** in spec documents to record what was implemented
4. **Link commits and PRs** to spec IDs (`SPEC-####`) and task IDs (`TASK-####`)
5. **Keep assumptions explicit** in the spec's Open Questions or Change Log sections

### Quick Reference

| What | Where | How to Track |
|------|-------|--------------|
| Feature proposals | [`docs/specs/INDEX.md`](docs/specs/INDEX.md) | Check Status column |
| Implementation tasks | [`docs/tasks/INDEX.md`](docs/tasks/INDEX.md) | Check Status column |
| Architectural decisions | [`docs/architecture/DECISIONS.md`](docs/architecture/DECISIONS.md) | Review ADR index |
| Workflow details | [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md) | Full workflow guide |

**To see current work**: Check specs and tasks with status "In Progress"  
**To see pending work**: Check specs with status "Draft", "Review", or "Approved" and tasks with status "Not Started"  
**To see completed work**: Check specs with status "Done" and tasks with status "Done"
