import { test as base } from '@playwright/test';
import path from 'node:path';
import { UploadPage } from '../../pages/UploadPage';

/** Committed, harmless upload fixtures only (C-IO-1). */
export const files = {
  sampleTxt: path.join(__dirname, 'files', 'sample.txt'),
};

type Fixtures = {
  uploadPage: UploadPage;
};

export const test = base.extend<Fixtures>({
  uploadPage: async ({ page }, use) => {
    await use(new UploadPage(page));
  },
});

export { expect } from '@playwright/test';
