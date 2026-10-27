# Doc gaps

Proposals for a human to sign off. Nothing here has been applied to a test case, test, page object
or knowledge file. `DEFECT-NNN` ids are used only where the **app** is the side at fault, so that a
`@known-defect` test can link to them (C-DEFECT-2). Items where the test case is the side to fix
have no DEFECT id.

## 2026-10-27 — TC-UPLOAD-001 · pages/upload

Sources: test-cases/TC-UPLOAD-001.md; knowledge/pages/upload.yaml (last_observed 2026-10-27);
reports/codegen-batch-2026-10-27-TC-UPLOAD-001.yaml (deviations_and_notes, not_generated: []);
reports/review-log/2026-10-27-TC-UPLOAD-001.yaml and -r2.yaml (approved).
Test status: passes, review approved. The findings below are about the documents, not the test.

### DEFECT-001 · Contradiction: empty submit returns HTTP 500 for a validation message
- **Scope note:** this is not a TC-UPLOAD-001 step. It is the Explorer's first `doc_discrepancies`
  entry and belongs to TC-UPLOAD-002, which is not in knowledge/scenario-map.yaml yet.
- **Test case expects (TC-UPLOAD-002 steps 2-4):** the user stays on the form or sees a page that
  tells them to choose a file; "the response is not a 5xx, and the page does not show 'Internal
  Server Error'"; a validation message says a file is required.
- **The page does:** `POST https://the-internet.herokuapp.com/upload -> 500`. The URL stays /upload, the
  h3 heading is "Internal Server Error", the paragraph is "No file was chosen. Please choose a file to
  upload.", and there is a link "Back to the File Uploader" (href /upload).
- **Which side is wrong:** the app. The page contradicts itself: the body is a user validation message,
  but the status and heading say server error. A user mistake should get a 4xx or an inline message,
  not a 500. TC-UPLOAD-002 describes the right behaviour and should stay as written.
- **Certainty:** the knowledge file records one observed state (`states.empty_submit`). High severity,
  but worth re-testing before it is filed upstream.
- **Evidence:** knowledge/pages/upload.yaml :: states.empty_submit, doc_discrepancies[0],
  gotchas[2], elements.empty_submit_back_link.
- **Stale side-effect:** TC-UPLOAD-002 Notes say the raw server error "is still not confirmed" and
  that the Explorer must observe it. It has now been observed (states.empty_submit), so that note is stale.
- **Covered by:** nothing yet. No `@known-defect` test exists under tests/. TC-UPLOAD-002 says it
  should become one (C-DEFECT-1..4) and link to DEFECT-001.

### Contradiction (test-case side): step 1 names the chooser "Choose File"
- **Test case expects (step 1):** "a file chooser ('Choose File')".
- **The page does:** the input is `id="file-upload" type="file" name="file"`. There are 0 `<label>`
  elements and no aria-label. The snapshot shows button "Choose File", but that is the browser's own
  native button text, not page markup.
- **Which side is wrong:** the test case wording. The page does not supply this label, so the
  wording depends on the browser and locale. This is minor and not a product defect. (The missing
  author label is an accessibility point that belongs to TC-UPLOAD-009, not here.)
- **Proposed fix:** "a file input (`#file-upload`) and an Upload button". Drop the quoted label, or mark
  it as browser-native.
- **Evidence:** knowledge/pages/upload.yaml :: elements.file_input (why, attributes), doc_discrepancies[1],
  gotchas[1]. The batch report's deviations_and_notes[1] already locates by `#file-upload` and does not
  assert the text.

### Stale: TC-UPLOAD-001 Notes say the result page has not been observed
- **Test case says (Notes, last bullet):** "The result page has **not** been observed yet; that is the
  Explorer's job."
- **Now recorded:** `states.successful_submit` gives POST /upload -> 200, h3 "File Uploaded!", and
  `#uploaded-files` with innerText exactly "sample.txt" and no other names. See also
  elements.result_heading and elements.uploaded_files.
- **Proposed fix:** replace the sentence with "Result page observed 2026-10-27: heading 'File Uploaded!',
  `#uploaded-files` = 'sample.txt'; see knowledge/pages/upload.yaml :: states.successful_submit."
- **Evidence:** knowledge/pages/upload.yaml :: states.successful_submit, last_observed.

