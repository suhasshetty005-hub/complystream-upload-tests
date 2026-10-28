import { test, expect } from '../fixtures';

test.describe('Upload form (empty submit)', () => {
  test(
    'TC-UPLOAD-002: Submitting with no file selected shows a validation message',
    {
      tag: ['@tc:TC-UPLOAD-002', '@upload', '@known-defect'],
      annotation: {
        type: 'known-defect',
        description:
          'DEFECT-001: an empty submit returns HTTP 500 "Internal Server Error" instead of a validation ' +
          'response. Expected to fail red until fixed. See reports/doc-gaps.md, DEFECT-001.',
      },
    },
    async ({ uploadPage }) => {
      await test.step('1. Open /upload: the upload form is shown', async () => {
        await uploadPage.goto();
        await expect(uploadPage.heading).toHaveText('File Uploader');
        await expect(uploadPage.uploadButton).toBeVisible();
      });

      // Step 2's expected result ("a page that tells them to choose a file") is asserted in step 4,
      // after the status check, so the first failing assertion is the defect itself (C-DEFECT-4).
      const response = await test.step('2. Without choosing a file, click Upload', async () => {
        return uploadPage.submit();
      });

      await test.step('3. The response is not a server error', async () => {
        // First assertion after submit. On the live app this fails with 500 (DEFECT-001).
        const status = response.status();
        expect(status, `POST /upload status ${status} must not be 5xx (DEFECT-001)`).toBeLessThan(500);
        // Presence first, so the absence below cannot pass on a page that did not render (C-ASSERT-2).
        await expect(uploadPage.emptySubmitMessage).toBeVisible();
        await expect(uploadPage.emptySubmitErrorHeading).toBeHidden();
      });

      await test.step('4. A validation message says a file is required', async () => {
        // Exact string from knowledge elements.empty_submit_message (no surrounding whitespace).
        await expect(uploadPage.emptySubmitMessage).toHaveText(
          'No file was chosen. Please choose a file to upload.',
        );
      });
    },
  );
});
