# TC-UPLOAD-005: Only allowed file types are accepted

**Priority:** High
**Type:** Negative / validation
**Automate:** No (blocked on a specification)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Upload one file of each allowed type | Each succeeds |
| 2 | Upload a disallowed type (e.g. `.exe`) | Rejected with a clear message; nothing stored |
| 3 | Upload a disallowed file renamed to an allowed extension (`.exe` → `.pdf`) | Rejected, because the server checks content, not only the extension |

## Why it can't be automated yet
The page publishes no list of allowed types. Confirmed on 2026-10-27: the file input has no
`accept` attribute and the drop zone is configured with `acceptedFiles: null`, so neither path
restricts type on the client. Without
a specification, any assertion here would be my guess written down as a requirement.

## What would be needed
- The list of allowed MIME types and extensions.
- Whether the server validates by extension, by declared MIME type, or by inspecting content.
