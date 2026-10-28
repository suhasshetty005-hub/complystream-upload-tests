# TC-UPLOAD-004: File names with spaces and non-ASCII characters are preserved

**Priority:** Medium
**Type:** Edge case
**Automate:** Yes. `tests/upload/TC-UPLOAD-004-unicode-file-name.spec.ts` (file chooser path only).

## Test data
- `tests/fixtures/files/résumé final (v2).txt` (committed in 0ec2f0c; 89 bytes; the name is stored
  as NFC, with each é as U+00E9)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Upload the fixture with the file chooser | Upload succeeds (2xx) |
| 2 | Observe the uploaded-file name | The name is shown with the same code points as the fixture name (NFC; each é is U+00E9; spaces are U+0020). No `%20`, no `?`, no mojibake such as `Ã©`, no non-breaking or collapsed spaces |

## Why it matters
Encoding bugs in file names are common and show up in compliance records, for example a signed
document whose name doesn't match the original.

## Still not covered, and what would be needed
- **NFC vs NFD:** whether a canonically equivalent (NFD) name is also acceptable is a product
  decision. Covering NFD also needs an NFD-named fixture.
- **The stored name:** the page only echoes the name. Proving the stored record carries it needs
  storage access or a download endpoint (the same access as TC-UPLOAD-007).
- **Filename bytes on the wire** (multipart `Content-Disposition`): not yet observed. This needs
  nothing from ComplyStream, only an Explorer session.
- **Drag-and-drop with this name:** not yet observed. The drop path doesn't render the server's
  response, so it would be checked on the XHR response body.
- **Firefox and WebKit:** needs the supported-browser list (see TC-UPLOAD-009).
