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
