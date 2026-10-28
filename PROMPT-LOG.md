# Prompt log

Tool: **Claude Code** (VS Code extension), model Claude Opus 5.5.
This log lists my prompts in order, what the tool did with each one, and where I had to
correct it. Prompts are verbatim apart from typo fixes. Names from an earlier client project
are replaced with *[previous project]* placeholders.

---

## Phase 1: Understanding the brief and choosing an approach

### Prompt 1
> Can you go through this: *(pasted the ComplyStream take-home brief)*

**What it did:** broke the brief into its three asks, recalled the page's behaviour (file input,
drag-and-drop zone, empty submit returning a 500) and proposed three tests plus a list of cases
it would not automate.
**Where I steered:** it warned me itself that a one-shot "build everything" prompt would make a
weak prompt log. I agreed, and decided to build in small, deliberate steps.

### Prompt 2
> I would like this to be built like [my existing four-agent framework] where we have 4 agents,
> so basically need to have the same thing: whenever a new test case is written the agents should
> automate the whole thing. 

**Decision:** reuse the architecture I had already built for a previous project: Explorer
(the only agent with a browser) → Codegen (no browser) → Reviewer (rubric, not a persona) →
Doc-Gap (test case vs. observed behaviour).
**Where I steered / what it caught:**
- It recommended starting **from a fresh repo rather than a copy**, because the old framework
  contains client-specific material (another product's names, internal documents, credential
  templates) that must not go into a repo sent to a third party. I agreed.
- It recommended cutting the framework down (no ticket-system fetching, login, mutation gating
  or widget library), because this is a single public page and the brief caps effort at 4 hours.
- It pointed out that running the tests must **not** depend on the agents. A reviewer without
  Claude Code still runs one command.

### Prompt 3
> Yes. Create the repo at C:\Users\suhas\complystream-upload-tests and start by adapting the four agents.

**What it did:** scaffolded the repo and ported the four agent prompts, the `/automate`
orchestrator, the conventions rubric and the knowledge template.
**New rules it added for this brief** (I reviewed and kept them):
- `C-DEFECT-1..4`: the deliberately failing test must fail **red**, not be hidden behind
  `test.fail()` (which reports a known failure as a pass). It must fail *on the defect*, and it
  must be proved able to pass against a `page.route()` stub, so it can't be a fake `expect(false)`.
- `C-IO-3`: a "drag-and-drop" test must dispatch a real `drop` event. Calling `setInputFiles` on
  the hidden input tests a different code path. (This is a mistake AI tools commonly make here.)
- `C-IO-1`: only committed, harmless fixtures are uploaded, because this is a public server.

---

## Phase 2: Test cases

### Prompt 4
> Want me to draft the test cases now? Yes.

**What it did:** drafted `test-cases/TC-UPLOAD-001..010.md` as a **specification** (what the
page *should* do), not as a description of what it does. Three are marked to automate:
001 (happy path), 002 (empty submit; expected to fail on a real defect), 003 (real drag-and-drop).
The other seven each state why they can't be automated and what I'd need from ComplyStream.
**Where I steered:** anything recalled from memory instead of observed (e.g. "empty submit
returns a server error") is explicitly marked *not confirmed*. The Explorer must observe it
before any test relies on it.

### Prompt 5: catching that the test cases were written blind
> Did you navigate to https://the-internet.herokuapp.com/upload in order to understand it better
> and write the test cases?

**Where it went wrong:** it hadn't. The ten test cases were written **from the model's memory of
the page**, without opening it. It admitted this when asked. Part of that was defensible (test
cases are a spec, and the Explorer observes later), but facts such as element names and whether
the drop zone exists should be checked before writing cases.
**Correction:** I had it do a **read-only look** (accessibility snapshot plus DOM attributes, no
uploads, no submits) and correct the facts in the cases, leaving the expected behaviour as
written.
**What the look found that memory had missed:**
- The drop zone is **absent from the accessibility tree** (no role, name or tabindex), so it
  can't be located by role, and it is an accessibility defect (→ TC-009).
- The drop zone **auto-uploads** on drop (`autoProcessQueue: true`). TC-003 was rewritten from
  "find out whether it needs the button" to "uploads immediately, without the button".
- The two upload paths are **inconsistent**: the drop zone has a 256 MB client-side limit and
  allows multiple files; the form has no limit and allows one file (→ TC-006, TC-010).
- No `accept` / `acceptedFiles` on either path (→ TC-005).
- Two console errors on load unrelated to upload (analytics, favicon 404). A "clean console"
  assertion would be a false failure.
- The empty-submit 500 is **still unconfirmed**: the look deliberately didn't submit. Left for the
  Explorer.

---

## Phase 3: Agents automate each test case

### Prompt 6: the wrong `/automate` ran
> /automate TC-UPLOAD-001

**Where it went wrong:** the session was still open in my previous project, which also has an
`/automate` command, so Claude Code loaded **that** one: it fetched test cases from a
test-management tool, checked that project's credentials, and used the old project's agents.
The AI spotted the references to the other project and stopped at preflight without running anything. On the second attempt it planned to work
around the problem by following the new repo's file by hand. I interrupted that.

### Prompt 7
> Can we create a different /command rather than using one with the same name?

**Correction:** renamed the command to **`/pw-automate`**, matching the `pw-*` agent names, so it
can never collide with another project's `/automate`. All references (README, agent wrappers,
scenario map) were updated. Lesson: a command name is a global namespace across projects, so name
it specifically.

