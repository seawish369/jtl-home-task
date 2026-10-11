import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans when Vitest globals are enabled; we import from
// 'vitest' explicitly, so unmount rendered trees between tests here.
afterEach(() => {
  cleanup();
});
