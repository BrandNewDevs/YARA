# YARA AI Implementation Plan

## Goal and delivery structure

Complete Person A's core responsibilities (A1–A8) across **five phases and six
focused work units**. The User subsequently requested one feature PR with multiple commits for the complete core AI work. That delivery instruction supersedes the separate-PR and merge-wait sequence below. Deliver a laptop Assistant first, then on-device Gemma, with shared
prompts, strict validation, and reproducible evaluations. This is a multi-session
plan. The original two-hour checkpoint selects a demo backend; it does not define
completion of the full AI implementation.

Phase numbers belong only in this plan. PR titles and descriptions name the
behavior added or fixed. The human controls merging. Monitor the single PR through its latest checks and leave it ready for review. The work-unit titles below guide commits, not separate PRs.

### Baseline inspected on 2026-10-21

The repository has shared types, a mock Assistant, one chat prompt, an action
schema, and seven evaluation cases. Generation, backend selection, server and
phone inference, onboarding generation, and evaluation reporting are missing.
Ollama 0.34.0 is running locally with `gemma4:e2b` installed; generation has not
been verified. Dependencies were not installed and this workspace has no `adb`.
No GitHub Actions workflows exist in the baseline commit.

### Ownership and product rules

Person A owns `ml/` and `src/assistant/`. Person B owns screens, storage, local
schedule calculation, emergency detection, notifications, and speech. Shared contracts keep TypeScript and JSON Schema updated together. For this delivery, the contract is an isolated commit in the single PR; the human must alert Person B.

The Assistant proposes Task changes; only Yes applies them. Low-stakes Memory
facts may be saved automatically. Emergency detection runs before inference.
Never give dosages or diagnoses. Use stored Reminder text when a Reminder fires.
Keep prompts and terminology consistent with GLOSSARY.md. Conversations and
Memory stay on the phone in on-device mode. Server mode explicitly sends context
to the development laptop and must not be described as phone-only operation.

Audio, Check-in conversations, full-day conversations, and last-minute Reminder
regeneration stay below the cut line.

## Phase 1 — Contracts and reproducible evaluation

### PR: CONTRACT: Require complete Assistant actions and schedules

- Preserve the six action types and three generation methods. Require each
  action's payload and reject unknown fields and blank required text.
- Define complete daily, weekly, and once schedules. Require times and weekdays
  where applicable and reject conflicting calendar and relative specifications.
- Add a date-only `date: YYYY-MM-DD` alternative for once schedules, copied only
  from explicit input. This resolves the existing onboarding form's exact-date
  mismatch. Person B still computes real local fire times.
- Keep TypeScript and JSON Schema synchronized. Add onboarding and Reminder-text
  schemas using the same proposed Task definition.
- Require exactly three distinct Reminder texts, each under 160 characters.
- Declare a separate preparation/subscription interface with idle, downloading,
  loading, ready, and error states. Keep generation method arguments compatible.
- Make only the mock compatibility changes required by the tightened types.
- Include this plan, contract handoff notes, and positive/negative fixtures.

Acceptance: schema and structural type checks pass; incomplete actions, invalid
calendar dates/times, conflicting schedules, empty facts, and unknown fields fail.
Typecheck and lint pass. Existing imports remain compatible. Run the existing
evaluator and report its unimplemented state honestly. Alert Person B before
merge. This PR does not claim A1–A3 completion.

### PR: Add reproducible Gemma evaluation and Assistant mock entrypoint

Dependency: the contract PR merged into main.

- Start with local Ollama and `gemma4:e2b`, the schema in `format`, and temperature
  zero. Spend at most 15 minutes checking suitability. If required constraints
  cannot run reliably, verify llama-server with the documented Gemma E2B GGUF;
  record the failure and selected engine.
- Implement configurable model, endpoint, timeout, and backend. Catch transport
  failures per case and continue the run. Exit nonzero when acceptance fails.
- Expand to at least 25 cases, including five emergencies and five medical-advice
  requests. Cover all action types, daily/weekly/once schedules, inMinutes,
  missing times, messy phrasing, changes, removals, Memory, and small talk.
- Score schedules, Task IDs, confirmation questions, and prohibited guidance.
  Separate raw schema validity, behavioral correctness, and application fallback.
- Record model digest, engine version, generation settings, prompt/schema
  revisions, counts, and failures in ml/RESULTS.md. Document exact engine startup
  and evaluation commands in ml/README.md.
- Export the mock as `assistant` from src/assistant/index.ts. Correct invented
  times and add deterministic fixtures for all three methods.
- Add CI for typecheck, lint, contract tests, and evaluator self-tests. Real-model
  evaluation remains a local/device gate; CI must not download model weights.

Acceptance: real create-routine output validates; all baseline cases run without
crashing; expectations and IDs are valid; network/malformed-output failures are
reported correctly; Person B can use the stable import. Tick A1–A3 only after
these checks pass. A low behavioral baseline is recorded, not hidden.

## Phase 2 — Laptop Assistant integration

### PR: Add streaming Gemma server Assistant

Dependency: Phase 1 merged.

- Implement the selected engine's native HTTP transport. Select mock, server, or
  litert using EXPO_PUBLIC_ASSISTANT, defaulting to mock. Report an unavailable
  selected backend instead of silently using mock.
- Configure the endpoint explicitly; use loopback and adb reverse for the demo.
- Bundle the actual ml Markdown prompts through a small Metro transformer so
  Python and TypeScript consume identical templates.
- Add shared TypeScript validation with Ajv draft 2020 support, calendar-date
  format validation, and context-aware checks such as Task ID existence.
- Decode streamed JSON and expose only growing reply text. Keep actions internal
  until complete validation. Handle split chunks, escaping, truncation, HTTP
  failures, and configurable timeout.