### Prompt 8: TC-UPLOAD-001 end to end
> /pw-automate TC-UPLOAD-001

**What it did:** the scenario was `blocked` from an earlier run, because the Playwright MCP
server's allowed file roots pointed at my previous project, so the Explorer couldn't upload
`sample.txt`. Running the session from this repo fixed the roots. The Explorer observed
steps 2–5 (`POST /upload -> 200`, h3 "File Uploaded!", `#uploaded-files` = "sample.txt" with
template whitespace). Then Codegen ran, and its self-verify passed, failed when an assertion
was inverted, and passed after the revert. Then Review (2 rounds), Doc-Gap and the final gates
ran. All green.
**Where the agents got it wrong:**
- **Codegen, step 4 (Review blocker, fixed):** it asserted the result heading only with
  `toBeVisible()` on `getByRole('heading', { name: 'File Uploaded!' })`. Without `exact: true`
  that name matches as a case-insensitive substring, so the core outcome wasn't pinned. It was
  changed to `toHaveText('File Uploaded!')`. The fix was verified by inverting to
  `'File Uploaded'`, which the loose locator still finds, so only the exact assertion can catch it.
- **Codegen, step 3:** it asserted exactly 200, justified as "knowledge wins". The Reviewer
  pointed out that this misreads C-TC-1: 200 is a 2xx, so there is no conflict.
- **Codegen, step 2:** the "nothing sent" request counter was read only once, so a POST fired
  late by choosing the file would be missed.
- **Codegen, step 2 (found by Doc-Gap):** it asserts the browser-specific input value
  `C:\fakepath\sample.txt`, where checking the file's name would work in any browser.
- **Process:** the batch report's `status: done` and the scenario map's `status: in_review`
  share a field name but mean different things (batch result vs. pipeline stage).
**Doc-Gap highlights:** "uploaded" is unverifiable beyond "200 plus name echoed", because no
download, checksum or storage access exists. "Valid file" is undefined, because there is no
type or size rule. DEFECT-001 (empty submit → 500) was confirmed, for TC-002.

### Prompt 9
> *(pasted the three open review suggestions)* Yes go ahead

**What it did:** sent the three suggestions to Codegen: an exact `toHaveText` for the step-1
heading, a 2xx range for step 3, and a total of exactly 1 POST after submit for step 2. They
then went back through review and the gates.

### Prompt 10: settling the rubric gaps
> Yes *(to the proposed conventions)*

**Decision:** three rules the Reviewer had flagged as "conventions silent on" were added:
- **C-ASSERT-5:** to assert that no request was sent, use a counter started before the action,
  check 0, then check the running total after a later action that does send one.
- **C-POM-5:** a page object may hold an observation helper, but it never asserts and its
  listeners must be removed.
- **C-ASSERT-1, clarified:** locators may match loosely; exactness lives in the assertion.

**What the new rules caught:** review round 3 checked the whole batch against them and found
2 blockers in code that earlier rounds had passed:
- the `page.on('request')` listener was never removed (C-POM-5);
- the counter matched POST plus pathname on any host (C-ASSERT-5).

Codegen fixed both: a `{ count, dispose }` helper with `dispose()` called in `finally`, and a
match on the exact URL derived from the current page. Round 4 approved.
**Where Codegen overclaimed:** its round-3 self-verify said "the finally block ran dispose()
on that failure path". No run showed that; it follows from how try/finally works. Codegen
flagged this itself, and the Reviewer raised it as a suggestion: a self-verify should state
only what a run showed.
**Still open:**
- `submit()` still identifies the upload request by path only, while the counter uses the
  exact URL. That is two definitions of the same request (C-POM-4).
- The Upload button and the step-2 heading are checked only with `toBeVisible`.
- C-ASSERT-1 has now come up in 2 review logs. One more crosses the C-AGENT-9 threshold for
  adding it to the Codegen prompt.

### Prompt 11
> Yes *(commit locally)*

**What it did:** made the first commit (framework plus TC-001) on `main`. Nothing was pushed.
It flagged that Git on Windows converts the `sample.txt` fixture to CRLF on checkout, which
changes its size. That was fixed later with `.gitattributes`.

