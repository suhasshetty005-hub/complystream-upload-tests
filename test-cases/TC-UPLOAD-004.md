# TC-UPLOAD-004: File names with spaces and non-ASCII characters are preserved

**Priority:** Medium
**Type:** Edge case
**Automate:** Not now. It is time-boxed; it could be added with the existing page object and one
new fixture.

## Test data
- A fixture such as `résumé final (v2).txt` (not committed yet)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Upload the fixture with the file chooser | Upload succeeds (2xx) |
| 2 | Observe the uploaded-file name | The name is shown exactly as on disk, with no `%20`, `?` or mangled accents |

## Why it matters
Encoding bugs in file names are common and show up in compliance records, for example a signed
document whose name doesn't match the original.

## What would be needed
Nothing from ComplyStream. It was left out only because of the 4-hour cap.
