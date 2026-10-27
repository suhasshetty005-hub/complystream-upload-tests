# TC-UPLOAD-006: File size limits are enforced

**Priority:** High
**Type:** Boundary
**Automate:** No (blocked on a specification and on the environment)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Upload a 0-byte file | Behaviour as specified (accepted or rejected with a message) |
| 2 | Upload a file exactly at the limit | Accepted |
| 3 | Upload a file 1 byte over the limit | Rejected with a message naming the limit; no 5xx or timeout |

## Why it can't be automated yet
There is no documented limit. Found on 2026-10-27: the **drop zone** is configured with
`maxFilesize: 256` (MB, client-side), while the **file-chooser form** has no client-side limit.
The two upload paths may therefore enforce different limits. Which one, if either, matches the
server is unknown. Testing large files against a shared public demo server would
also be inappropriate: it could degrade the service for other users, and Heroku's own request
limits would be what the test actually measured.

## What would be needed
- The specified maximum size (and minimum, if any).
- A test environment we are allowed to load.
