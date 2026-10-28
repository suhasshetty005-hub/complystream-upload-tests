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

## 2026-10-27 — TC-UPLOAD-002 · pages/upload

Sources: test-cases/TC-UPLOAD-002.md; knowledge/pages/upload.yaml (last_observed 2026-10-27, third
Explorer session, scope TC-UPLOAD-002); reports/codegen-batch-2026-10-27-TC-UPLOAD-002.yaml (status done,
not_generated[0..1], test_case_disagreements[0..2], conventions_silent_on[0..3]);
reports/review-log/2026-10-27-TC-UPLOAD-002.yaml (approved, 4 suggestions).
Test status: `@known-defect`. It fails red live at tests/upload/upload-form.spec.ts:80 with "POST /upload
status 500 must not be 5xx (DEFECT-001) / Expected: < 500 / Received: 500" (batch self_verify run_A_live
and run_C_stub_removed, reproduced by the reviewer). It passed against a POST-only stub returning 400
(run_B_stub).

### DEFECT-001 · Update (supersedes the Certainty, Covered by and Scope note lines of the 2026-10-27 TC-UPLOAD-001 entry above)
The original entry above stays as written. These lines replace three of its fields:
- **Certainty (replaces "the knowledge file records one observed state"):** reproduced 2 of 2. The 500
  was observed in the TC-UPLOAD-001 session and again in the TC-UPLOAD-002 session, where the new document's
  Navigation Timing entry had type 'navigate', responseStatus 500, duration 480 ms. "The second observation
  matches the first" (states.empty_submit request). The Codegen live runs A and C and the reviewer's run
  each got `Received: 500` as well, although those are test runs, not Explorer observations. Caveat: every
  observation was on 2026-10-27 against https://the-internet.herokuapp.com (observed_on). It is
  reproducible enough to file upstream. Whether it is long-standing is unknown.
- **Severity:** unchanged, High (TC-UPLOAD-002 Priority: High; the Notes call it "the mistake users make
  most often").
- **What exactly is wrong, now fully recorded:** two things only. (1) Status 500
  (states.empty_submit request). (2) h3 "Internal Server Error" (elements.empty_submit_error_heading,
  "the only h1-h6 on the error page"). The user-facing message is already right:
  `<p id="upload-error">No file was chosen. Please choose a file to upload.</p>`
  (elements.empty_submit_message). A side effect that matters for the fix: the error page has no form,
  no #file-upload and no Upload button (states.empty_submit "ABSENT on this page"). The user can only
  recover through the link "Back to the File Uploader" (elements.empty_submit_back_link).
- **Covered by (replaces "nothing yet"):** tests/upload/upload-form.spec.ts:53-93, test
  "TC-UPLOAD-002: Submitting with no file selected shows a validation message", tags
  `@tc:TC-UPLOAD-002 @upload @known-defect`. Its annotation points here. Today it fails at step 3 (:80)
  on the 500 itself, not on a timeout (C-DEFECT-4). knowledge/pages/upload.yaml covered_by and
  knowledge/scenario-map.yaml (status in_review) both list it.
- **Limits of that coverage. Read these before treating a future red or green as proof:**
  - The test can only turn green if the fix still sends POST /upload. See the step-2 finding below.
  - A half fix (status changed to non-5xx, heading kept) should fail at :83
    (`emptySubmitErrorHeading` toBeHidden). No run has shown :83 failing, though (review-log suggestion 2,
    batch run_B_stub). This is reasoning, not evidence.
  - A fix that rewords the message fails at :88. See the step-4 finding below.
- **Scope note (replaces "TC-UPLOAD-002 ... is not in knowledge/scenario-map.yaml yet"):** it is now
  there (scenario-map.yaml id TC-UPLOAD-002, status in_review, comment naming DEFECT-001).

### Stale: TC-UPLOAD-002 Notes say the server error "is still not confirmed"
- **Confirmed.** This was already flagged as a "Stale side-effect" in the DEFECT-001 entry above. It is
  repeated here because the evidence is now stronger and the test exists.
- **Test case says (Notes, bullet 2):** "I recall that the current page returns a raw server error here.
  **This is still not confirmed** … The Explorer must observe it. If it does, this test is the suite's
  deliberately failing `@known-defect` test".
- **Now recorded:** observed twice (states.empty_submit request). The condition ("If it does") is met,
  and the test exists (covered_by[1]).
- **Proposed wording:** "Confirmed 2026-10-27 (observed twice): POST /upload -> 500, heading 'Internal
  Server Error', message 'No file was chosen. Please choose a file to upload.' (knowledge/pages/upload.yaml
  :: states.empty_submit). This test is the `@known-defect` test for DEFECT-001 (reports/doc-gaps.md) and
  fails red until it is fixed." The header line "Automate: Yes (expected to fail against the current page;
  see Notes)" is still accurate.

