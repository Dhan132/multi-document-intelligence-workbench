import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { app } from '../server';

describe('Health endpoint', () => {
  it('returns the expected JSON payload', async () => {
    const server = app.listen(0);

    try {
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Server did not bind to a port.');
      }

      const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.match(payload.message, /Multi-Document Intelligence API is running/i);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});
