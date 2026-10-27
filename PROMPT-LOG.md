# Prompt log

Tool: **Claude Code** (VS Code extension), model Claude Opus 5.5.
This log lists my prompts in order, what the tool did with each one, and where I had to
correct it. Prompts are verbatim apart from typo fixes.

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
> automate the whole thing. What do you think?

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

### Prompts 4–6: checking the port
> Are they general, that can be used for any project? Have you checked whether there is any
> MainManager data in it? Or do we need to write specific agent data based on the project URL?

> Should I do that split now, or leave it? What do you suggest? / What exactly do we mean by
> "leave the split for later"?

**What I checked:** I had it **grep the new repo** for every client-specific term (product
name, env-var prefix, ticket keys, tenant host, internal widget names) instead of taking its
word. All hits were false positives (e.g. `om-` inside `C-POM-1`).
**Decision:** the *workflow* is generic, but about 20% of the text is specific to this page (base
URL, states to exercise, file names). Moving that into a single `docs/project-profile.md` would
make the agents reusable on any app. **I deferred it**: it isn't one of the brief's deliverables,
the 4-hour cap is tight, and refactoring agents before they have run once mixes refactor bugs
with real ones. It is listed as a next step.

---

## Phase 2: Test cases

### Prompt 7
> Want me to draft the test cases now? Yes.

**What it did:** drafted `test-cases/TC-UPLOAD-001..010.md` as a **specification** (what the
page *should* do), not as a description of what it does. Three are marked to automate:
001 (happy path), 002 (empty submit; expected to fail on a real defect), 003 (real drag-and-drop).
The other seven each state why they can't be automated and what I'd need from ComplyStream.
**Where I steered:** anything recalled from memory instead of observed (e.g. "empty submit
returns a server error") is explicitly marked *not confirmed*. The Explorer must observe it
before any test relies on it.

### Prompt 8: catching that the test cases were written blind
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

### Prompt 9: the wrong `/automate` ran
> /automate TC-UPLOAD-001

**Where it went wrong:** the session was still open in my previous project, which also has an
`/automate` command, so Claude Code loaded **that** one: "Automate Zephyr test case…", MainManager
credential checks, the old `mm-*` agents. The AI spotted the Zephyr and MainManager references
and stopped at preflight without running anything. On the second attempt it planned to work
around the problem by following the new repo's file by hand. I interrupted that.

### Prompt 10
> Can we create a different /command rather than using one with the same name?

**Correction:** renamed the command to **`/pw-automate`**, matching the `pw-*` agent names, so it
can never collide with another project's `/automate`. All references (README, agent wrappers,
scenario map) were updated. Lesson: a command name is a global namespace across projects, so name
it specifically.

### Prompt 11: TC-UPLOAD-001 end to end
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

### Prompt 12
> *(pasted the three open review suggestions)* Yes go ahead

**What it did:** sent the three suggestions to Codegen: an exact `toHaveText` for the step-1
heading, a 2xx range for step 3, and a total of exactly 1 POST after submit for step 2. They
then went back through review and the gates.

### Prompt 13: settling the rubric gaps
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

*(continues as each test case is automated)*
