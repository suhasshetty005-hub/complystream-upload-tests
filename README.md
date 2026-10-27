# ComplyStream take-home: upload page tests

Playwright + TypeScript tests for <https://the-internet.herokuapp.com/upload>.

## Run it

Requires Node 18+.

```bash
npm install && npm test
```

`npm test` installs the Chromium browser on first run (via `pretest`) and then runs the suite.
The HTML report is written to `playwright-report/`. Open it with `npm run report`.

> **One test fails on purpose.** It is tagged `@known-defect` and asserts the behaviour a user
> should get, against a real defect on the page. See `reports/doc-gaps.md`.
> To run only the passing tests: `npm run test:passing`.

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
tests/             specs, fixtures, upload fixture files
agents/            full agent instructions
.claude/           Claude Code subagent wrappers + /pw-automate command
docs/              conventions rubric
reports/           codegen batch reports, review logs, doc gaps
PROMPT-LOG.md      how I directed the AI, including corrections
```
