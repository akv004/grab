# grab
A lightweight, developer-friendly tool for capturing, annotating, and exporting on-screen visuals for documentation, debugging, and knowledge sharing.

## Overview
- Capture full screen, application windows, or custom regions.
- Add quick annotations like arrows, rectangles, and text.
- Export to PNG/JPEG or copy straight to the clipboard.

## Download Pre-built Binaries

**Best Practice:** This repository follows industry-standard practices by keeping built binaries out of git. Binaries are distributed through GitHub Releases for easy public access. [Learn more about our distribution strategy →](docs/DISTRIBUTION.md)

### Quick Download (Recommended for End Users)

**Latest Development Build** (most recent features, updated automatically):
1. Go to the [Releases page](https://github.com/akv004/grab/releases)
2. Find the **"Latest Development Build"** release (marked as pre-release)
3. Download the binary for your platform from the **Assets** section:
   - **macOS**: Download `.dmg` (recommended) or `.zip`
   - **Linux**: Download `.AppImage` (portable) or `.deb` (package)
   - **Windows**: Download `.exe` (installer, recommended) or `.zip` (portable)

**Stable Releases** (recommended for production use):
1. Go to the [Releases page](https://github.com/akv004/grab/releases)
2. Find a versioned release (e.g., `v1.0.0`)
3. Download the binary for your platform from the **Assets** section

### For Developers and Contributors

**Access Build Artifacts from CI:**
If you need to access specific build artifacts from the CI pipeline:

1. Go to the [Actions tab](https://github.com/akv004/grab/actions/workflows/build.yml)
2. Click on the desired workflow run
3. Scroll down to the **Artifacts** section
4. Download the artifact for your platform

**Note**: Requires GitHub authentication. Artifacts are retained for 90 days.

### Platform-Specific Distribution Formats

**macOS:**
- `.dmg` - Standard macOS disk image installer
- `.zip` - Portable archive

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
