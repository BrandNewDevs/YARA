"""Contract checks; no model or network access required."""
import copy
import json
import unittest
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = {
    name: json.loads((ROOT / name).read_text())
    for name in ('action.schema.json', 'onboard.schema.json', 'reminder_texts.schema.json')
}
REGISTRY = Registry().with_resources(
    (name, Resource.from_contents(schema)) for name, schema in SCHEMAS.items()
)
VALIDATORS = {
    name: Draft202012Validator(schema, registry=REGISTRY, format_checker=FormatChecker())
    for name, schema in SCHEMAS.items()
}
TASK = {'kind': 'routine', 'title': 'Take prescribed medicine',
        'schedule': {'type': 'daily', 'times': ['08:00']}}


def reply(action):
    return {'reply': 'Shall I add this Routine?', 'action': action}


class ContractTests(unittest.TestCase):
    def assert_valid(self, schema, value):
        VALIDATORS[schema].validate(value)

    def assert_invalid(self, schema, value):
        self.assertFalse(VALIDATORS[schema].is_valid(value), repr(value))

    def test_schemas_are_valid(self):
        for schema in SCHEMAS.values():
            Draft202012Validator.check_schema(schema)

    def test_all_actions(self):
        for action in [
            {'type': 'none'}, {'type': 'show_help'},
            {'type': 'remember', 'facts': ['Prefers to be called Ada']},
            {'type': 'propose_task', 'task': TASK},
            {'type': 'propose_change', 'taskId': 't1', 'task': TASK},
            {'type': 'propose_removal', 'taskId': 't1'},
        ]:
            with self.subTest(action=action['type']):
                self.assert_valid('action.schema.json', reply(action))

    def test_incomplete_and_unexpected_actions(self):
        for action in [
            {}, {'type': 'delete'}, {'type': 'propose_task'},
            {'type': 'propose_change', 'taskId': 't1'},
            {'type': 'propose_change', 'task': TASK},
            {'type': 'propose_removal'}, {'type': 'propose_removal', 'taskId': '  '},
            {'type': 'none', 'task': TASK}, {'type': 'show_help', 'taskId': 't1'},
            {'type': 'remember'}, {'type': 'remember', 'facts': []},
            {'type': 'remember', 'facts': ['']},
            {'type': 'remember', 'facts': ['a'] * 6},
        ]:
            with self.subTest(action=action):
                self.assert_invalid('action.schema.json', reply(action))

    def test_complete_schedules(self):
        for schedule in [
            {'type': 'daily', 'times': ['08:00', '20:00']},
            {'type': 'weekly', 'weekdays': ['tue'], 'times': ['16:00']},
            {'type': 'once', 'inMinutes': 1},
            {'type': 'once', 'inMinutes': 1440},
            {'type': 'once', 'day': 'tomorrow', 'times': ['00:01']},
            {'type': 'once', 'day': 'mon', 'times': ['23:59']},
            {'type': 'once', 'date': '2028-02-29', 'times': ['08:00']},
        ]:
            with self.subTest(schedule=schedule):
                self.assert_valid('action.schema.json', reply(
                    {'type': 'propose_task', 'task': {**TASK, 'schedule': schedule}}))

    def test_incomplete_conflicting_and_invalid_schedules(self):
        for schedule in [
            {'type': 'daily'}, {'type': 'daily', 'times': []},
            {'type': 'daily', 'times': ['24:00']},
            {'type': 'daily', 'times': ['8:00']},
            {'type': 'daily', 'times': ['08:60']},
            {'type': 'daily', 'times': ['08:00\n']},
            {'type': 'daily', 'times': ['08:00', '08:00']},
            {'type': 'daily', 'times': ['08:00'], 'day': 'today'},
            {'type': 'weekly', 'times': ['08:00']},
            {'type': 'weekly', 'weekdays': [], 'times': ['08:00']},
            {'type': 'weekly', 'weekdays': ['monday'], 'times': ['08:00']},
            {'type': 'weekly', 'weekdays': ['mon', 'mon'], 'times': ['08:00']},
            {'type': 'once'}, {'type': 'once', 'day': 'today'},
            {'type': 'once', 'times': ['08:00']},
            {'type': 'once', 'day': 'today', 'times': ['08:00', '09:00']},
            {'type': 'once', 'day': 'today', 'times': ['08:00'], 'inMinutes': 5},
            {'type': 'once', 'day': 'today', 'date': '2026-10-21', 'times': ['08:00']},
            {'type': 'once', 'date': '2026-02-29', 'times': ['08:00']},
            {'type': 'once', 'date': '2026-04-31', 'times': ['08:00']},
            {'type': 'once', 'date': '2026-10-21T08:00:00Z', 'times': ['08:00']},
            *({'type': 'once', 'inMinutes': value} for value in [0, -1, 1441, 1.5, '5', True]),
        ]:
            with self.subTest(schedule=schedule):
                self.assert_invalid('action.schema.json', reply(
                    {'type': 'propose_task', 'task': {**TASK, 'schedule': schedule}}))

    def test_required_text_and_unknown_fields(self):
        valid = reply({'type': 'propose_task', 'task': TASK})
        for path, value in [
            (['reply'], ''), (['reply'], ' \n\t'), (['reply'], 'x' * 401),
            (['extra'], True), (['action', 'extra'], True),
            (['action', 'task', 'title'], ''),
            (['action', 'task', 'details'], '   '),
            (['action', 'task', 'extra'], True),
            (['action', 'task', 'schedule', 'extra'], True),
        ]:
            changed = copy.deepcopy(valid)
            target = changed
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = value
            with self.subTest(path=path, value=value):
                self.assert_invalid('action.schema.json', changed)

    def test_onboarding_reuses_task_contract(self):
        valid = {'facts': ['Prefers to be called Ada'], 'tasks': [TASK], 'welcome': 'Hello Ada.'}
        self.assert_valid('onboard.schema.json', valid)
        self.assert_valid('onboard.schema.json', {'facts': [], 'tasks': [], 'welcome': 'Hello.'})
        for changed in [
            {**valid, 'tasks': [{**TASK, 'schedule': {'type': 'daily'}}]},
            {**valid, 'facts': [' ']}, {**valid, 'welcome': ''}, {**valid, 'extra': True},
            {'facts': [], 'tasks': []},
        ]:
            self.assert_invalid('onboard.schema.json', changed)

    def test_reminder_texts(self):
        valid = ['Ada, it is time.', 'Ada, your Routine is due.', 'Ada, a gentle Reminder.']
        self.assert_valid('reminder_texts.schema.json', valid)
        self.assert_valid('reminder_texts.schema.json', ['a' * 159, 'b', 'c'])
        for texts in [[], valid[:2], [*valid, 'Fourth'], [valid[0]] * 3,
                      [' ', 'b', 'c'], ['a' * 160, 'b', 'c'], ['a', 'b', 3]]:
            with self.subTest(texts=texts):
                self.assert_invalid('reminder_texts.schema.json', texts)


if __name__ == '__main__':
    unittest.main()
