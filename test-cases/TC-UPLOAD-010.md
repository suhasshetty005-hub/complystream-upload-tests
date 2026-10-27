# TC-UPLOAD-010: Multiple files, and changing the selection before upload

**Priority:** Low
**Type:** Functional / edge case
**Automate:** No (blocked on the intended behaviour)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Try to select two files at once | Either both are accepted, or the chooser only allows one; as specified |
| 2 | Choose file A, then choose file B, then Upload | Only B is uploaded |
| 3 | Upload a file, then use the browser Back button and upload again | No duplicate submission or error |

## Why it can't be automated yet
It is unclear whether multi-file upload is meant to be supported, and the page contradicts
itself. Found on 2026-10-27: the file-chooser input is single-file (no `multiple`), but the
drop zone's hidden input **has `multiple`** and the zone sets no `maxFiles`. The same page
allows one file on one path and many on the other. Asserting either answer would
be inventing a requirement.

## What would be needed
- Confirmation of single- vs multi-file intent, and the expected behaviour on re-submit.
