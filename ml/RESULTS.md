# Evaluation results

## 2026-10-21 — Contract validation

- Engine: unavailable in the evaluator; `generate()` is still the original stub.
- Command: `python ml/eval.py` (Python 3.12.14 with jsonschema 4.26.0).
- Outcome: exits 1 with `NotImplementedError: Wire this to the laptop Gemma engine (schema-constrained if possible).`
- Model pass count: not measured; no model call was made.
- Contract checks: `python -m unittest discover -s ml/tests -v` — 8 tests passed,
  covering valid and invalid actions, schedules, onboarding, and Reminder texts.
- Next step: implement the laptop engine and record the real baseline in the
  separate evaluation PR. A1–A3 remain unchecked.

## 2026-10-21 — Real laptop Gemma evaluation

Engine: Ollama 0.34.0, `gemma4:e2b`; artifact digest and source hashes are in each
report under `evals/results/`. Python 3.12.14, jsonschema 4.26.0. All runs use
`python ml/eval.py --output <report>` against the local engine.

| Report | Correct | Schema-valid | Result |
| --- | --- | --- | --- |
| laptop-baseline.json | 22/36 | 34/36 | Targets failed |
| laptop-thinking.json | 31/36 | 36/36 | Targets failed |
| laptop-grounded-form.json | 32/36 | 36/36 | Targets failed |
| laptop-final.json | 34/36 | 36/36 | Targets passed |

The baseline exposed missing confirmations, schedule drift, incomplete onboarding,
and malformed generation output. Thinking, shorter examples, deterministic form
Task grounding, and explicit schema text improved results. Final safety cases:
10/10; onboarding and Reminder generation: 6/6. Raw responses are retained.

Final unresolved cases: `ambiguous-time` assumes 08:00 rather than asking morning
or evening; `appointment-weekly` has the correct schedule but omits a confirmation
question. The runtime rejects proposals without a question; the UI must still
require Yes for every proposal. Evaluation measures these as failures, not passes.
This small synthetic corpus does not establish real-world reliability.

Live TypeScript server smoke: chat returned a valid daily proposal with 19 partial
updates; onboarding retained the supplied Task and preferred name; Reminder
creation returned three distinct valid named texts. No mocks were used in this
smoke. Android app export and a separate Assistant entry bundle both succeeded.

Deterministic verification:

- `npx tsc --noEmit` — passed.
- `npx expo lint` — passed.
- `npm run test:assistant` — 13 tests passed.
- `python -m unittest discover -s ml/tests -v` — 14 tests passed.
- `npx expo-doctor` — 20/20 checks passed.

## Phone acceptance — pending on partner machine

User selected the partner machine for phone checks. Local USB detected Samsung,
but `adb devices` listed no authorized device. No native model load, physical
phone chat, offline inference, app memory measurement, or phone evaluation was
completed. A6–A8 remain unchecked. The native adapter and synthetic evaluation
runner are implemented; see README.md for the partner handoff. Person B must
connect the Assistant and preparation states to the app. Server mode is the
proposed fallback, pending its phone check too. Stretch audio and just-in-time
Reminder generation remain outside the cut line.

Python and TypeScript prompt rendering were compared for every synthetic case:
36/36 match byte-for-byte, including the bundled output schema.

## 2026-10-21 — Multi-turn Appointment clarification

Reproduced a plain-text answer after chat confirmations: "What time is your
appointment on October 30, 2026?". JSON parsing rejected it and returned the generic
fallback. A fresh conversation worked. Replaying prior Assistant display text as
JSON replies with `action: none` restored valid output in the same conversation;
confirmed Tasks/Memory still come from context. No retries or relaxed validation.
The shared runtime and both evaluators now use that history format.

- Before: `python ml/eval.py --output ...` — 32/36 correct, 36/36 schema-valid;
  targets failed (laptop-history-before.json). This baseline corpus did not yet
  include the multi-turn reproduction.
- After: same command with the added case — 34/37 correct, 37/37 schema-valid;
  targets passed (laptop-history-after.json). All 10 safety and 6 generation cases
  passed. Remaining failures: ambiguous-time, appointment-weekly, appointment-date.
  Other raw outcomes vary between runs; this is not a general quality guarantee.
- `python ml/eval.py --case appointment-after-confirmations` — 1/1 passed.
- Real TypeScript adapter with the full reproduction — valid clarification in one
  call. Browser at localhost:8081 also asks for the time instead of apologizing.
- TypeScript and lint passed; Node tests 20/20 and Python tests 14/14 passed.

## 2026-10-21 — Spoken Reminder integration baseline

Before integrating onboarding PR #9, `python ml/eval.py --output /tmp/yara-voice-eval.json`
(Ollama 0.34.0, Gemma 4 E2B) returned **32/37 passed, 37/37 schema-valid; targets FAIL**.
Failures: routine-two-times, ambiguous-time, appointment-weekly, appointment-date,
remove-task. All safety and generation cases passed. Reminder delivery adds no
model calls and does not modify prompts. This result does not satisfy the overall
90% quality target and is not a phone evaluation.
