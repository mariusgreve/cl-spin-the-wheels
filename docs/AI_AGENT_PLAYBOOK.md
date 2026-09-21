# AI Collaboration Playbook

This is a portable collaboration guide for humans and coding agents working on Spin The Wheels. It is not an application runtime.

## Evidence labels

- **Repository fact:** verified in files, code, or command output from this repository.
- **External fact:** supplied by a referenced standard, library, or platform and should be rechecked when it changes.
- **Recommendation:** a proposed engineering approach, not an existing project guarantee.

Keep these categories separate in plans and final reports.

## Working sequence

1. Clarify only ambiguities that materially change scope.
2. Read `AGENTS.md`, `README.md`, the specs index, and relevant code.
3. Search for existing or overlapping work.
4. State a bounded plan, risks, approval gates, and checks.
5. Implement only the approved scope.
6. Validate the smallest affected behavior first, then run broader checks.
7. Review the diff for scope drift and reconcile affected docs.
8. Pause for human acceptance where visual judgment or product intent is involved.

## Role contracts

A delegated task should state its role, goal, scope, authoritative sources, allowed filesystem, external-write policy, required evidence, and stop conditions. A read-only explorer must not edit files. An implementation agent must not expand scope or claim success without verification.

## Responsibility boundaries

| Activity | Agent | Human |
|---|---|---|
| Repository investigation | Responsible | Resolves inaccessible context |
| Plan and technical recommendation | Responsible | Approves material scope and product tradeoffs |
| Code and documentation changes | Responsible within scope | Reviews drift |
| Automated checks | Runs and reports | Reviews evidence |
| Product intent and visual acceptance | Advises | Accountable |
| Credentials, external writes, publishing, destructive actions | Never self-authorizes | Explicitly authorizes |

## Secret and external-write rules

Never request or print passwords, tokens, private keys, or API keys in chat. Never commit secrets or put them in logs, screenshots, browser storage, or client bundles. This project currently has no external integration; any future integration needs an explicit human-approved boundary.

## Verification

For a docs-only change, validate links, paths, terminology, and absence of unrelated reference-project content. For application changes, run focused tests first, then lint/typecheck/build, and use one browser pass for changed user-facing behavior. Record skipped checks and the reason; a skipped check is not a passing check.

## Drift rule

If investigation shows that the requested change affects product intent, data contracts, or a different subsystem than expected, stop and report the difference before broadening the edit.

## Changelog

2026-09-21 — GitHub Copilot — Initial collaboration playbook adapted from the reference project for local VS Code development.
