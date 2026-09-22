import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { POST } from '../src/app/api/leads/route.ts';
import http from 'node:http';

async function withMockWebhookServer(handler) {
  let resolveRequest;
  let rejectRequest;
  const request = new Promise((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });
  const requestTimeout = setTimeout(() => {
    rejectRequest(new Error('Mock webhook server timed out waiting for a request'));
  }, 5_000);

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolveRequest({
          method: req.method,
          headers: req.headers,
          body: JSON.parse(body),
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        rejectRequest(error);
        res.writeHead(400);
        res.end();
      }
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();

  try {
    await handler(`http://127.0.0.1:${port}/webhook`, request);
    await request;
  } finally {
    clearTimeout(requestTimeout);
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
}

const changedEnvironmentVariables = [
  'LEAD_WEBHOOK_URL',
  'LEAD_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'HUBSPOT_ACCESS_TOKEN',
  'HUBSPOT_FORM_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

let originalEnvironment;

beforeEach(() => {
  originalEnvironment = Object.fromEntries(
    changedEnvironmentVariables.map(name => [name, process.env[name]]),
  );
});

afterEach(() => {
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

describe('api/leads Route Handler', () => {
  test('successfully processes valid lead payload with mocked webhook', async () => {
    await withMockWebhookServer(async (webhookUrl, webhookRequest) => {
      process.env.LEAD_WEBHOOK_URL = webhookUrl;
      process.env.LEAD_WEBHOOK_SECRET = 'test-webhook-secret';
      process.env.RESEND_API_KEY = '';
      process.env.HUBSPOT_ACCESS_TOKEN = '';
      process.env.HUBSPOT_FORM_ID = '';
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      const req = new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Challenger-Agent',
          'X-Forwarded-For': '127.0.0.1',
        },
        body: JSON.stringify({
          name: 'Empirical Challenger',
          phone: '651-555-9999',
          email: 'challenger@example.com',
          city: 'Woodbury',
          market: 'Residential',
          projectType: 'Interior',
          timeline: 'ASAP',
          contactMethod: 'Phone',
          notes: 'This is a verification test',
        }),
      });

      const response = await POST(req);
      assert.equal(response.status, 201);
      
      const body = await response.json();
      assert.equal(body.ok, true);
      assert.ok(body.leadId.startsWith('SKY-'));

      const webhook = await webhookRequest;
      assert.equal(webhook.method, 'POST');
      assert.match(webhook.headers['content-type'], /^application\/json(?:;|$)/);
      assert.equal(webhook.body.event, 'sky.lead.created');
      assert.equal(webhook.body.lead.name, 'Empirical Challenger');
      assert.equal(webhook.body.lead.email, 'challenger@example.com');
      assert.equal(webhook.body.lead.market, 'Residential');
      assert.equal(webhook.body.lead.leadId, body.leadId);
      assert.equal(webhook.headers['x-sky-lead-secret'], process.env.LEAD_WEBHOOK_SECRET);
    });
  });

  test('returns 400 when missing required fields', async () => {
    process.env.LEAD_WEBHOOK_URL = 'http://localhost/webhook';
    process.env.RESEND_API_KEY = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '127.0.0.2',
      },
      body: JSON.stringify({
        name: 'Missing fields lead',
        email: 'missing@example.com',
      }),
    });

    const response = await POST(req);
    assert.equal(response.status, 400);
    
    const body = await response.json();
    assert.match(body.error, /Missing required fields/);
  });

  test('returns 400 for invalid email', async () => {
    process.env.LEAD_WEBHOOK_URL = 'http://localhost/webhook';
    process.env.RESEND_API_KEY = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '127.0.0.3',
      },
      body: JSON.stringify({
        name: 'Invalid Email Lead',
        phone: '651-555-1234',
        email: 'not-an-email',
        city: 'Woodbury',
        market: 'Residential',
        projectType: 'Interior',
        timeline: 'ASAP',
        contactMethod: 'Phone',
        notes: 'Testing email validation',
      }),
    });

    const response = await POST(req);
    assert.equal(response.status, 400);
    
    const body = await response.json();
    assert.equal(body.error, 'Enter a valid email address.');
  });
});
