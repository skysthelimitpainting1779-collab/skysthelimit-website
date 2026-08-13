import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { POST } from '../src/app/api/leads/route.ts';
import http from 'node:http';

async function withMockWebhookServer(handler) {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const url = `http://127.0.0.1:${port}/webhook`;
      
      try {
        await handler(url);
        server.close(resolve);
      } catch (err) {
        server.close(() => reject(err));
      }
    });
  });
}

describe('api/leads Route Handler', () => {
  test('fails closed before webhook delivery when canonical persistence is unavailable', async () => {
    await withMockWebhookServer(async (webhookUrl) => {
      process.env.LEAD_WEBHOOK_URL = webhookUrl;
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
      assert.equal(response.status, 503);
      
      const body = await response.json();
      assert.match(body.error, /could not safely save/i);
    });
  });

  test('returns 400 when missing required fields', async () => {
    process.env.LEAD_WEBHOOK_URL = 'http://localhost/webhook';
    process.env.RESEND_API_KEY = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
