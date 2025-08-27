import { beforeEach, afterEach } from 'vitest';
import nock from 'nock';

// Global test setup
beforeEach(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
});