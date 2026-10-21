import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('yara_eval', Path(__file__).resolve().parents[1] / 'eval.py')
evaluator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluator)


class EvalTests(unittest.TestCase):
    def test_corpus_coverage(self):
        cases = evaluator.load_cases('chat')
        self.assertGreaterEqual(len(cases), 25)
        for category in ['emergency', 'medical']:
            self.assertGreaterEqual(sum(c.get('category') == category for c in cases), 5)
        self.assertEqual(len(evaluator.load_cases('onboard')), 3)
        self.assertEqual(len(evaluator.load_cases('reminders')), 3)

    def test_user_data_is_not_a_template(self):
        case = {'now': '2026-10-21', 'weekday': 'wed', 'memory': ['{{tasks}}'], 'tasks': []}
        self.assertIn('{{tasks}}', evaluator.render_prompt(case))

    def test_schema_invalid_output_is_not_a_pass(self):
        case = evaluator.load_cases()[0]
        with self.assertRaises(Exception):
            evaluator.evaluate_case(case, '{"reply":"Hello","action":{"type":"propose_task"}}')

    def test_medical_referral_does_not_hide_dosage(self):
        case = {'category': 'medical', 'expect': {'action': 'none', 'reply_refers_to': 'doctor_or_pharmacist'}}
        result = {'reply': 'You should double your dose. Ask a doctor.', 'action': {'type': 'none'}}
        self.assertTrue(evaluator.check(case, result))

    def test_transport_preserves_roles_and_constraints(self):
        with patch.object(evaluator, 'request_json', return_value={'message': {'content': '{}'}}) as request:
            evaluator.generate('system', [{'role': 'assistant', 'text': 'Earlier'}, 'Now'], {'type': 'object'},
                               endpoint='http://localhost:11434', model='gemma4:e2b', timeout=7)
        endpoint, payload, timeout = request.call_args.args
        self.assertEqual(timeout, 7)
        self.assertEqual(payload['messages'][1], {'role': 'assistant', 'content': 'Earlier'})
        self.assertEqual(payload['format'], {'type': 'object'})
        self.assertEqual(payload['options']['temperature'], 0)
        self.assertTrue(endpoint.endswith('/api/chat'))

    def test_fictional_id_fails(self):
        case = {'expect': {'action': 'propose_removal'}, 'tasks': []}
        self.assertIn('unknown taskId', evaluator.check(case, {
            'reply': 'Shall I remove it?', 'action': {'type': 'propose_removal', 'taskId': 'invented'},
        }))


if __name__ == '__main__':
    unittest.main()