### Prompt 12
> shall i run next test case now ?

**What it did:** recommended TC-002 next, because its state had already been observed. It also
suggested applying the review lessons to the Codegen prompt first. I went ahead without that,
which cost a repeat finding (see Prompt 13).

### Prompt 13: TC-UPLOAD-002, the deliberately failing test
> /pw-automate TC-UPLOAD-002

**What it did:** Explorer (one targeted loop) → Codegen → Review → Doc-Gap → gates. The result is
a `@known-defect` test that fails red on `POST /upload -> 500` (DEFECT-001). Self-verify followed
C-DEFECT-3: it failed against the live app, passed against a `page.route()` stub of the correct
behaviour, and failed again with the stub removed. TC-001 still passed.
**Where it went wrong:**
- **The orchestrator skipped the Explorer too early.** The knowledge file *described* the error
  page but had no locator entries for the message or the "Internal Server Error" heading. The
  heading was only mentioned in a note. Codegen correctly refused to guess and returned
  `blocked: needs_exploration`, naming exactly those facts. One Explorer loop added them
  (`#upload-error`, whose text is exact with no extra whitespace) and confirmed the 500 a second
  time. Lesson: "the state is described" is not the same as "the elements are recorded".
- **The knowledge check has a hole.** `npm run knowledge` passed with the heading recorded only
  in a note, because it checks that the locator text appears somewhere, not that it is a proper
  element entry.
- **Codegen repeated the loose check:** the Upload button was again asserted only with
  `toBeVisible`. That made C-ASSERT-1 a finding in a third review log, which crosses the rubric's
  "more than two" threshold. The fix belongs in the Codegen prompt.
- **The stub only proves part of it.** It models only one of the two outcomes the test case allows,
  and it never shows that the heading-absence check can fail.
**Doc-Gap:** the test case itself is ambiguous. Step 2 allows "stay on the form" (browser-side
check, no request) *or* "a page telling the user to choose a file". The status code and the
message wording are not specified either. If the bug is fixed the browser-side way, the test
would time out instead of turning green. These are product-owner decisions, not test fixes.

### Prompt 14
> Can we create a separate file for TC-UPLOAD-002?

**What it did:** Codegen moved the test unchanged (checked byte for byte) into its own spec, and
a review confirmed the move. Doc-Gap may only append, so it added a table mapping the old line
references to the new ones instead of rewriting its earlier findings.
**Where it went wrong:** stale references were missed in two places: a batch-report line and the
Doc-Gap agent's own example. The Reviewer suggested a rule: after moving a file, grep the repo
for the old path. That became part of C-TC-4 (Prompt 17).

### Prompt 15
> Okay first commit

**What it did:** committed the TC-002 work before starting TC-003, so each test case lands as its
own commit.

### Prompt 16: TC-UPLOAD-003, drag-and-drop
> /pw-automate TC-UPLOAD-003

**What it did:** the Explorer produced a *real* drop: a `drop` DragEvent on `#drag-drop-upload`
whose DataTransfer carries the fixture's bytes. It found that `drop` alone is enough, that the
upload is an XHR (`POST /upload -> 200`, no navigation), and that the ✔ mark is static markup shown
*before* the server answers. Codegen wrote `dropFile()`, reading the fixture with `fs` at run time.
This was the first run of the Playwright form of the drop. The review approved it first time,
with no blockers.
**What went right:** the mistake the test case predicted, `setInputFiles` on Dropzone's hidden
input (C-IO-3), did not happen. Both agents had been told explicitly that it would be blocked.
This was also the first batch without the `toBeVisible`-instead-of-text pattern.
**Where it went wrong or overclaimed:**
- `/\bdz-success\b/` also matches the class `dz-success-mark`, which the page uses. It works only
  because the preview element doesn't carry that class. Fix: `toContainClass('dz-success')`.
- A spec comment cited the knowledge file for the file input's position, which was never recorded.
- Only the file-name assertion was inverted, so the step-2 guards (no navigation, exactly one
  POST) were never seen to fail. This is the second review to raise per-assertion falsifiability.
- Codegen refactored `submit()` into a shared helper during this batch. The Reviewer re-ran TC-001
  and TC-002 to confirm nothing changed.
**Doc-Gap:** "the zone shows the file was accepted" is unverifiable from the user's side: nothing
visible distinguishes *uploaded* from *pending*. "Did not reset the form" can never fail, because
the form was empty before the drop. A real drag from the desktop still needs a manual check.

### Prompt 17
> Can we name them based on test case id? so its easy to track?

