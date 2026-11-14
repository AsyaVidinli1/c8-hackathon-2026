# Veliaht OS

## Purpose

Veliaht OS is a family business operating system — a dedicated platform for families who operate businesses together to manage their organizational structure, governance, meetings, execution, performance, and knowledge.

It is **NOT**:
- An ERP (Enterprise Resource Planning) system
- A CRM (Customer Relationship Management) system
- HR software
- Project management software

---

## Roadmap

| Version | Module       | Status      |
|---------|--------------|-------------|
| v0.1    | Foundation   | Released    |
| v0.2    | Organization | Released    |
| v0.3    | Governance   | Planned     |
| v0.4    | Meetings     | Released    |
| v0.5    | Execution    | Released    |
| v0.6    | Performance  | Released    |
| v0.7    | Knowledge    | Released    |
| v0.8    | AI           | Released    |
| v0.9    | Cloud        | Planned     |
| v1.0    | Release      | Planned     |

---

## Development Principles

1. **Analyze first.** Before touching code, understand the full scope of the change.
2. **Propose a plan.** Write out the approach and identify affected files.
3. **Wait for approval.** No significant change is implemented without explicit sign-off.
4. **Implement.** Work in small, focused steps — one concern at a time.
5. **Summarize.** After implementation, document what changed and why.

Additional rules:
- Sprint-based iterations — no unbounded feature work.
- Preserve the modular architecture. Each module lives in its own namespace/section.
- Never rewrite working code unless there is a clear, approved reason.
- Keep the UI consistent with established patterns and styles.
- Maintain backward compatibility — do not break existing data or interfaces.
- Every sprint ends with regression testing and a Git commit.

---

## How to Work in This Repository

### Before You Start

- Read this file and `DATA_MODEL.md` in full.
- Review recent Git commits to understand current state.
- Identify which roadmap module your work belongs to.

### Making Changes

- **Small changes** (typo fixes, minor style tweaks): implement directly.
- **Significant changes** (new features, refactors, new modules): follow the five-step process above — analyze, plan, approve, implement, summarize.
- Never implement a large feature without a reviewed implementation plan.

### Code Style

- Keep JavaScript modular — new features belong in `js/` as their own module files.
- Do not add dependencies or libraries without discussion.
- Prefer clarity over cleverness.

### Testing

- Manually test all affected user flows before committing.
- Verify that no previously working feature is broken (regression check).
- Commit only after tests pass.

### Git Commits

- Commit at the end of every sprint with a meaningful version tag and message.
- Follow the established format: `vX.Y.Z <module-name>` (e.g., `v0.2.0 organization module`).

### Questions or Uncertainty

- When in doubt, stop and ask. Do not guess at intent.
- Propose options rather than making unilateral decisions on ambiguous requirements.
