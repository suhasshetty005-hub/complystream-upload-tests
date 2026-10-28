import fs from 'node:fs';
import path from 'node:path';
import type { Locator, Page, Request, Response } from '@playwright/test';

/**
 * The /upload screen (file-chooser form and drag-and-drop zone) and the result page the form
 * posts back to (same URL).
 * Every locator traces to knowledge/pages/upload.yaml (C-LOC-4).
 */
export class UploadPage {
  /** h3 "File Uploader" on the form page. knowledge: elements.heading */
  readonly heading: Locator;
  /**
   * The form's file input. C-LOC-2 fallback: its only accessible name is the browser's native
   * "Choose File" label (no <label>, no aria-label), and a second hidden Dropzone file input
   * exists, so the stable id is used. knowledge: elements.file_input, gotchas
   */
  readonly fileInput: Locator;
  /** Submit button "Upload". knowledge: elements.upload_button */
  readonly uploadButton: Locator;
  /** h3 "File Uploaded!" on the result page. knowledge: elements.result_heading */
  readonly resultHeading: Locator;
  /**
   * Panel listing the uploaded file name(s). C-LOC-2 fallback: exposed only as an unnamed
   * generic with no role or accessible name; it has a stable id. knowledge: elements.uploaded_files
   */
  readonly uploadedFiles: Locator;
  /**
   * h3 "Internal Server Error" on the page returned by an empty submit (POST /upload -> 500).
   * knowledge: elements.empty_submit_error_heading
   */
  readonly emptySubmitErrorHeading: Locator;
  /**
   * The "No file was chosen..." message on the empty-submit page. C-LOC-2 fallback: it is an
   * unnamed paragraph (paragraphs are not named from content, so getByRole cannot target it);
   * it has a stable id. knowledge: elements.empty_submit_message
   */
  readonly emptySubmitMessage: Locator;
  /**
   * The Dropzone.js drag-and-drop zone below the form. C-LOC-2 fallback: it is absent from the
   * accessibility tree (no role, name or tabindex), so only its stable id can target it.
   * knowledge: elements.drag_drop_zone
   */
  readonly dropZone: Locator;
  /**
   * The preview Dropzone adds inside the zone for a dropped file. C-LOC-3: an unnamed generic with
   * no id, so Dropzone's own '.dz-preview' template class is used, scoped to the zone id. Its
   * 'dz-success' class is the acceptance signal (the ✔ mark is static markup and proves nothing).
   * knowledge: elements.dropzone_preview, gotchas
   */
  readonly dropzonePreview: Locator;
  /**
   * The dropped file's name in the preview. C-LOC-3: an unnamed generic with no id; [data-dz-name]
   * is the attribute Dropzone fills with the name, scoped to the zone. knowledge: elements.dropzone_file_name
   */
  readonly dropzoneFileName: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'File Uploader', level: 3 });
    this.fileInput = page.locator('#file-upload');
    this.uploadButton = page.getByRole('button', { name: 'Upload' });
    this.resultHeading = page.getByRole('heading', { name: 'File Uploaded!', level: 3 });
    this.uploadedFiles = page.locator('#uploaded-files');
    this.emptySubmitErrorHeading = page.getByRole('heading', { name: 'Internal Server Error', level: 3 });
    this.emptySubmitMessage = page.locator('#upload-error');
    this.dropZone = page.locator('#drag-drop-upload');
    this.dropzonePreview = page.locator('#drag-drop-upload .dz-preview');
    this.dropzoneFileName = page.locator('#drag-drop-upload [data-dz-name]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/upload');
  }

  /**
   * Choose a file through the file chooser that "Choose File" opens (knowledge: states
   * file_chosen_not_submitted). The chooser event is armed before the click (C-IO-2).
   */
  async chooseFile(filePath: string): Promise<void> {
    const [chooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.fileInput.click(),
    ]);
    await chooser.setFiles(filePath);
  }

  /**
   * Click Upload and return the POST /upload response. Used with a file chosen (knowledge:
   * states successful_submit) and with none (knowledge: states empty_submit); the action is the
   * same click, so there is one method for both (C-POM-4).
   * The response wait is armed before the click (C-IO-2) and filtered to the app's own
   * /upload POST, ignoring third-party beacons (knowledge: gotchas).
   */
  async submit(): Promise<Response> {
    const [response] = await Promise.all([this.waitForUploadPost(), this.uploadButton.click()]);
    return response;
  }

  /**
   * Drop a file onto the drag-and-drop zone with a real 'drop' event carrying a DataTransfer
   * (C-IO-3; knowledge: states.drag_drop, gotchas). This is Dropzone's own XHR path, not the form:
   * it never touches #file-upload or input.dz-hidden-input and never clicks the zone.
   * The file's bytes are read from the given committed fixture at call time (C-IO-1) and rebuilt
   * as a File in the page. A 'drop' alone was observed to be enough (no dragenter/dragover).
   * The POST /upload response wait is armed before the drop (C-IO-2) and is returned.
   */
  async dropFile(filePath: string, mimeType = 'text/plain'): Promise<Response> {
    const file = {
      name: path.basename(filePath),
      type: mimeType,
      base64: fs.readFileSync(filePath).toString('base64'),
    };
    const dataTransfer = await this.page.evaluateHandle(({ name, type, base64 }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], name, { type }));
      return dt;
    }, file);
    try {
      const [response] = await Promise.all([
        this.waitForUploadPost(),
        this.dropZone.dispatchEvent('drop', { dataTransfer }),
      ]);
      return response;
    } finally {
      await dataTransfer.dispose();
    }
  }

  /**
   * Wait for the app's own POST /upload response, ignoring third-party beacons (knowledge:
   * gotchas). Shared by the form submit and the drop, which post to the same URL.
   */
  private waitForUploadPost(): Promise<Response> {
    return this.page.waitForResponse(
      (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/upload',
    );
  }

  /**
   * Start counting POST /upload requests from now on. Used to prove an action sends nothing
   * to the server (C-ASSERT-5). Call after goto(): the target is the exact /upload URL on the
   * current page's origin (BASE_URL can override it), so POSTs to /upload on other hosts are
   * not counted. Returns a reader for the count and a disposer that removes the listener
   * (C-POM-5); the caller must call dispose().
   */
  trackUploadPosts(): { count: () => number; dispose: () => void } {
    const target = new URL('/upload', this.page.url()).href;
    let count = 0;
    const onRequest = (req: Request): void => {
      if (req.method() === 'POST' && req.url() === target) count++;
    };
    this.page.on('request', onRequest);
    return {
      count: () => count,
      dispose: () => {
        this.page.off('request', onRequest);
      },
    };
  }
}
