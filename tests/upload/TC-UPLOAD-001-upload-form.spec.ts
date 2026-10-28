import { test, expect, files } from '../fixtures';

test.describe('Upload form (file picker)', () => {
  test(
    'TC-UPLOAD-001: Upload a valid file using the file picker',
    { tag: ['@tc:TC-UPLOAD-001', '@upload', '@smoke'] },
    async ({ uploadPage }) => {
      await test.step('1. Open /upload: heading, file chooser and Upload button are shown', async () => {
        await uploadPage.goto();
        await expect(uploadPage.heading).toHaveText('File Uploader');
        await expect(uploadPage.fileInput).toBeVisible();
        await expect(uploadPage.uploadButton).toBeVisible();
      });

      // Started before the file is chosen; read again after submit in step 3, so a POST fired
      // late by choosing the file shows up there as a count of 2.
      // The listener is removed in finally, so it does not leak when a step fails (C-POM-5).
      const uploadPosts = uploadPage.trackUploadPosts();
      try {
        await test.step('2. Choose sample.txt: the file is selected and nothing is sent', async () => {
          await uploadPage.chooseFile(files.sampleTxt);
          // Value recorded in knowledge states.file_chosen_not_submitted.
          await expect(uploadPage.fileInput).toHaveValue('C:\\fakepath\\sample.txt');
          // Still on the form (presence), and no POST /upload was made (C-ASSERT-2).
          await expect(uploadPage.heading).toBeVisible();
          expect(uploadPosts.count(), 'POST /upload requests after choosing a file').toBe(0);
        });

        await test.step('3. Click Upload: the upload request succeeds', async () => {
          const response = await uploadPage.submit();
          // The test case asks for 2xx. Observed status was 200 (knowledge states.successful_submit).
          const status = response.status();
          expect(status, `POST /upload status ${status} should be 2xx`).toBeGreaterThanOrEqual(200);
          expect(status, `POST /upload status ${status} should be 2xx`).toBeLessThan(300);
          // Exactly one POST /upload overall: the submit. A late POST from choosing the file would make it 2.
          expect(uploadPosts.count(), 'POST /upload requests in total (choose + submit)').toBe(1);
        });
      } finally {
        uploadPosts.dispose();
      }

      await test.step('4. Result page shows the confirmation heading', async () => {
        await expect(uploadPage.resultHeading).toHaveText('File Uploaded!');
      });

      await test.step('5. Exactly sample.txt is shown as the uploaded file', async () => {
        // toHaveText normalises the template whitespace around the name (knowledge gotchas).
        await expect(uploadPage.uploadedFiles).toHaveText('sample.txt');
      });
    },
  );
});
