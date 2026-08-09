import assert from 'node:assert/strict';
import test from 'node:test';

import handler from './contact.js';

const validBody = {
  name: 'Test Person',
  email: 'test@example.com',
  organization: 'Example Co',
  reason: 'Leadership inquiry',
  message: 'A private test message',
  website: '',
};

function mockResponse() {
  return {
    headers: new Map(),
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      this.headers.set(name.toLowerCase(), String(value));
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

function mockRequest(overrides = {}) {
  return {
    method: 'POST',
    body: validBody,
    headers: {
      'x-forwarded-for': `192.0.2.${Math.floor(Math.random() * 200) + 1}`,
      'x-vercel-id': 'iad1::contact-test',
    },
    socket: {},
    ...overrides,
  };
}

async function withDeliveryEnv(run) {
  const previousKey = process.env.RESEND_API_KEY;
  const previousTo = process.env.CONTACT_TO_EMAIL;
  process.env.RESEND_API_KEY = 'test-key-never-logged';
  process.env.CONTACT_TO_EMAIL = 'private-inbox@example.com';
  try {
    await run();
  } finally {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousTo === undefined) delete process.env.CONTACT_TO_EMAIL;
    else process.env.CONTACT_TO_EMAIL = previousTo;
  }
}

test('responses are explicitly non-cacheable', async () => {
  const res = mockResponse();
  await handler(mockRequest({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(res.headers.get('pragma'), 'no-cache');
});

test('passes an abort signal to Resend', async () => {
  await withDeliveryEnv(async () => {
    const previousFetch = globalThis.fetch;
    let signal;
    globalThis.fetch = async (_url, options) => {
      signal = options.signal;
      return { ok: true, status: 200 };
    };
    try {
      const res = mockResponse();
      await handler(mockRequest(), res);
      assert.equal(res.statusCode, 200);
      assert.ok(signal instanceof AbortSignal);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test('aborts a timed-out Resend request and logs no personal data', async () => {
  await withDeliveryEnv(async () => {
    const previousFetch = globalThis.fetch;
    const previousTimeout = process.env.CONTACT_RESEND_TIMEOUT_MS;
    const previousError = console.error;
    const logs = [];
    process.env.CONTACT_RESEND_TIMEOUT_MS = '100';
    console.error = (line) => logs.push(String(line));
    globalThis.fetch = async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    });
    try {
      const res = mockResponse();
      await handler(mockRequest(), res);
      assert.equal(res.statusCode, 502);
      assert.match(logs.join('\n'), /resend_timeout/);
      for (const sensitive of [
        validBody.name,
        validBody.email,
        validBody.organization,
        validBody.message,
        process.env.RESEND_API_KEY,
        process.env.CONTACT_TO_EMAIL,
      ]) {
        assert.equal(logs.join('\n').includes(sensitive), false);
      }
    } finally {
      globalThis.fetch = previousFetch;
      console.error = previousError;
      if (previousTimeout === undefined) delete process.env.CONTACT_RESEND_TIMEOUT_MS;
      else process.env.CONTACT_RESEND_TIMEOUT_MS = previousTimeout;
    }
  });
});

test('local fallback limiter returns Retry-After', async () => {
  await withDeliveryEnv(async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, status: 200 });
    try {
      const ip = '198.51.100.77';
      for (let attempt = 1; attempt <= 6; attempt += 1) {
        const res = mockResponse();
        await handler(mockRequest({
          headers: { 'x-forwarded-for': ip, 'x-vercel-id': `iad1::limit-${attempt}` },
        }), res);
        if (attempt <= 5) assert.equal(res.statusCode, 200);
        else {
          assert.equal(res.statusCode, 429);
          assert.equal(res.headers.get('retry-after'), '600');
        }
      }
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
