# TC-UPLOAD-001: Upload a valid file using the file picker

**Priority:** High
**Type:** Functional (happy path)
**Automate:** Yes

## Preconditions
- `/upload` is reachable.

## Test data
- `tests/fixtures/files/sample.txt` (small plain-text file, committed)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Open `/upload` | The page shows the heading "File Uploader", a file chooser ("Choose File") and an Upload button |
| 2 | Choose `sample.txt` with the file chooser | The file is selected; nothing is sent to the server yet |
| 3 | Click **Upload** | The upload request succeeds (2xx) |
| 4 | Observe the result page | A confirmation heading says the file was uploaded |
| 5 | Observe the uploaded-file name | Exactly `sample.txt` is shown, with no other file names |

## Notes
- This is the baseline every other upload case is compared against.
- Step 3 checks the server's response, not only the page (C-ASSERT-4). A success heading alone
  could be shown by a cached or error page.
- Read-only look on 2026-10-27 confirmed the heading "File Uploader", the file input
  `#file-upload` (exposed as button "Choose File", with no `<label>`) and the Upload button
  `#file-submit`. The form posts `multipart/form-data` to `/upload`. The result page has
  **not** been observed yet; that is the Explorer's job.
