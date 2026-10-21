# Assistant contract

`action.schema.json` defines a chat reply and the proposed Task shared with
`onboard.schema.json`. `reminder_texts.schema.json` defines the three texts stored
on each Task. TypeScript counterparts live in `src/assistant/types.ts` and
`src/domain/types.ts`. Schema validation is required before treating generated
JSON as those types. TypeScript checks structure; it does not enforce string
contents, numeric ranges, uniqueness, or reject extra fields on arbitrary input.

## Actions and schedules

Every chat turn has one nonblank reply of at most 400 characters and one action.
Task creation requires a proposed Task; changes require its replacement and the
existing Task ID; removal requires the existing Task ID. `remember` contains one
to five nonblank facts. `none` and `show_help` carry no payload. Unknown fields
are rejected at every model-output object level.

- Daily schedules have at least one unique `HH:MM` time.
- Weekly schedules also have at least one unique weekday (`mon` through `sun`).
- Once schedules have either an integer `inMinutes` from 1 to 1440, a supported
  `day` and one time, or a date-only `date` and one time. These alternatives cannot
  be combined. `day` is a weekday, `today`, or `tomorrow`.
- `date` is a real calendar date in `YYYY-MM-DD` form, copied from explicit User
  input such as an onboarding Appointment. The Assistant must not calculate a
  date from a relative expression. Person B computes fire times in local time.

The date alternative extends the original weekday-only proposal so the existing
onboarding form's exact dates can be preserved. Alert Person B before merging;
its timing implementation needs to handle this alternative.

## Onboarding and Reminder texts

Onboarding returns `facts`, `tasks`, and a nonblank `welcome` of at most 400
characters. Empty facts and Tasks are valid when there is nothing to add. Every
proposed Task uses exactly the chat Task definition.

Reminder output is a bare array of exactly three distinct, nonblank strings,
each at most 159 characters. The stored Task and Assistant method use the same
three-entry tuple. Preferred-name inclusion and factual fidelity are behavioral
checks for the generation implementation; the schema alone cannot prove them.

## Validation requirements

Use JSON Schema draft 2020-12 with **date format validation enabled**. In Python,
pass `FormatChecker()`; the default jsonschema validator treats formats as
annotations. The phone validator must enable an equivalent calendar-date check.
Resolve onboarding's relative `$ref` to `action.schema.json` locally. An engine
that requires a standalone schema must receive a bundled copy preserving the
same constraints, not a second hand-maintained Task schema.

Task ID existence, date provenance, medical-advice refusal, confirmation wording,
and truthfulness of Memory facts need context-aware checks beyond JSON Schema.
A schema-valid proposal is never permission to persist a Task. No readiness
status, partial stream, or validation failure applies an action.

## Preparation interface

`AssistantPreparation` is separate from `Assistant`; the existing generation
call shape does not change. `prepare()` is idempotent and concurrent calls share
one preparation attempt. `subscribe(listener)` immediately emits current status,
then changes, and returns an unsubscribe function. Download progress is 0–1.

The states are `idle`, `downloading`, `loading`, `ready`, and `error`. Preparation
failure publishes `error` with a plain-language message, then rejects its
promise. Calling `prepare()` again retries. Cached models may skip downloading;
mock and server adapters may become ready without loading a native model. The adapters implement this interface.

## Checks

From the repository root, with dependencies installed:

```sh
python -m unittest discover -s ml/tests -v
npx tsc --noEmit
npx expo lint
python ml/eval.py
```

The Python suite checks schemas and valid/invalid output, including impossible
calendar dates. `src/assistant/types.test.ts` is compiled by the normal typecheck
and asserts accepted and rejected structural shapes. The model evaluator scores raw Gemma responses; see RESULTS.md for laptop evidence and pending phone checks.
