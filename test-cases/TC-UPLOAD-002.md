# TC-UPLOAD-002: Submitting with no file selected shows a validation message

**Priority:** High
**Type:** Negative
**Automate:** Yes (expected to fail against the current page; see Notes)

## Preconditions
- `/upload` is reachable.

## Test data
- None. No file is chosen.

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Open `/upload` | The upload form is shown |
| 2 | Without choosing a file, click **Upload** | The user stays on the upload form, or gets a page that tells them to choose a file |
| 3 | Observe the response | No server error: the response is not a 5xx, and the page does not show "Internal Server Error" |
| 4 | Observe the message | A validation message tells the user a file is required |

## Notes
- Every file-upload form has to handle this, and it is the mistake users make most often.
- I recall that the current page returns a raw server error here. **This is still not
  confirmed**: the read-only look on 2026-10-27 deliberately did not submit anything. The
  Explorer must observe it. If it does, this test is the suite's deliberately failing
  `@known-defect` test (C-DEFECT-1..4): it asserts the behaviour a user should get, and fails on
  the real defect.
