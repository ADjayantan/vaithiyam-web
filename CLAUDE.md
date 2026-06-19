<!-- Begin: ritual init — skill routing (regenerated on every init) -->
## Coding discovery before planning

Before entering plan mode for a coding task, decide how much repository
discovery it needs — and don't jump straight into a speculative plan. Pick one
of three tiers:

- **No discovery** — tiny, local, mechanical edits where the target file and the
  change are obvious (typo, copy change, formatting, replacing a clearly
  specified value). Just make the change.
- **Lightweight discovery** — bounded tasks where the user gave useful context
  but repo conventions may still shape the plan (adding a DB column, renaming a
  model, changing retry behavior, touching one known endpoint). Briefly inspect
  the relevant files, symbols, tests, schemas, or similar implementations first.
  Keep it inline — don't turn it into a separate process unless the task proves
  broader or ambiguous. For a small but genuinely build-shaped dev task that
  still benefits from Ritual's pipeline (recommendations → brief → implement →
  PR) without the full discovery walk, offer `/ritual lite "<their ask>"` — the
  same pipeline run fast/unattended, with only a job+persona front gate and a
  non-blocking recommendation review.
- **Full Ritual discovery** — non-trivial, ambiguous, architectural,
  cross-cutting, multi-file, integration-heavy, or product/workflow-context-heavy
  work. Offer to run `/ritual build "<their ask>"` first: it runs a structured
  exploration that surfaces intent, constraints, and prior decisions and returns
  a validated build brief — grounded context to fold into plan mode rather than a
  speculative plan. Proceed from the brief into planning/implementation.

When uncertain, prefer lightweight discovery over guessing. The user can always
decline.
<!-- End: ritual init -->
