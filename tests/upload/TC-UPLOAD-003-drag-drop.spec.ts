import { test, expect, files } from '../fixtures';

test.describe('Upload drag-and-drop zone', () => {
  test(
    'TC-UPLOAD-003: Drop a file onto the drag-and-drop zone',
    { tag: ['@tc:TC-UPLOAD-003', '@upload'] },
    async ({ uploadPage }) => {
      await test.step('1. Open /upload: a drag-and-drop zone is shown below the file chooser', async () => {
        await uploadPage.goto();
        await expect(uploadPage.heading).toHaveText('File Uploader');
        await expect(uploadPage.fileInput).toBeVisible();
        await expect(uploadPage.dropZone).toBeVisible();
        // "Below the file chooser": compare the rendered boxes (knowledge elements.drag_drop_zone,
        // states.initial: the zone sits below the Upload button, which is below the file input).
        const chooserBox = await uploadPage.fileInput.boundingBox();
        const zoneBox = await uploadPage.dropZone.boundingBox();
        expect(chooserBox, 'file chooser bounding box').not.toBeNull();
        expect(zoneBox, 'drop zone bounding box').not.toBeNull();
        expect(zoneBox!.y, 'drop zone top edge should be below the file chooser bottom edge').toBeGreaterThanOrEqual(
          chooserBox!.y + chooserBox!.height,
        );
      });

      // Started before the drop, so any POST /upload the drop causes is counted, including a form
      // submit it might trigger. The listener is removed in finally (C-POM-5).
      const uploadPosts = uploadPage.trackUploadPosts();
      try {
        await test.step('2. Drop sample.txt on the zone: POST /upload succeeds without clicking Upload', async () => {
          // A real 'drop' event carrying the committed fixture (C-IO-3, C-IO-1); response wait armed first (C-IO-2).
          const response = await uploadPage.dropFile(files.sampleTxt);
          // The test case asks for 2xx. Observed status was 200 (knowledge states.drag_drop).
          const status = response.status();
          expect(status, `POST /upload status ${status} should be 2xx`).toBeGreaterThanOrEqual(200);
          expect(status, `POST /upload status ${status} should be 2xx`).toBeLessThan(300);
          // Dropzone's XHR, not a form submit (knowledge states.drag_drop: no navigation).
          expect(response.request().isNavigationRequest(), 'the drop upload must not be a page navigation').toBe(false);
        });

        await test.step('3. The zone shows the file was accepted, with its name sample.txt', async () => {
          await expect(uploadPage.dropzonePreview).toHaveCount(1);
          // 'dz-success' is added only after the server answers 2xx; the ✔ mark is static markup
          // and is not used as evidence (knowledge elements.dropzone_success_mark, gotchas).
          await expect(uploadPage.dropzonePreview).toHaveClass(/\bdz-success\b/);
          // Exact text, no surrounding whitespace (knowledge elements.dropzone_file_name).
          await expect(uploadPage.dropzoneFileName).toHaveText('sample.txt');
        });

        await test.step('4. The file-chooser form is unchanged: not submitted, not reset', async () => {
          // Presence: still the form page, with the form's controls in their initial state.
          await expect(uploadPage.heading).toHaveText('File Uploader');
          // Observed after the drop: #file-upload value '' (knowledge states.drag_drop).
          await expect(uploadPage.fileInput).toHaveValue('');
          // #file-submit value 'Upload' (knowledge elements.upload_button).
          await expect(uploadPage.uploadButton).toHaveValue('Upload');
          // Absence, paired with the presence checks above (C-ASSERT-2): the form's result page did not appear.
          await expect(uploadPage.resultHeading).toBeHidden();
          await expect(uploadPage.uploadedFiles).toBeHidden();
          // Read after step 3 waited for the preview's dz-success, so a form POST fired late by the
          // drop would be counted here as 2 (C-ASSERT-5). The 1 is the drop's own XHR.
          expect(uploadPosts.count(), 'POST /upload requests in total (the drop XHR only)').toBe(1);
        });
      } finally {
        uploadPosts.dispose();
      }
    },
  );
});
