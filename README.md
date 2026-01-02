# grab
A lightweight, developer-friendly tool for capturing, annotating, and exporting on-screen visuals for documentation, debugging, and knowledge sharing.

## Overview
- Capture full screen, application windows, or custom regions.
- Add quick annotations like arrows, rectangles, and text.
- Export to PNG/JPEG or copy straight to the clipboard.

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
