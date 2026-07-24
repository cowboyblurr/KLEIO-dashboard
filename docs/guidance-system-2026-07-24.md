# KLEIO contextual guidance system

Implemented July 24, 2026.

## Product rule

The task appears first. Guidance supports the task where it becomes relevant. Large bordered notices are reserved for real errors, destructive consequences, privacy consequences, submission consequences, and confirmed eligibility conflicts.

## Shared patterns

- **InlineHelper** — concise field and control guidance.
- **TrustIndicator** — low-weight source, privacy, approval, and authority signals.
- **FocusLabel** — calm workflow emphasis without alert iconography.
- **ExpandableInfo** — detailed methodology, policy, and educational content collapsed by default.
- **FirstUseHint** — dismissible first-use guidance with reduced-motion support and persistent dismissal.

## Implemented surfaces

- Opportunity discovery: removed the three warning-like worldwide, translation, and messaging cards. The search task now appears first; trust indicators and detailed policy live inside a compact disclosure.
- Natural-language search: interpreted criteria remain visible without a full bordered notice. Exact, partial, and zero-result messages now reflect their actual severity.
- Guided onboarding: synthetic-data context now appears after the first usable fields as a dismissible first-use hint.
- Artist dashboard: ordinary workflow priority is now framed as the next focus; missing Passport items use neutral markers rather than exclamation symbols.
- Institution dashboards: cycle priorities are framed as focus, while true errors and actual follow-up counts retain stronger treatment.

## Motion and accessibility

- Expandable details use a short fade and upward transition.
- Dismissible first-use guidance uses a 200 ms fade/collapse.
- Motion is disabled when the user requests reduced motion.
- Ordinary guidance does not use alert semantics.
- Error treatment and role=alert remain reserved for actual failures.

## Enforcement

Run `pnpm audit:guidance`. The audit prevents the removed policy-card copy and alert-framed workflow-priority pattern from returning.