**Decision:** new rule **C-TC-4**: one spec per test case, named `<ID>-<slug>.spec.ts`, and after
any rename, grep the repo for the old path. The Codegen prompt was updated to match. Codegen
renamed the three specs with `git mv`; checksums were the same before and after. It updated the
live references (scenario map, `covered_by`, batch reports, agent examples) and left dated
records (review logs, doc-gaps) as written.

### Prompt 18: checking against the brief
> What is pending here? *(pasted the take-home brief)*

**What it did:** checked the repo against each requirement. The tests and the deliberate failure
were done. Missing were the "what I couldn't cover and what I'd need" write-up, this log from
Prompt 11 on, a note that `npm test` exits non-zero by design, a clean-clone check, and delivery.
It also flagged names from my earlier client project in Prompts 2 and 6, which are now placeholders.

### Prompt 19
> Yes

**What it did:** added the Results and "What I couldn't cover" sections to the README, the
`.gitattributes` rule for fixtures, and this log; then committed and ran the one documented
command from a fresh clone.

---

## Phase 4: Using the spare time for TC-UPLOAD-004

### Prompt 20: TC-UPLOAD-004 end to end
> /pw-automate TC-UPLOAD-004

**What it did:** Explorer (fifth session, file-chooser path only) → Codegen → Review (2 rounds)
→ Doc-Gap. The page echoes the name with exactly the same code points as on disk. It reused the
page object unchanged and only added a fixture entry, as the test case had predicted.
**Where the agents got it wrong:**
- **Codegen, step 2 (Review blocker):** it asserted the name with `toHaveText('résumé final (v2).txt')`.
  The Reviewer read Playwright's source and found that the string form normalises the **received**
  text as well (trims, collapses any whitespace run, including a non-breaking space, to one space).
  So the test could not see a changed space, which is half of what the case tests. Codegen **proved
  the gap** first (a U+00A0 in the expected name still *passed*), then switched to an anchored
  RegExp that allows only the observed template newlines and spaces around the name. With that,
  the U+00A0 and `%20` inversions both fail.
- **The single inversion picked the wrong property.** Round 1 inverted only the accent side of
  "exactly" (`%20`, NFD), never the whitespace side, which is where the bug was. This is the third
  time per-assertion falsifiability has come up, so the Reviewer proposed making C-AGENT-4 require
  one inversion per property the expected result names.
- **Codegen described code it hadn't written:** the batch report and a comment in
  `tests/fixtures/index.ts` say the fixture name uses `\u00e9` escapes. That line is a literal `é`
  (checked with `od -c`). This is now the third review log to catch a batch-report claim that the
  file or the runs don't support, which crosses the C-AGENT-9 threshold for a Codegen prompt change.
- **Knowledge carried the same mistake:** a gotcha in `knowledge/pages/upload.yaml` still recommends
  `toHaveText('<name>')` as an exact check. Because Codegen works from knowledge alone, the next
  test would bring the blocker back. That fix belongs to the Explorer.
**Doc-Gap:** no new defect. The test case itself is stale (it still says "not committed yet" and
"Not now"), and "exactly as on disk" names no Unicode form (NFC vs NFD) and doesn't say outright
that spaces must stay plain spaces. Still out of reach: the stored name (same access as
TC-UPLOAD-007), the filename bytes on the wire, the drag-and-drop path, and Firefox/WebKit.
**Still open after the run:** the `index.ts` comment/literal mismatch (review round 1, finding 2),
the `upload.yaml` gotcha (review round 2, finding r2-2) and the stale test-case text (Doc-Gap
finding A). See Prompt 21.

### Prompt 21: final clean-up before submission
> Yes go ahead

**What it did:**
- **Fixture name:** `tests/fixtures/index.ts` now really uses `\u00e9` escapes, so the comment is
  true. The precondition step now also checks that the fixture path's name equals `EXPECTED_NAME`
  (review round 1, finding 2).
- **Test case:** the TC-UPLOAD-004 text now uses Doc-Gap's proposed wording (signed off by me). It
  says the test is automated, the fixture is committed, and step 2 names NFC and plain spaces.
  The open scenarios are listed.
- **README:** updated to four automated tests and "1 failed, 3 passed".
- **Checks:** full suite: 1 failed (TC-002, on purpose), 3 passed; typecheck and knowledge gates clean.
- **Committed** the TC-004 work.

**Where it went wrong:** the first two attempts to write `\u00e9` into `index.ts` silently lost the
backslash in the shell and wrote `r00e9sum00e9`. Checking the bytes with `od -c` after each edit,
rather than trusting the command, caught it. That is the same check the Reviewer had used to find
the original mismatch.
**Left open on purpose:** the `upload.yaml` gotcha (r2-2) is a knowledge fix, and only the Explorer
writes knowledge (C-AGENT-1). The Codegen prompt changes the Reviewer recommended (check every
batch-report claim against the file; one inversion per property) are listed as next steps.
