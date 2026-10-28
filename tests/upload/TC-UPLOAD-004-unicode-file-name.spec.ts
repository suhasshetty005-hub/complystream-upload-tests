import fs from 'node:fs';
import path from 'node:path';
import { test, expect, files } from '../fixtures';

/**
 * The fixture's name as it is on disk: two precomposed é (U+00E9, NFC), plain U+0020 spaces and
 * ASCII parentheses. Written with \u escapes on purpose: an NFD literal (e + U+0301) looks the
 * same but fails toHaveText (knowledge: gotchas, Unicode normalisation).
 */
const EXPECTED_NAME = 'r\u00e9sum\u00e9 final (v2).txt';

/**
 * Whole-text match for #uploaded-files that is exact inside the name. toHaveText(string) normalises
 * BOTH sides (drops U+200B/U+00AD, trims, collapses /\s+/ - which includes U+00A0 - to one space),
 * so it cannot see a mangled space. A RegExp expectation is not normalised. The only slack allowed
 * is the template wrapping recorded in knowledge (textContent "\n    <name>\n  ": newlines and
 * U+0020 spaces around the name).
 */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const EXACT_NAME_TEXT = new RegExp('^[\\n ]*' + escapeRegExp(EXPECTED_NAME) + '[\\n ]*$');

test.describe('Upload form (file picker): file name preservation', () => {
  test(
    'TC-UPLOAD-004: File names with spaces and non-ASCII characters are preserved',
    { tag: ['@tc:TC-UPLOAD-004', '@upload'] },
    async ({ uploadPage }) => {
      await test.step('Precondition: the committed fixture is on disk under the expected NFC name', async () => {
        // "Exactly as on disk" is only meaningful if the checkout kept the NFC name. Behaviour
        // with a filesystem that returns NFD is NOT YET OBSERVED, so fail here, not later.
        expect(path.basename(files.unicodeNameTxt), 'fixture path uses the NFC name').toBe(EXPECTED_NAME);
        const onDisk = fs.readdirSync(path.dirname(files.unicodeNameTxt));
        expect(onDisk, 'fixture directory entries (NFC name expected)').toContain(EXPECTED_NAME);
      });

      await test.step('1. Upload the fixture with the file chooser: the upload succeeds (2xx)', async () => {
        await uploadPage.goto();
        await expect(uploadPage.heading).toHaveText('File Uploader');
        await uploadPage.chooseFile(files.unicodeNameTxt);
        // Value recorded in knowledge states.unicode_name_file_chosen_not_submitted.
        await expect(uploadPage.fileInput).toHaveValue(`C:\\fakepath\\${EXPECTED_NAME}`);

        const response = await uploadPage.submit();
        // The test case asks for 2xx; 200 was observed (knowledge states.unicode_name_successful_submit).
        const status = response.status();
        expect(status, `POST /upload status ${status} should be 2xx`).toBeGreaterThanOrEqual(200);
        expect(status, `POST /upload status ${status} should be 2xx`).toBeLessThan(300);
        await expect(uploadPage.resultHeading).toHaveText('File Uploaded!');
      });

      await test.step('2. The uploaded-file name is shown exactly as on disk', async () => {
        // Exact match (C-ASSERT-1) via the anchored regex, not toHaveText(string): the string form
        // would also accept U+00A0, doubled spaces or an inserted soft hyphen / zero-width space,
        // because it normalises whitespace in the received text too. The regex compares every code
        // point of the name, so '%20', '?', mojibake such as 'Ã©', an NFD é or any changed space fails;
        // only newlines/U+0020 outside the name (the observed template wrapping) are tolerated.
        await expect(uploadPage.uploadedFiles).toHaveText(EXACT_NAME_TEXT);
      });
    },
  );
});
