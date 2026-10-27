---
description: Automate a local test case end to end with the four agents (Explorer, Codegen, Review, Doc-Gap)
argument-hint: <TC-ID>
---

Automate test case **$ARGUMENTS** in this repo.

You are the **orchestrator**. You do not explore the app or write test code yourself. You run
the four agents as subagents (`pw-explorer`, `pw-codegen`, `pw-reviewer`, `pw-doc-gap`), give each
one exactly the context its prompt in `agents/` asks for, and decide what runs next. Keep the
user posted with one short line per stage.

## Stage 0: Preflight (stop on any failure, and say exactly what to fix)

1. `test-cases/$ARGUMENTS.md` exists and has at least one step with an expected result.
2. `node_modules/` exists. If it doesn't, run `npm install`.
3. The Playwright MCP tools (`mcp__playwright__*`) are available. If they are not, tell the user
   to approve the `playwright` server from `.mcp.json` and restart, then stop.

## Stage 1: Map it to a scenario

1. Search `knowledge/scenario-map.yaml` for `id: <ID>`.
   - Found with `status: done`: tell the user it is already automated, name the files, and ask
     whether to regenerate. Stop unless they say yes.
   - Not found: add an entry with `id`, `title` (from the test case), `page: pages/upload`,
     `status: not_started`.
2. Read `knowledge/pages/<page>.yaml` if it exists, and list the test-case steps it does **not**
   cover.

## Stage 2: Explorer (only if there are uncovered steps or no knowledge file)

Launch `pw-explorer` with the page, the uncovered steps quoted from the test case, the knowledge
file path to create or update, and the test-case id. When it reports back, set
`status: explored`.

## Stage 3: Codegen

Launch `pw-codegen` with the test-case id, `test-cases/<ID>.md` and the knowledge file paths.

- `blocked: needs_exploration`: run Stage 2 again for **exactly** the missing facts it named,
  then run Codegen again. Allow at most **2** of these loops. After that, stop, set
  `status: blocked` with the reason, and report.
- `blocked` for any other reason: stop and report.

## Stage 4: Review

Launch `pw-reviewer` with the batch report path, the changed files (`git status --short`), the
knowledge files and `test-cases/<ID>.md`.

- `changes_requested` with blockers: launch `pw-codegen` to apply exactly those blockers, then
  review again. Allow at most **2** rounds. After that, stop with `status: in_review` and list
  the open blockers.
- Suggestions only: do not loop. List them in the final summary.

## Stage 5: Doc-Gap

Launch `pw-doc-gap` with `test-cases/<ID>.md`, the knowledge files and the batch report. It runs
even when everything passed, because a green test can still be checking a wrong test case.

## Stage 6: Final gates (you run these yourself)

1. `npm run typecheck` and `npm run knowledge` are clean.
2. `npx playwright test --grep "@tc:<ID>" --retries=0` gives the expected result: **pass**, or
   for an `@known-defect` test, **fail with the defect in the message** (C-DEFECT-4).
3. Set the scenario's `status: done` and `files:` in `knowledge/scenario-map.yaml`.

## Stage 7: Report

Give the user a short summary:

- the spec and page-object files created or changed, with links;
- the self-verify result in one sentence;
- the review verdict, any open suggestions, and **every place an agent got something wrong and
  how it was corrected**. This feeds `PROMPT-LOG.md`, so be specific;
- the Doc-Gap findings, **especially unverifiable scenarios**;
- what was **not** automated, and why.

Then **ask**, rather than just doing it, whether to commit the changes locally. Never push.

## Rules for the whole run

- Never write test code or explore the app yourself. That is what the subagents are for.
- Never relax an agent's constraints to get a green result. A clear `blocked` beats a test that
  passes for the wrong reason.
- One test case per run.
