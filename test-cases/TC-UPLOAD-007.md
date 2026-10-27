# TC-UPLOAD-007: An uploaded file is stored intact and can be retrieved

**Priority:** High
**Type:** Functional / data integrity
**Automate:** No (cannot be verified from the UI)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Upload `sample.txt` | Upload succeeds |
| 2 | Retrieve the stored file | The stored bytes match the original (same size and checksum) |

## Why it can't be automated yet
The page only echoes the file **name** back. It does not prove the file was stored, or stored
intact. A test that passes on the echoed name would be claiming more than it checks.

## What would be needed
- An API or download endpoint for uploaded files, **or** read access to the storage (e.g. a
  test bucket).
- For a compliance product, also the audit-log entry an upload should produce.
