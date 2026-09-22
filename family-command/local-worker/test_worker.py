import importlib.util
import pathlib
import unittest

HERE = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("family_worker", HERE / "family_worker.py")
worker = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(worker)


class WorkerValidationTests(unittest.TestCase):
    def base(self):
        return {
            "language": "de",
            "summary": "Test",
            "overall_confidence": 0.9,
            "warnings": [],
            "items": [{
                "type": "event",
                "title": "Zahnarzt",
                "description": "",
                "person_name": "Fynn",
                "start_at": "2026-10-01T10:00:00+02:00",
                "end_at": "",
                "due_at": "",
                "all_day": False,
                "location": "",
                "confidence": 0.95,
                "needs_review": False,
                "requirements": [],
                "source_quote": "Zahnarzt am 1. Oktober um 10 Uhr",
            }],
        }

    def test_valid_output_stays_high_confidence(self):
        value = self.base()
        worker.validate(value)
        self.assertEqual(value["items"][0]["needs_review"], False)
        self.assertEqual(value["items"][0]["confidence"], 0.95)

    def test_missing_source_quote_forces_review(self):
        value = self.base()
        value["items"][0]["source_quote"] = ""
        worker.validate(value)
        self.assertEqual(value["items"][0]["needs_review"], True)

    def test_invalid_type_is_rejected(self):
        value = self.base()
        value["items"][0]["type"] = "delete_calendar"
        with self.assertRaises(ValueError):
            worker.validate(value)

    def test_confidence_is_clamped(self):
        value = self.base()
        value["items"][0]["confidence"] = 2.7
        value["overall_confidence"] = -1
        worker.validate(value)
        self.assertEqual(value["items"][0]["confidence"], 1.0)
        self.assertEqual(value["overall_confidence"], 0.0)


if __name__ == "__main__":
    unittest.main()
