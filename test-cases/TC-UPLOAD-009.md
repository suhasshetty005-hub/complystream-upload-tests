# TC-UPLOAD-009: Upload works on every supported browser and is accessible

**Priority:** Medium
**Type:** Compatibility / accessibility
**Automate:** No (blocked on the supported-browser list and the accessibility standard)

## Steps

| # | Action | Expected result |
|---|--------|-----------------|
| 1 | Run TC-UPLOAD-001 and 003 in Firefox and WebKit | Same results as in Chromium |
| 2 | Complete an upload using only the keyboard | The file chooser and Upload button are reachable and operable |
| 3 | Check the file input with a screen reader / accessibility tree | It has an accessible name that says what it is for |

## Already observed (read-only look, 2026-10-27)
- **The drag-and-drop zone is invisible to assistive technology.** `#drag-drop-upload` does not
  appear in the accessibility tree: no role, no accessible name, no `tabindex`. A keyboard or
  screen-reader user cannot discover it. (They can still use the file chooser, which mitigates
  this.)
- The file input has **no `<label>`**. Its accessible name comes only from the browser's
  built-in "Choose File" button text, which says nothing about what the file is for.
- The console shows two errors on load (a blocked analytics request, and `favicon.ico` → 404).
  Neither affects uploading, but a "no console errors" check would fail on this page for
  reasons unrelated to the feature.

## Why it can't be automated yet
Adding Firefox and WebKit projects is a one-line config change, but without a list of supported
browsers I can't say which failures matter. A full accessibility scan needs a library such as
axe-core, which this suite deliberately leaves out (C-AGENT-10) until there is a standard to test
against.

## What would be needed
- The supported browsers, versions and devices.
- The accessibility target (e.g. WCAG 2.2 AA).
