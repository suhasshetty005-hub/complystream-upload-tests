# TC-UPLOAD-003: Drop a file onto the drag-and-drop zone

**Priority:** Medium
**Type:** Functional (alternative input path)
**Automate:** Yes

## Preconditions
- `/upload` is reachable.

## Test data
- `tests/fixtures/files/sample.txt`

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Open `/upload` | A drag-and-drop zone is shown below the file chooser |
| 2 | Drop `sample.txt` onto the zone (a real `drop` event carrying the file) | The file uploads straight away, without the Upload button: `POST /upload` succeeds (2xx) |
| 3 | Observe the zone | The zone shows that the file was accepted, displaying its name `sample.txt` |
| 4 | Observe the rest of the page | The file-chooser form is unchanged (the drop did not also submit or reset it) |

## Notes
- The drop zone is a **different code path** from the file chooser. Using `setInputFiles` on the
  hidden input does not test it (C-IO-3). This is the mistake I expect the AI to make, and the
  Reviewer is told to block it.
- Read-only look on 2026-10-27: the zone is `#drag-drop-upload`, a 400×400 `div` driven by the
  Dropzone.js library. It is configured with `url: /upload`, `method: POST`, `paramName: file`,
  `autoProcessQueue: true`, so a drop should upload **immediately**. That is what the
  **configuration** says; it has not been seen happen. What the zone shows afterwards is
  `NOT YET OBSERVED`. The Explorer must record both before Codegen runs.
- The zone does **not appear in the accessibility tree at all** (no role, label or tabindex), so
  it can't be located by role. A DOM-id locator with a stated reason is justified (C-LOC-2). See
  TC-UPLOAD-009 for the accessibility side.
- Cross-browser: drag-and-drop behaves differently in WebKit and Firefox. The suite runs on
  Chromium only; see TC-UPLOAD-009.
