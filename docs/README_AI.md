# AI Agent Development Guide

This guide explains how to work with AI agents in the Grab project, following our spec-based development system.

## Overview

This repository uses a **spec-based development system** to track features, requirements, and implementation progress. This system is designed to work seamlessly with AI agents, ensuring clear communication, traceability, and consistency across all development work.

## Documentation Structure

- Start with [`docs/README.md`](README.md) for the documentation index.
- See [`docs/GETTING_STARTED.md`](GETTING_STARTED.md) for the complete spec-based workflow.
- Browse specs in [`docs/specs/`](specs/INDEX.md) to understand planned and active features.
- Pick tasks from [`docs/tasks/`](tasks/INDEX.md) that link back to specs.
- Review architectural decisions in [`docs/architecture/DECISIONS.md`](architecture/DECISIONS.md).

## Standard Practices for Spec and Task Tracking

### Tracking What's Done vs. Pending

**Specs** ([`docs/specs/INDEX.md`](specs/INDEX.md)):
- Each feature or requirement has a spec document (`SPEC-####-title.md`)
- **Status lifecycle**: Draft → Review → Approved → In Progress → Done → Deprecated
- Track progress by spec status:
  - **Pending**: Draft, Review, Approved
  - **Active**: In Progress
  - **Completed**: Done
  - **Archived**: Deprecated

**Tasks** ([`docs/tasks/INDEX.md`](tasks/INDEX.md)):
- Each spec is broken down into implementation tasks (`TASK-####-short-title.md`)
- **Status options**: Not Started, In Progress, Done
- Track progress by task status:
  - **Pending**: Not Started
  - **Active**: In Progress
  - **Completed**: Done

## AI Agent Operating Rules

When working with AI agents on this project, follow these essential guidelines:

### 1. Always Read the Relevant Spec First
Before making any changes, locate and read the relevant spec document. Specs are the source of truth and contain:
- Feature requirements and acceptance criteria
- Technical constraints and assumptions
- Links to related specs and tasks
- Change logs of previous implementations

**Example workflow:**
```
1. Receive task: "Implement window capture feature"
2. Check docs/tasks/INDEX.md for the task ID (e.g., TASK-0001)
3. Read the task document to find the linked spec ID (e.g., SPEC-0001)
4. Read docs/specs/SPEC-0001-window-capture.md thoroughly
5. Proceed with implementation based on spec requirements
```

### 2. Update Spec/Task Status as Work Progresses
Keep the status fields up-to-date to reflect current progress:

- **Starting work**: Move spec from "Approved" to "In Progress"
- **During implementation**: Update task status from "Not Started" to "In Progress"
- **After completion**: Move task to "Done" and update spec to "Done" when all tasks complete
- **If deprecated**: Move spec to "Deprecated" and document reason

### 3. Update Change Logs
Record what was implemented in the spec's Change Log section:

```markdown
## Change Log

### 2024-01-15 - Initial Implementation
- Implemented basic window capture functionality
- Added tests for capture validation
- PR: #123
- Commit: abc1234
```

### 4. Link Commits and PRs to Spec/Task IDs
**Commit message format:**
```
feat: implement window capture [SPEC-0001] [TASK-0001]

- Add window selection UI
- Implement capture logic
- Add unit tests
```

**PR description format:**
```markdown
## Summary
Implements window capture feature as specified in SPEC-0001.

## Related
- Spec: SPEC-0001
- Task: TASK-0001
- Closes: #45

## Testing
- Unit tests added for capture logic
- Manual testing on macOS, Linux, Windows
```

### 5. Keep Assumptions Explicit
If requirements are unclear or missing:
- **First**: Ask clarifying questions
- **If no response available**: Document assumptions in the spec's "Open Questions" or "Assumptions" section
- **Never**: Invent requirements or make silent assumptions

**Example:**
```markdown
## Open Questions
- Q: Should window capture include child windows?
  - Assumption (2024-01-15): Including only the main window for initial implementation.
  - To be clarified with product team.
```

## Quick Reference

| What | Where | How to Track |
|------|-------|--------------|
| Feature proposals | [`docs/specs/INDEX.md`](specs/INDEX.md) | Check Status column |
| Implementation tasks | [`docs/tasks/INDEX.md`](tasks/INDEX.md) | Check Status column |
| Architectural decisions | [`docs/architecture/DECISIONS.md`](architecture/DECISIONS.md) | Review ADR index |
| Workflow details | [`docs/GETTING_STARTED.md`](GETTING_STARTED.md) | Full workflow guide |

**To see current work**: Check specs and tasks with status "In Progress"  
**To see pending work**: Check specs with status "Draft", "Review", or "Approved" and tasks with status "Not Started"  
**To see completed work**: Check specs with status "Done" and tasks with status "Done"

## Best Practices for AI Agents

### Do's ✅
- Read and understand the full spec before starting implementation
- Update status fields as work progresses
- Document all assumptions and open questions
- Link commits and PRs to spec/task IDs
- Run tests and verify functionality before marking tasks as done
- Update change logs with implementation details
- Follow existing code patterns and conventions
- Ask questions when requirements are unclear

### Don'ts ❌
- Don't invent requirements not in the spec
- Don't make silent assumptions
- Don't skip reading the spec
- Don't forget to update status fields
- Don't leave change logs empty
- Don't commit without linking to spec/task IDs
- Don't ignore test failures
- Don't deviate from spec requirements without discussion

## Common Scenarios

### Scenario 1: Starting a New Feature
1. Check if a spec exists in `docs/specs/INDEX.md`
2. If no spec exists, create one using the template in `docs/specs/templates/`
3. Set spec status to "Draft" and request review
4. Once approved, create tasks in `docs/tasks/INDEX.md`
5. Set spec status to "In Progress" when starting implementation
6. Implement tasks one by one, updating statuses
7. Set spec status to "Done" when all tasks complete

### Scenario 2: Fixing a Bug
1. Check if the bug relates to an existing spec
2. If yes, add a task under that spec
3. If no, create a new spec for the bug fix
4. Follow the standard workflow
5. Update change logs to document the fix

### Scenario 3: Unclear Requirements
1. Check the spec's "Open Questions" section
2. Check related ADRs in `docs/architecture/`
3. If still unclear, document your question in the spec
4. Proceed with a reasonable assumption and document it
5. Flag for review in your PR description

## Additional Resources

- **Implementation Guide**: [`docs/guides/IMPLEMENTATION_GUIDE.md`](guides/IMPLEMENTATION_GUIDE.md) - Coding standards, testing practices
- **Review Guide**: [`docs/guides/REVIEW_GUIDE.md`](guides/REVIEW_GUIDE.md) - PR review checklist and acceptance criteria
- **Architecture Overview**: [`docs/architecture/OVERVIEW.md`](architecture/OVERVIEW.md) - System design and component structure

## Questions or Issues?

If you encounter any issues with the spec-based workflow or have questions about how to use it with AI agents:
1. Check the existing documentation in `docs/`
2. Review similar specs and tasks for examples
3. Open an issue with the label `documentation` or `workflow`
