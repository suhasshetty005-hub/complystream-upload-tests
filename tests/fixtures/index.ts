import { test as base } from '@playwright/test';
import path from 'node:path';
import { UploadPage } from '../../pages/UploadPage';

/** Committed, harmless upload fixtures only (C-IO-1). */
export const files = {
  sampleTxt: path.join(__dirname, 'files', 'sample.txt'),
  /**
   * 'résumé final (v2).txt': spaces, parentheses and two precomposed é (U+00E9, NFC), matching the
   * committed file's on-disk name. Written with \u escapes so an editor cannot silently turn it
   * into NFD (knowledge: gotchas, Unicode normalisation).
   */
  unicodeNameTxt: path.join(__dirname, 'files', 'r\u00e9sum\u00e9 final (v2).txt'),
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