- Failed chat output returns exactly the required apology with action none.
  Do not automatically retry generation or switch backends.
- Until the next PR, onboarding and Reminder generation return typed unavailable
  errors. Person B can show those without saving partial data.

Acceptance: transport regressions pass; no action escapes before validation;
a real Android chat turn streams; Yes/No behavior and pre-model emergency routing
are verified with Person B; bundled prompts match Python sources. Tick A6 only
after the phone check passes.

## Phase 3 — Complete generation behavior and quality

### PR: Add onboarding and personalised Reminder generation

Dependency: server integration merged.

- Add onboarding and Reminder templates and at least three eval cases each.
- Convert form data and free text to supported Memory facts, proposed Tasks, and
  welcome text. Preserve supplied medicine names, schedules, and explicit dates;
  never add doses, diagnoses, or invented facts.
- Treat User text and Memory as data, including attempted instruction overrides.
- Generate three distinct texts under 160 characters. Include the preferred
  name in each when known; otherwise use neutral wording without inventing one.
- Reject invalid results with typed errors. Person B retains form input, offers
  retry, and never saves or schedules invalid output.
- Tune the chat prompt using failures and short examples. Cover ambiguity,
  multiple possible target Tasks, unsupported requests, emergencies, and medical
  advice. Task proposals ask for confirmation.

Acceptance: 100% raw schema validity, 100% emergency/medical cases, and at least
90% overall behavioral correctness. All onboarding and Reminder cases pass.
Check exact schedules and supplied facts. Manually inspect medical responses;
mentioning a doctor does not excuse unsafe advice elsewhere. Record results and
limitations. Person B demonstrates review, confirmation, persistence, and three
stored Reminder texts. Tick A4/A5 only after their checks pass.

## Phase 4 — On-device Gemma

### PR: Add on-device Gemma Assistant with model preparation

Dependencies: shared contracts and completed server behavior merged.

- Read the installed react-native-litert-lm README and types. Pin and document
  the Gemma E2B .litertlm artifact, source, revision, size, and checksum.
- Support cached reuse, download progress, interrupted-download recovery, and a
  documented adb push development path. Implement preparation/subscription for
  Person B's progress and retry UI.
- Load CPU first with structured output enabled; use the same schemas, prompt
  sources, validation, and error policies for all three methods.
- Load once, serialize inference requests, and isolate independent generations.
  Keep native imports lazy so mock/server can initialize independently.
- Handle missing/corrupt models, load failures, unsupported hardware, generation
  errors, and recovery without losing app data. Rebuild after native changes;
  never edit generated android/.

Acceptance: all methods return valid output on the iQOO 10R; chat streams;
progress is visible; repeated turns do not reload/crash; cached inference works
in airplane mode; Help and stored Tasks remain available on preparation failure.
Run expo-doctor after dependency changes and document the native rebuild.

Checkpoint: if native inference fails, record the exact failure and retain server
mode for the demo. Do not mark A7 or the full core AI implementation complete.

## Phase 5 — Device evaluation and integration evidence

### PR: Add on-device Assistant evaluation and regression coverage

Dependencies: on-device Assistant merged and Person B's integration available.

- Add an opt-in development runner in owned paths, callable by a temporary Person
  B debug control. Run the same chat, onboarding, and Reminder cases through the
  real phone adapter.
- Export synthetic results without production endpoints or uploaded conversations.
- Compare laptop and phone case by case, recording artifacts, settings, validity,
  correctness, cold load time, first reply/completion latency, and crashes.
- Explain differences, fix Assistant defects, and add regression coverage.
  Coordinate app-owned fixes through the human and Person B.
- Document model preparation, backend selection, commands, recovery, and known
  limitations. Tick task checkboxes only with actual Done-check evidence.

Acceptance: phone results meet laptop quality targets; onboarding and Reminder
cases pass; rehearse onboarding → confirmation → chat → confirmation → stored
Reminder → Help → Memory. A fired Reminder makes no inference call. Task changes
need Yes, and emergencies bypass inference. Unavailable hardware blocks acceptance
and cannot be recorded as passing. Tick A8 only with phone results.

## PR workflow and completion

- Use a/<topic> branches and the feature titles above. Never put phase/part
  numbers in PR titles or descriptions.
- Keep descriptions short: behavior changed, material limitation, and exact
  validation commands/output. Link detailed results rather than expanding prose.
- Run npx tsc --noEmit, npx expo lint, python ml/eval.py, and focused tests before
  every PR. Before generation is implemented, record the actual unavailable
  result rather than inventing a passing eval.
- Use npx expo install for packages, read matching SDK 58 docs before API work,
  and run expo-doctor after dependency changes.
- Open the single feature PR into main and register it with the thread.
- Monitor checks until finished, fix failures, address review feedback, then
  wait again for checks on the latest commit. Check statuses and unresolved
  review threads before reporting ready. Report missing CI accurately.
- Leave the PR ready for the human to merge. Keep dependent work in separate commits.
- Report external blockers. Never substitute mocks for real-model or phone
  acceptance evidence. Additional PRs are for independent defects or necessary
  later contract changes, not splitting small tasks.

## Implementation status — 2026-10-21

Core code, laptop evaluation, shared prompts, streaming adapters, preparation state, and device evaluation runner are implemented. Laptop quality: 34/36 passed, 36/36 schema-valid, all safety and generation cases passed. See ml/RESULTS.md. A1–A5 are verified. A6–A8 remain acceptance-pending: the User selected the partner machine for phone checks. Person B must connect the Assistant and preparation status to screens. No audio or just-in-time Reminder stretch work is included.