### Unverifiable scenario: "upload a valid file" succeeds = the file was received and stored
- **Test case implies:** the title is "Upload a valid file", and step 3 says "The upload request
  succeeds". A user reads that as "my file is now on the server".
- **What the page can prove:** only that POST /upload returned 200 and that the page echoes the file
  **name** (states.successful_submit). The page shows no size, checksum, storage id or retrieval link.
  The request body was not observed either (not_yet_observed[0]).
- **Consequence:** the green test proves "200 + name echoed", not "file stored intact". Do not read
  it as more than that. TC-UPLOAD-007 already accepts this and is marked not automatable.
- **Needs:** a GET or download endpoint for uploaded files, or read access to the upload storage
  (for example a test bucket), so the stored size and checksum can be compared with the fixture
  (sample.txt: size 72, type text/plain, from states.file_chosen_not_submitted). For a compliance
  product, it also needs the audit-log entry an upload should produce.
- **Proposed test-case wording:** add a note to TC-UPLOAD-001: "Step 3/5 verify acceptance and
  name echo only; storage is TC-UPLOAD-007."

### Unverifiable scenario: what counts as a "valid" file
- **Test case says:** "valid file" (title). The only test data is `sample.txt`.
- **What the page can prove:** the form input has no `accept` and no `multiple` attribute
  (elements.file_input attributes). The page states no type or size rule. Restricted types and large
  files are in not_yet_observed[2].
- **Needs:** a spec value: the allowed types and the maximum size. Until then, "valid" means only
  "a 72-byte text/plain file was accepted". This also blocks TC-UPLOAD-005 and TC-UPLOAD-006.

### Missing coverage: opening the file chooser and cancelling it
- **The page does:** after Cancel there is no request, `#file-upload` has files.length 0 and value '',
  and the URL stays /upload (states.file_chooser_opened_and_cancelled).
- **No test case covers it.** TC-UPLOAD-010 step 2 covers changing the selection, but not cancelling it.
- **Proposed:** add a short step or case: "Open the chooser and cancel; no file is selected and
  nothing is sent." This is low priority.

### Missing coverage: the success page has no route back to the form
- **The page does:** the result page has 0 input[type=file], 0 `<form>`, no Upload button and no back link.
  The empty-submit error page does have one ("Back to the File Uploader").
  Evidence: states.successful_submit, elements.empty_submit_back_link notes, gotchas[5].
- **No test case states what the user should be able to do next** after a successful upload. Whether
  a missing "upload another" path is intended is unknown. This is a UX question for the product owner,
  not a defect claim.

### Candidates reviewed and rejected (not doc gaps)
- **Step 3 "2xx" vs observed 200: rejected.** 200 is a 2xx, so the test case and the page agree
  (states.successful_submit). The open question is whether the *test* should assert exactly 200 (the batch
  report's "knowledge wins", deviations_and_notes[0]) or the range the test case states. That is review
  suggestion C-TC-1 (review-log round 1, line 28), and a human should decide it in the spec or rubric. If
  the product really guarantees exactly 200, the test case should say so. No knowledge field says it does.
- **Step 2 "the file is selected" is unverifiable: rejected.** It can be verified from the DOM:
  `#file-upload` files.length 1, name 'sample.txt', size 72, type 'text/plain'
  (states.file_chosen_not_submitted). Only the *visible* "sample.txt" text beside the button is browser
  chrome (screenshot only, gotchas[6]), and it is not page behaviour anyway. Optional wording tweak:
  "`#file-upload` holds sample.txt". Side note for the human: the test asserts the value
  'C:\fakepath\sample.txt', which is a browser convention. files[0].name is the browser-independent
  form of the same evidence.
  The "nothing is sent to the server yet" half of step 2 can also be verified (no request was observed,
  states.file_chosen_not_submitted). The current test checks the request count only once, which is a
  test-strength issue already open as a review suggestion (round 1, line 22), not a doc gap.
- **Success and failure both end on URL /upload: rejected as a gap.** TC-UPLOAD-001 never asserts a URL.
  Its Notes already require the server status (C-ASSERT-4), and step 4 checks the heading. The fact is
  recorded correctly as a test-design gotcha (gotchas[3]). It does not contradict any test case.
- **Empty submit returns 500: confirmed**, but as DEFECT-001 above against TC-UPLOAD-002. It does not
  affect TC-UPLOAD-001.
