# ComplyStream take-home: upload page tests

Playwright + TypeScript tests for <https://the-internet.herokuapp.com/upload>.

## Run it

Requires Node 20+ (Playwright 1.64 needs it).

```bash
npm install && npm test
```

`npm test` installs the Chromium browser on first run (via `pretest`) and then runs the suite.
The HTML report is written to `playwright-report/`. Open it with `npm run report`.

> **One test fails on purpose.** It is tagged `@known-defect` and asserts the behaviour a user
> should get, against a real defect on the page. See `reports/doc-gaps.md`.
> To run only the passing tests: `npm run test:passing`.
>
> Because of that test, `npm test` ends with **"1 failed, 3 passed" and a non-zero exit code. That
> is expected**, not a broken setup.

## Results

| Spec | Test case | What it checks | Result |
|---|---|---|---|
| `tests/upload/TC-UPLOAD-001-upload-form.spec.ts` | TC-UPLOAD-001 | Choose `sample.txt` and click Upload. The POST returns 2xx, the heading is "File Uploaded!", and exactly `sample.txt` is shown. Choosing a file sends nothing. | ✅ pass |
| `tests/upload/TC-UPLOAD-002-empty-submit.spec.ts` | TC-UPLOAD-002 | Click Upload with no file chosen. The page should show a validation message, not a server error. | ❌ **fails on purpose** |
| `tests/upload/TC-UPLOAD-003-drag-drop.spec.ts` | TC-UPLOAD-003 | Drop `sample.txt` onto the drag-and-drop zone with a real `drop` event. It uploads without the Upload button, the zone shows the file, and the form is untouched. | ✅ pass |
| `tests/upload/TC-UPLOAD-004-unicode-file-name.spec.ts` | TC-UPLOAD-004 | Upload `résumé final (v2).txt` with the file chooser. The POST returns 2xx and the name is echoed with exactly the same code points: no `%20`, `?`, mangled accents or changed spaces. | ✅ pass |

**The deliberate failure (DEFECT-001).** Submitting with no file returns `POST /upload -> 500`
with the heading "Internal Server Error", even though the page text is an ordinary validation
message ("No file was chosen. Please choose a file to upload."). A user's mistake should not come
back as a server error. The test asserts what a user should get, and fails with:

```
POST /upload status 500 must not be 5xx (DEFECT-001)
Expected: < 500
Received:   500
```

It is not hidden behind `test.fail()`. It was also shown to pass against a `page.route()` stub of
the correct behaviour, so it fails because of the defect and not because the test is broken.

Run a single case with `npx playwright test --grep "@tc:TC-UPLOAD-003"`.

## What I couldn't cover, and what I'd need from you

Ten test cases were written (`test-cases/`). Four are automated. These six are not:

| Case | Why it isn't automated | What I'd need from ComplyStream |
|---|---|---|
| TC-UPLOAD-005 Only allowed file types are accepted | No type rule exists anywhere: no `accept` on the input, and `acceptedFiles: null` on the drop zone. Any assertion would be a requirement I invented. | The allowed types and extensions, and whether the server checks extension, MIME type or content. |
| TC-UPLOAD-006 File size limits | No documented limit. The two paths differ: the drop zone has a 256 MB client limit, the form has none. Load-testing a shared public server is also inappropriate. | The specified limits, and an environment I'm allowed to load. |
| TC-UPLOAD-007 The file is stored intact and can be retrieved | The page only echoes the file **name**. A green test proves "200 + name shown", not "file stored". | A download or API endpoint, or read access to storage. For a compliance product, also the audit-log entry an upload should produce. |
| TC-UPLOAD-008 Malicious and hostile uploads are rejected safely | Hostile payloads must not be sent to a third-party server without permission. | A ComplyStream-owned environment, written permission, and the expected policy (reject, quarantine or sanitise). |
| TC-UPLOAD-009 Cross-browser and accessibility | Adding Firefox and WebKit is one config line, but there is no list of browsers that matter. The drop zone is invisible to screen readers (no role or name). | The supported browsers and devices, and the accessibility target (e.g. WCAG 2.2 AA). |
| TC-UPLOAD-010 Multiple files, and changing the selection | The page contradicts itself: the form is single-file, but the drop zone accepts many files. | Whether multi-file upload is meant to be supported. |

Open questions on the cases that *are* automated are in `reports/doc-gaps.md` (start with each
section's "Decisions needed"). The main ones:

- **TC-002:** should an empty submit be stopped in the browser (no request) or answered by the
  server, and with which status? The test assumes the server answers.
- **TC-003:** a user cannot tell "uploaded" from "still uploading". The ✔ appears before the
  server answers, so the test relies on Dropzone's `dz-success` class.
- **TC-003:** the test uses a synthetic `drop` event. A real drag from the desktop still needs a
  manual check.
- **TC-004:** "exactly as on disk" names no Unicode form. The test pins NFC, as observed; whether
  NFD is also acceptable is a product decision.

## How the tests were written: a four-agent pipeline

The tests are not hand-written. Each test case in `test-cases/` is automated by running
`/pw-automate <TC-ID>` in Claude Code, which runs four agents in order:

| Agent | May open a browser? | Produces |
|---|---|---|
| **Explorer** | yes, and it is the only one | `knowledge/pages/upload.yaml`: observed locators, states, exact strings, status codes |
| **Codegen** | **no** | page object + spec, self-verified (pass → invert → fail → revert → pass) |
| **Reviewer** | no | findings against `docs/framework-conventions.md`, never fixes |
| **Doc-Gap** | no | `reports/doc-gaps.md`: where the test case and the page disagree, and which side is wrong |

Because Codegen cannot see the page, it cannot guess a selector: anything it uses must have been
observed by the Explorer first.

The agents are only used to *write* tests. Running the tests needs nothing but Node.

## Layout

```
test-cases/        what to test (one markdown file per case)
knowledge/         how the page behaves (written by Explorer)
pages/             page objects
tests/             specs (one per test case, named <TC-ID>-<slug>.spec.ts), fixtures, upload files
agents/            full agent instructions
.claude/           Claude Code subagent wrappers + /pw-automate command
docs/              conventions rubric
reports/           codegen batch reports, review logs, doc gaps
PROMPT-LOG.md      how I directed the AI, including corrections
```
