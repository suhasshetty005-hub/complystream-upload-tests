# TC-UPLOAD-008: Malicious and hostile uploads are rejected safely

**Priority:** High
**Type:** Security
**Automate:** No (needs an environment we own, and permission)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Upload the EICAR anti-virus test file | Rejected or quarantined; the user is told why |
| 2 | Upload a file named `../../etc/passwd.txt` | The name is sanitised; nothing is written outside the upload directory |
| 3 | Upload a file whose name contains `<script>` | The name is escaped when displayed; no script runs |
| 4 | Upload an HTML/SVG file containing script | It is not served back inline in a way that executes |

## Why it can't be automated here
Sending hostile payloads to a public third-party server is not appropriate without authorisation,
even with harmless test strings.

## What would be needed
- A ComplyStream-owned test environment and written permission to run security cases.
- The expected handling policy: reject, quarantine or sanitise.