### Unverifiable scenario: step 2 allows two outcomes, and the page today can show only one of them
- **Confirmed.** This raises the same point as batch not_generated[1], test_case_disagreements[1] and
  review-log suggestion 1.
- **Test case says (step 2):** "The user stays on the upload form, **or** gets a page that tells them to
  choose a file". The case does not say "no request is sent". That phrase appears only in this agent's
  output template, not in TC-UPLOAD-002, so it is not used as evidence here.
- **The page does:** the second branch only. POST /upload goes out and a new document loads. That
  document carries the message, so branch 2 is met in substance, apart from the 500 (states.empty_submit).
  Branch 1 is literally false today: the URL stays /upload but the form is gone (no heading 'File
  Uploader', no #file-upload, no Upload button). gotchas[4] warns that a loose
  getByText('File Uploader') would wrongly "prove" branch 1 through the back link.
- **Why it is unverifiable, not a contradiction:** branch 1 (stay on the form, which could mean
  client-side validation with no request) has never been observable. The app does not implement it, so
  there is no state, no element and no message location for it in the knowledge file. The test cannot
  be written for it without invented content (batch not_generated[1]). The test assumes branch 2:
  `uploadPage.submit()` waits for a POST /upload response (:74). The recorded #file-upload attributes
  (`id="file-upload" type="file" name="file"`, elements.file_input) do not include `required`. If a fix
  adds it, or any other client-side check, no POST is sent, step 2 times out, and the test stays red
  after DEFECT-001 is fixed (review-log :54-57).
- **Answer to "pick one or name both":** the test case must either **pick one, or name both with an
  observable pass condition for each**. As written, "stays on the upload form" has no observable
  criterion. It does not say whether a request may be sent, or where the message appears. Picking the
  outcome is a product decision. This report does not choose one.
  - Option A, server response (matches today's architecture, and the test passes unchanged once the
    status is fixed): "Clicking Upload sends POST /upload. The response is a non-5xx page showing a
    message that a file is required, and the upload form (file input and Upload button) is shown again
    or reachable."
  - Option B, client-side (likely the most common fix, per the review log): "No request is sent. The
    page stays on the upload form (heading 'File Uploader', #file-upload, Upload button visible) and a
    message that a file is required is shown." This needs a re-explore after the fix: where the message
    lives, and whether it is DOM text or the browser's native validation bubble. That last part is an
    inference, not recorded. A native bubble has no DOM text to assert with toHaveText.
  - Option C, both allowed: keep both branches, each worded as in A and B. The test would then have to
    branch on a request counter (review-log suggestion 1, C-ASSERT-5). The rubric is silent on that
    (review-log conventions_silent_on[0]), so a human must also rule there.
- **Needs:** a product-owner decision (A, B or C), and for B or C an Explorer observation of the fixed
  behaviour.
- **Interim (from review-log suggestion 1, not applied here):** extend the test annotation to say "a
  response timeout in step 2 may mean the app switched to client-side validation; re-explore before
  reading this as DEFECT-001".

### Unverifiable scenario: step 3 says "not a 5xx" but specifies no status
- **Confirmed as a spec gap.** The test case states only an exclusion: "the response is not a 5xx".
- **What follows:** any of 200 (re-rendered form), a 3xx (redirect back to GET /upload), 400 or 422 meets
  step 3 as written. The test mirrors this exactly: `toBeLessThan(500)` (:80), so it neither over- nor
  under-asserts the case. The stub's 400 (run_B_stub) was Codegen's choice, not a spec value (batch
  conventions_silent_on[2]). Only 400 has been shown to pass. Note: the "4xx or inline message" in the
  DEFECT-001 entry above and in doc_discrepancies[0] is the Explorer's and this report's view of what a
  user would expect. It is not a recorded spec value.
- **Inference, not run:** with a 3xx, `submit()` resolves on the redirect response itself, so :80 passes,
  and steps 3-4 then read the redirected page. That only works if the message survives the redirect.
- **Needs:** a spec value. Either one status, or the accepted set together with the page shape for each.
  If the product owner wants strict client-error semantics, step 3 should read "4xx (400 or 422)" rather
  than "not a 5xx". If it does not care, the current wording is fine, and the gap is documentation only.
  Lower priority than the step-2 decision, which determines whether any status exists at all.

### Unverifiable scenario: step 4 does not specify the message wording, and the test pins it
- **Confirmed, with lower severity than the step-2 finding.**
- **Test case says (step 4):** "A validation message tells the user a file is required". Whether a
  message "tells the user a file is required" is a judgement about meaning. A test cannot check it
  without a spec string or a fixed location.
- **The page does:** step 4 is already met by the live page. `#upload-error` reads exactly "No file was
  chosen. Please choose a file to upload." (elements.empty_submit_message). The defect is the 500 and the
  heading, not the message. Live runs never reach step 4 because :80 fails first (batch
  test_case_disagreements[2], an inference).
- **The test pins two things the test case does not:** the exact wording (:88, C-ASSERT-1) and the
  location `#upload-error` (:82, :88). A fix that keeps the behaviour but rewords the message, or moves
  it to another element, fails the test at step 3 or 4 even though the case is met. The review log names
  this as an open rubric question (conventions_silent_on[3]).
- **Is it a spec gap?** Yes. The case should either (a) adopt the observed string as the specified text,
  if the product owner confirms it is intended. That is the cheapest option: the app already shows it,
  and the test stays as is. Or (b) state that the wording is free, and say what the test may check
  instead. This report recommends (a), because the observed message is already correct and clear. The
  decision belongs to the product owner.
- **Needs:** the specified message text, or an explicit "any wording", plus where it appears. The
  location depends on the step-2 decision: under option B the location is not observed yet.

### Missing coverage: recovery from the empty-submit page ("Back to the File Uploader")
- **The page does:** the error page has no form, and its only way forward is the link "Back to the File
  Uploader" (href /upload), which returns to the initial state (elements.empty_submit_back_link,
  states.empty_submit, from the first session only).
- **No test case covers it.** A search of test-cases/ for "back" and "back link" found no step about it.
- **Priority:** low, and it depends on DEFECT-001. If the fix re-renders the form (step-2 option A with
  the form shown, or option B), the link may disappear by design. Propose it only as a step in whichever
  outcome the product owner picks: "the user can try again without reloading". Do not write it as a
  separate case against the defective page.

### Candidates reviewed and rejected (not doc gaps)
- **Step 3 "the page does not show 'Internal Server Error'" is only partly asserted: rejected as a
  doc gap.** batch not_generated[0] notes that only headings are checked (:83). On the observed page,
  though, #content holds only the h3, the p and the a (states.empty_submit), and the title is 'The
  Internet'. So the h3 is the only recorded place the phrase appears. The heading check covers every
  observed occurrence. Whether :83 can actually fail is a test-verification issue (review-log suggestion
  2), not a test-case issue.
- **Step 1 "the upload form is shown": rejected.** It matches states.initial and elements.heading /
  upload_button. The loose toBeVisible on the button (:68) is review-log suggestion 3, a test-strength
  point, not a doc gap.
- **A new DEFECT id for the missing form on the error page: rejected.** It follows from the same 500
  page and is recorded under DEFECT-001 above. A separate id would duplicate it.

## 2026-10-27 — Location update · TC-UPLOAD-002 test moved

The earlier sections stay as written. At the human's request, the TC-UPLOAD-002 test moved from
tests/upload/upload-form.spec.ts to its own file, **tests/upload/empty-submit.spec.ts**. The test body is
unchanged, so every finding above still holds. Only the cited locations change. Each old line reference
below is 49 lower in the new file. Each was checked against the new file. tests/upload/upload-form.spec.ts
no longer contains TC-UPLOAD-002. knowledge/pages/upload.yaml covered_by and knowledge/scenario-map.yaml
already name the new file.

| Old location (upload-form.spec.ts) | New location (empty-submit.spec.ts) | What is there | Cited in |
|---|---|---|---|
| :53-93 | :4-44 | the whole test | DEFECT-001 Update, Covered by |
| :68 | :19 | `uploadButton` toBeVisible (step 1) | TC-002 rejected candidates, step 1 |
| :74 | :25 | `uploadPage.submit()` (step 2) | step-2 unverifiable finding |
| :80 | :31 | status `toBeLessThan(500)`, the live failure point | TC-002 Test status line; DEFECT-001 Update, Covered by ("fails at step 3"); step-3 finding (twice); step-4 finding |
| :82 | :33 | `emptySubmitMessage` toBeVisible | step-4 finding |
| :83 | :34 | `emptySubmitErrorHeading` toBeHidden | DEFECT-001 Update, Limits (twice); TC-002 rejected candidates, step 3 (twice) |
| :88 | :39 | `emptySubmitMessage` toHaveText (exact string on :40) | DEFECT-001 Update, Limits; step-4 finding (twice) |

Not changed: "review-log :54-57" in the step-2 finding cites the review log, not the spec file.
"review-log round 1, line 22/28" in the TC-UPLOAD-001 section cites the TC-UPLOAD-001 review log.

## 2026-10-28 — TC-UPLOAD-003 · pages/upload

Sources: test-cases/TC-UPLOAD-003.md; knowledge/pages/upload.yaml (last_observed 2026-10-28, fourth
session); reports/codegen-batch-2026-10-28-TC-UPLOAD-003.yaml; reports/review-log/2026-10-28-TC-UPLOAD-003.yaml
(approved, 5 suggestions). Test status: passes. No new DEFECT id: nothing below shows the app is wrong.

**Decisions needed**
1. **Step 3:** what counts as "the zone shows the file was accepted" for a user? Either reword it to the DOM signal the test checks, or ask the product owner for a visible accepted-vs-pending cue (finding A).
2. **Step 4:** add the precondition "sample.txt chosen in the form before the drop" so that "did not reset" can be tested, or delete "or reset" (finding B).
3. **Sign off** the rewrite of the stale Notes (finding C).
4. **Accept** that a real OS drag from the desktop is not covered by the automated test and needs a manual check (finding D).

### A · Unverifiable scenario: step 3 "the zone shows that the file was accepted"
- **Test case says:** the zone shows the file was accepted and displays `sample.txt`.
- **The page does:** the name (`[data-dz-name]` = "sample.txt") is filled at once on drop, "before the request completes". The only visible acceptance cue, the ✔, is "static template markup, present and display:block immediately after the drop event, before the XHR completed". Evidence: elements.dropzone_file_name notes; elements.dropzone_success_mark notes; gotchas[10]. The only signal tied to the server's answer is the `dz-success` class, added about 250-350 ms after the drop (elements.dropzone_preview; states.drag_drop observed). A user cannot see a class.
- **The server's confirmation is not visible either:** the XHR response is the full success page (`<h3>File Uploaded!</h3>`, `#uploaded-files` "sample.txt"), and "Dropzone discards that HTML; it is not rendered" (states.drag_drop request; gotchas[12]). So the user sees nothing on the drop path that comes from the server. The form path does show a server-supplied "File Uploaded!" (states.successful_submit).
- **Verdict:** the name half can be checked. The "accepted" half cannot be checked from the user's view. The test's `dz-success` check is a sound substitute (review log Q5), but it proves something the step does not say.
- **Possible product issue, not a DEFECT:** a ✔ that is shown before the server answers would be misleading if it also stays on a failed upload. That case has not been observed (no `dz-error` was ever seen; "a drop that the server rejects (dz-error state)" is in not_yet_observed[2]). Severity could be medium, but certainty is low, so this is **worth re-testing** and is not asserted here.
- **Needs:** (1) a product decision on what a user should see when the upload is accepted, still pending, or rejected; (2) an Explorer observation of a rejected drop, for example by stubbing POST /upload to return 4xx/5xx, to see whether the ✔ stays.
- **Proposed wording until then:** "The zone lists `sample.txt`, and Dropzone marks the file as uploaded (preview has the `dz-success` class). Note: no visible cue distinguishes uploaded from pending."

### B · Unverifiable scenario: step 4 "the drop did not … reset it"
- **Test case says:** the file-chooser form is unchanged; the drop did not submit or reset it.
- **The page does:** after the drop, `#file-upload` files.length is 0 and its value is '' (states.drag_drop observed). It was already empty before the drop (states.initial). An empty input is what both "unchanged" and "reset" look like, so this half cannot fail. A regression where a drop clears a chosen file would still pass (review-log suggestion 4).
- **The "did not submit" half can be checked and is covered:** there is one POST, the XHR is not a navigation, and "File Uploaded!" and `#uploaded-files` are absent (states.drag_drop request and observed).
- **Proposed fix:** add a precondition, "`sample.txt` is chosen in the file chooser (not uploaded)", and change the expected result to "`#file-upload` still holds `sample.txt` (files.length 1) and no form POST was sent". The fixture can be reused, because files.length 1 vs 0 tells the cases apart.
- **Needs:** an Explorer observation of "choose, then drop". This is not in not_yet_observed: the nearest entry is "dropping after a form upload", which is a different sequence. Add it there. Alternatively, delete "or reset" if the product owner does not care.

### C · Stale: TC-UPLOAD-003 Notes
- **Test case says (Notes, bullet 2):** the immediate upload "has not been seen happen"; what the zone shows afterwards is "NOT YET OBSERVED"; "The Explorer must record both before Codegen runs."
- **Now recorded (2026-10-28, 2 drops on fresh loads):** a drop alone sends exactly one XHR POST /upload -> 200, about 14-15 ms after the drop. The zone shows one `.dz-preview` with name "sample.txt" and a ✔, and reaches `dz-success dz-complete` (states.drag_drop).
- **Also partly stale (Notes, bullet 3):** "does not appear in the accessibility tree at all". This is true only before a drop. Afterwards the zone appears as an unnamed generic containing 'sample.txt' and '✔' (elements.drag_drop_zone notes; gotchas[7]). The conclusion (it cannot be located by role) still holds.
- **Proposed wording:** "Observed 2026-10-28: a drop uploads immediately (one XHR POST /upload -> 200, no navigation), and the zone then lists the file name with a ✔. See knowledge/pages/upload.yaml :: states.drag_drop. The zone has no role or name, before or after a drop."

### D · Unverifiable scenario: a user dragging a file from the desktop
- **Test case says (step 2):** "a real `drop` event carrying the file".
- **What was exercised:** a synthetic `DragEvent` with a page-built `DataTransfer` (states.drag_drop trigger; batch run_1_pass). This meets the step's wording and goes through Dropzone's own handler (review log Q1). It does not cover the browser's handling of an OS drag from a file manager. That is listed in not_yet_observed[2] as "Playwright dragTo from an external file is not possible".
- **Needs:** nothing from the app. It needs a one-off manual check, or OS-level automation outside Playwright. Record it in TC-UPLOAD-003 Notes as "automated: synthetic drop only".
- **Cross-browser:** this is covered by the TC-003 Notes and by TC-UPLOAD-009 step 1. It is not a TC-003 gap, so it is not repeated here.

### E · Missing coverage (configuration only, not observed): clicking the zone opens a second chooser
- **The page has:** `clickable true` and class `dz-clickable`, plus a hidden `input.dz-hidden-input` with `multiple`, outside the form (elements.drag_drop_zone notes; elements.dropzone_hidden_input). This suggests that clicking the zone opens a multi-file chooser that uploads through Dropzone. It is an inference from the configuration. Nobody has clicked the zone.
- **No test case covers it.** TC-UPLOAD-010 step 1 ("select two files at once") reads as the form chooser only. Low priority. If kept, it belongs in TC-UPLOAD-010 once single- vs multi-file intent is decided.

### Candidates reviewed and rejected (not TC-003 gaps)
- **Step 1 "below the file chooser" is a layout claim: rejected.** The page agrees: "An empty red-dashed drop zone below" (states.initial) and "below the Upload button", y=358 (elements.drag_drop_zone). The test asserts it, and the test passes. The gap is the missing `#file-upload` geometry in knowledge (review-log suggestion 3, an Explorer task). Optional: drop the layout clause, since it is not functional behaviour.
- **256 MB limit, multiple files on the drop path, no accept/acceptedFiles: rejected for TC-003.** The 72-byte single text file used here meets none of these limits (`maxFilesize 256`, `acceptedFiles null`, `uploadMultiple false`, `maxFiles null`, elements.drag_drop_zone notes). Each one is already recorded in the case it belongs to: TC-UPLOAD-006 (size), TC-UPLOAD-005 (type), TC-UPLOAD-010 (multiple). They are still blocked on the spec values listed in the TC-UPLOAD-001 section above.
- **The drop's success response is not rendered: merged into A** (user-visible side). For whether the file was stored, see the existing "file is persisted" finding in the TC-UPLOAD-001 section. The drop response does echo `sample.txt` (states.drag_drop request), so the drop path can reach the same "200 + name echoed" level as the form path. The test checks only the 2xx, which is all step 2 asks for (batch not_generated[0]). Optional: add "the response echoes sample.txt" to step 2.
- **Cross-browser (Chromium only): rejected.** It is already in the TC-003 Notes and in TC-UPLOAD-009 (see D).
- **`/\bdz-success\b/` also matches `dz-success-mark`: not a doc gap.** It is a test and knowledge wording fix (review-log suggestion 1).
