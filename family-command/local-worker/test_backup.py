import importlib.util
import pathlib
import unittest

HERE = pathlib.Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("family_backup", HERE / "backup_to_external.py")
backup = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(backup)


class BackupHelpersTests(unittest.TestCase):
    def test_safe_name_removes_path_characters(self):
        self.assertEqual(backup.safe_name('Fynn: Brief/Herbst?'), 'Fynn_ Brief_Herbst')

    def test_known_pdf_extension(self):
        self.assertEqual(backup.extension('application/pdf'), '.pdf')

    def test_unknown_extension_is_bin(self):
        self.assertEqual(backup.extension('application/octet-stream'), '.bin')


if __name__ == '__main__':
    unittest.main()
