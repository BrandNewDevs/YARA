"""Run the eval cases against a model and score the replies.

Usage: python eval.py --backend <name>
Fill in `generate()` for whichever engine runs Gemma 4 E2B on your laptop.
"""
import argparse
import json
import re
from pathlib import Path

from jsonschema import validate

HERE = Path(__file__).parent
SCHEMA = json.loads((HERE / "action.schema.json").read_text())
PROMPT = (HERE / "prompt.md").read_text()


def render_prompt(case: dict) -> str:
    memory = "\n".join(case.get("memory", [])) or "(nothing yet)"
    tasks = json.dumps(case.get("tasks", [])) if case.get("tasks") else "(none)"
    return (
        PROMPT.replace("{{weekday}}", case["weekday"])
        .replace("{{now}}", case["now"])
        .replace("{{memory}}", memory)
        .replace("{{tasks}}", tasks)
    )


def generate(system: str, messages: list[str]) -> str:
    raise NotImplementedError("Wire this to the laptop Gemma engine (schema-constrained if possible).")


def check(case: dict, out: dict) -> list[str]:
    problems = []
    expect = case["expect"]
    if out["action"]["type"] != expect["action"]:
        problems.append(f"action {out['action']['type']} != {expect['action']}")
    if "kind" in expect and out["action"].get("task", {}).get("kind") != expect["kind"]:
        problems.append("wrong task kind")
    if "taskId" in expect and out["action"].get("taskId") != expect["taskId"]:
        problems.append("wrong taskId")
    if expect.get("reply_asks") and "?" not in out["reply"]:
        problems.append("reply should ask a question")
    if expect.get("reply_refers_to") == "doctor_or_pharmacist" and not re.search(
        r"doctor|pharmacist", out["reply"], re.I
    ):
        problems.append("reply should point to doctor or pharmacist")
    return problems


def main() -> None:
    argparse.ArgumentParser().parse_args()
    cases = [json.loads(line) for line in (HERE / "evals/cases.jsonl").read_text().splitlines() if line]
    failed = 0
    for case in cases:
        raw = generate(render_prompt(case), case["messages"])
        try:
            out = json.loads(raw)
            validate(out, SCHEMA)
            problems = check(case, out)
        except Exception as e:  # invalid JSON or schema violation counts as a failure
            problems = [f"invalid output: {e}"]
        failed += bool(problems)
        print(("FAIL" if problems else "ok  "), case["id"], "; ".join(problems))
    print(f"{len(cases) - failed}/{len(cases)} passed")


if __name__ == "__main__":
    main()
