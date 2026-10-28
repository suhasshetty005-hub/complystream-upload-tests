import type { Locator, Page, Request, Response } from '@playwright/test';

/**
 * The /upload screen and the result page it posts back to (same URL).
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

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'File Uploader', level: 3 });
    this.fileInput = page.locator('#file-upload');
    this.uploadButton = page.getByRole('button', { name: 'Upload' });
    this.resultHeading = page.getByRole('heading', { name: 'File Uploaded!', level: 3 });
    this.uploadedFiles = page.locator('#uploaded-files');
    this.emptySubmitErrorHeading = page.getByRole('heading', { name: 'Internal Server Error', level: 3 });
    this.emptySubmitMessage = page.locator('#upload-error');
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
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/upload',
      ),
      this.uploadButton.click(),
    ]);
    return response;
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
