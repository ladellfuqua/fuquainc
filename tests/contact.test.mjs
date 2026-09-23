import assert from 'node:assert/strict';
import test from 'node:test';

import handler from '../api/contact.js';

const validBody = {
  name: 'Test Person',
  email: 'test@example.com',
  organization: 'Example Co',
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

test('missing delivery settings fail without calling Resend or leaking form data', async () => {
  await withDeliveryEnv(async () => {
    const previousFetch = globalThis.fetch;
    const previousError = console.error;
    const logs = [];
    let calls = 0;
    globalThis.fetch = async () => { calls += 1; throw new Error('Must not send'); };
    console.error = (line) => logs.push(String(line));
    try {
      for (const name of ['RESEND_API_KEY', 'CONTACT_TO_EMAIL']) {
        const value = process.env[name];
        delete process.env[name];
        const res = mockResponse();
        await handler(mockRequest(), res);
        assert.equal(res.statusCode, 500);
        assert.deepEqual(res.payload, { ok: false });
        process.env[name] = value;
      }
      assert.equal(calls, 0);
      assert.equal(logs.length, 2);
      for (const line of logs) {
        assert.deepEqual(JSON.parse(line), {
          event: 'contact_api_failure',
          code: 'configuration_missing',
          requestId: 'iad1::contact-test',
        });
      }
    } finally {
      globalThis.fetch = previousFetch;
      console.error = previousError;
    }
  });
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

test('accepts the redesigned form without a reason field', async () => {
  await withDeliveryEnv(async () => {
    const previousFetch = globalThis.fetch;
    let delivery;
    globalThis.fetch = async (_url, options) => {
      delivery = JSON.parse(options.body);
      return { ok: true, status: 200 };
    };
    try {
      const res = mockResponse();
      await handler(mockRequest(), res);
      assert.equal(res.statusCode, 200);
      assert.equal(delivery.subject, 'Website contact');
      assert.equal(delivery.text.includes('Reason:'), false);
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
