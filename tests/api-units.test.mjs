import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, describe } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------------------
// Re-implement pure utility functions from API routes for real unit testing.
// These functions are module-private in the route files but contain critical
// logic that needs coverage: validation, sanitization, rate limiting, etc.
// ---------------------------------------------------------------------------

import {
  asText,
  isPayload,
  escapeHtml,
  getSafeValue,
  buildLeadId,
  buildManyChatLeadId,
  validate,
  buildLeadHtml,
  createRateLimiter
} from '../src/lib/api/utils.ts';
import {
  evaluateLeadSla,
  selectDeterministicAssignee,
} from '../src/workflows/lead-assignment.ts';

// ---------------------------------------------------------------------------
// asText tests
// ---------------------------------------------------------------------------
describe('api/leads - asText utility', () => {

  test('returns trimmed string for string input', () => {
    assert.equal(asText('  hello  '), 'hello');
  });

  test('returns empty string for null', () => {
    assert.equal(asText(null), '');
  });

  test('returns empty string for undefined', () => {
    assert.equal(asText(undefined), '');
  });

  test('returns empty string for number', () => {
    assert.equal(asText(42), '');
  });

  test('returns empty string for boolean', () => {
    assert.equal(asText(true), '');
  });

  test('returns empty string for object', () => {
    assert.equal(asText({}), '');
  });

  test('returns empty string for array', () => {
    assert.equal(asText([]), '');
  });

  test('preserves internal whitespace', () => {
    assert.equal(asText('hello world'), 'hello world');
  });

  test('handles empty string', () => {
    assert.equal(asText(''), '');
  });

  test('handles whitespace-only string', () => {
    assert.equal(asText('   '), '');
  });
});

// ---------------------------------------------------------------------------
// isPayload tests
// ---------------------------------------------------------------------------
describe('api/leads - isPayload guard', () => {

  test('returns true for plain object', () => {
    assert.equal(isPayload({ name: 'test' }), true);
  });

  test('returns true for empty object', () => {
    assert.equal(isPayload({}), true);
  });

  test('returns false for null', () => {
    assert.equal(isPayload(null), false);
  });

  test('returns false for undefined', () => {
    assert.equal(isPayload(undefined), false);
  });

  test('returns false for array', () => {
    assert.equal(isPayload([1, 2, 3]), false);
  });

  test('returns false for string', () => {
    assert.equal(isPayload('string'), false);
  });

  test('returns false for number', () => {
    assert.equal(isPayload(123), false);
  });

  test('returns false for boolean false', () => {
    assert.equal(isPayload(false), false);
  });

  test('returns false for empty string', () => {
    assert.equal(isPayload(''), false);
  });

  test('returns false for zero', () => {
    assert.equal(isPayload(0), false);
  });
});

// ---------------------------------------------------------------------------
// escapeHtml tests
// ---------------------------------------------------------------------------
describe('api/leads - escapeHtml sanitization', () => {

  test('escapes ampersand', () => {
    assert.equal(escapeHtml('a&b'), 'a&amp;b');
  });

  test('escapes less-than', () => {
    assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  });

  test('escapes greater-than', () => {
    assert.equal(escapeHtml('a>b'), 'a&gt;b');
  });

  test('escapes double quotes', () => {
    assert.equal(escapeHtml('a"b'), 'a&quot;b');
  });

  test('escapes single quotes', () => {
    assert.equal(escapeHtml("a'b"), 'a&#39;b');
  });

  test('escapes all special characters in combination', () => {
    assert.equal(escapeHtml('<b>"Hello" & \'world\'</b>'), '&lt;b&gt;&quot;Hello&quot; &amp; &#39;world&#39;&lt;/b&gt;');
  });

  test('passes through safe strings unchanged', () => {
    assert.equal(escapeHtml('Hello World 123'), 'Hello World 123');
  });

  test('converts non-string values to string first', () => {
    assert.equal(escapeHtml(42), '42');
    assert.equal(escapeHtml(true), 'true');
  });

  test('handles empty string', () => {
    assert.equal(escapeHtml(''), '');
  });

  test('handles null (converts to string)', () => {
    assert.equal(escapeHtml(null), 'null');
  });

  test('handles undefined (converts to string)', () => {
    assert.equal(escapeHtml(undefined), 'undefined');
  });
});

// ---------------------------------------------------------------------------
// getSafeValue tests
// ---------------------------------------------------------------------------
describe('api/leads - getSafeValue prototype pollution guard', () => {

  test('returns value for normal key', () => {
    assert.equal(getSafeValue({ name: 'Alice' }, 'name'), 'Alice');
  });

  test('returns undefined for __proto__', () => {
    assert.equal(getSafeValue({ __proto__: 'evil' }, '__proto__'), undefined);
  });

  test('returns undefined for constructor', () => {
    assert.equal(getSafeValue({ constructor: 'evil' }, 'constructor'), undefined);
  });

  test('returns undefined for prototype', () => {
    assert.equal(getSafeValue({ prototype: 'evil' }, 'prototype'), undefined);
  });

  test('returns undefined for missing key', () => {
    assert.equal(getSafeValue({}, 'missing'), undefined);
  });

  test('returns falsy values correctly', () => {
    assert.equal(getSafeValue({ count: 0 }, 'count'), 0);
    assert.equal(getSafeValue({ flag: false }, 'flag'), false);
    assert.equal(getSafeValue({ text: '' }, 'text'), '');
  });
});

// ---------------------------------------------------------------------------
// buildLeadId tests
// ---------------------------------------------------------------------------
describe('api/leads - buildLeadId generation', () => {

  test('starts with SKY- prefix', () => {
    const id = buildLeadId();
    assert.ok(id.startsWith('SKY-'), `lead ID should start with SKY-: ${id}`);
  });

  test('matches expected format SKY-TIMESTAMP-RANDOM', () => {
    const id = buildLeadId();
    assert.match(id, /^SKY-\d{14}-[A-Z0-9]+$/);
  });

  test('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => buildLeadId()));
    assert.equal(ids.size, 100, 'all generated IDs should be unique');
  });

  test('timestamp portion is 14 digits', () => {
    const id = buildLeadId();
    const stamp = id.split('-')[1];
    assert.equal(stamp.length, 14);
    assert.match(stamp, /^\d{14}$/);
  });

  test('ManyChat lead ID starts with SKY-MC-', () => {
    const id = buildManyChatLeadId();
    assert.ok(id.startsWith('SKY-MC-'), `ManyChat lead ID should start with SKY-MC-: ${id}`);
  });

  test('ManyChat lead ID matches expected format', () => {
    const id = buildManyChatLeadId();
    assert.match(id, /^SKY-MC-\d{14}-[A-Z0-9]+$/);
  });
});

// ---------------------------------------------------------------------------
// validate tests
// ---------------------------------------------------------------------------
describe('api/leads - validate lead payload', () => {

  const validPayload = {
    name: 'Jane Doe',
    phone: '651-555-1234',
    email: 'jane@example.com',
    city: 'Eagan',
    market: 'Residential',
    projectType: 'Interior',
    timeline: 'ASAP',
    contactMethod: 'Phone',
    notes: 'Kitchen repaint',
  };

  test('returns empty string for valid payload', () => {
    assert.equal(validate(validPayload), '');
  });

  test('returns error when name is missing', () => {
    const result = validate({ ...validPayload, name: '' });
    assert.match(result, /Missing required fields.*name/);
  });

  test('returns error when email is missing', () => {
    const result = validate({ ...validPayload, email: '' });
    assert.match(result, /Missing required fields.*email/);
  });

  test('returns error for invalid email format', () => {
    const result = validate({ ...validPayload, email: 'not-an-email' });
    assert.equal(result, 'Enter a valid email address.');
  });

  test('returns error for email without domain', () => {
    const result = validate({ ...validPayload, email: 'user@' });
    assert.equal(result, 'Enter a valid email address.');
  });

  test('returns error for email with spaces', () => {
    const result = validate({ ...validPayload, email: 'user @example.com' });
    assert.equal(result, 'Enter a valid email address.');
  });

  test('accepts valid email formats', () => {
    const emails = ['user@example.com', 'a.b@c.d.e', 'test+tag@domain.org'];
    for (const email of emails) {
      assert.equal(validate({ ...validPayload, email }), '', `should accept ${email}`);
    }
  });

  test('returns spam error when website honeypot is filled', () => {
    const result = validate({ ...validPayload, website: 'spam-website-honeypot' });
    assert.equal(result, 'Spam check failed.');
  });

  test('returns error for multiple missing fields', () => {
    const result = validate({ email: 'a@b.com' });
    assert.match(result, /Missing required fields/);
    assert.match(result, /name/);
    assert.match(result, /phone/);
    assert.match(result, /city/);
  });

  test('accepts payload with valid photosUrl', () => {
    const result = validate({ ...validPayload, photosUrl: 'https://photos.example.com/img.jpg' });
    assert.equal(result, '');
  });

  test('returns error for photosUrl with invalid protocol', () => {
    const result = validate({ ...validPayload, photosUrl: 'ftp://photos.example.com/img.jpg' });
    assert.equal(result, 'Enter a valid project photo link.');
  });

  test('returns error for photosUrl that is not a URL', () => {
    const result = validate({ ...validPayload, photosUrl: 'not-a-url' });
    assert.equal(result, 'Enter a valid project photo link.');
  });

  test('returns error for photosUrl without valid hostname', () => {
    const result = validate({ ...validPayload, photosUrl: 'https://localhost/img.jpg' });
    assert.equal(result, 'Enter a valid project photo link.');
  });

  test('allows payload without photosUrl', () => {
    assert.equal(validate(validPayload), '');
  });

  test('trims whitespace from field values during validation', () => {
    const result = validate({ ...validPayload, name: '  Jane  ' });
    assert.equal(result, '');
  });
});

// ---------------------------------------------------------------------------
// buildLeadHtml tests
// ---------------------------------------------------------------------------
describe('api/leads - buildLeadHtml email template', () => {

  test('generates HTML with header', () => {
    const html = buildLeadHtml({ name: 'Test' });
    assert.match(html, /New Sky's the Limit Painting lead/);
  });

  test('generates table rows for non-empty fields', () => {
    const html = buildLeadHtml({ name: 'Alice', phone: '555-1234' });
    assert.match(html, /Alice/);
    assert.match(html, /555-1234/);
    assert.match(html, /<tr>/);
    assert.match(html, /<table/);
  });

  test('excludes website honeypot field', () => {
    const html = buildLeadHtml({ name: 'Bob', website: 'spam-website-honeypot' });
    assert.ok(!html.includes('spam-website-honeypot'), 'should exclude website field');
  });

  test('excludes empty fields', () => {
    const html = buildLeadHtml({ name: 'Bob', notes: '' });
    assert.ok(!html.includes('notes'), 'should exclude empty fields');
  });

  test('escapes HTML in values to prevent XSS', () => {
    const html = buildLeadHtml({ name: '<script>alert("xss")</script>' });
    assert.ok(!html.includes('<script>'), 'should escape script tags');
    assert.match(html, /&lt;script&gt;/);
  });

  test('escapes HTML in keys', () => {
    const payload = {};
    payload['<b>key'] = 'value';
    const html = buildLeadHtml(payload);
    assert.ok(!html.includes('<b>key'), 'should escape HTML in keys');
    assert.match(html, /&lt;b&gt;key/);
  });
});

// ---------------------------------------------------------------------------
// rateLimit tests
// ---------------------------------------------------------------------------
describe('api/leads - Rate limiter', () => {

  test('allows first request from an IP', () => {
    const rl = createRateLimiter(5, 60000);
    assert.equal(rl('10.0.0.1'), true);
  });

  test('allows up to max requests', () => {
    const rl = createRateLimiter(3, 60000);
    assert.equal(rl('10.0.0.2'), true);
    assert.equal(rl('10.0.0.2'), true);
    assert.equal(rl('10.0.0.2'), true);
  });

  test('blocks requests beyond max', () => {
    const rl = createRateLimiter(2, 60000);
    rl('10.0.0.3');
    rl('10.0.0.3');
    assert.equal(rl('10.0.0.3'), false);
  });

  test('tracks IPs independently', () => {
    const rl = createRateLimiter(1, 60000);
    assert.equal(rl('10.0.0.4'), true);
    assert.equal(rl('10.0.0.5'), true);
    assert.equal(rl('10.0.0.4'), false);
    assert.equal(rl('10.0.0.5'), false);
  });

  test('resets counter after window expires', () => {
    const rl = createRateLimiter(1, 1);
    rl('10.0.0.6');
    // After 1ms the window should have expired
    const start = Date.now();
    while (Date.now() - start < 5) { /* wait 5ms */ }
    assert.equal(rl('10.0.0.6'), true);
  });
});

// ---------------------------------------------------------------------------
// Governed lead assignment and first-response SLA workflow
// ---------------------------------------------------------------------------
describe('lead assignment workflow', () => {
  const eligibleCandidates = [
    {
      userId: 'users:staff-b',
      role: 'staff',
      membershipStatus: 'active',
      userStatus: 'active',
    },
    {
      userId: 'users:admin-a',
      role: 'admin',
      membershipStatus: 'active',
      userStatus: 'active',
    },
    {
      userId: 'users:disabled',
      role: 'staff',
      membershipStatus: 'active',
      userStatus: 'disabled',
    },
    {
      userId: 'users:customer',
      role: 'customer',
      membershipStatus: 'active',
      userStatus: 'active',
    },
    {
      userId: 'users:revoked',
      role: 'staff',
      membershipStatus: 'revoked',
      userStatus: 'active',
    },
  ];

  test('routes a lead deterministically regardless of candidate order', () => {
    const first = selectDeterministicAssignee(
      'lead:stable-203',
      eligibleCandidates
    );
    const replay = selectDeterministicAssignee(
      'lead:stable-203',
      [...eligibleCandidates].reverse()
    );

    assert.deepEqual(replay, first);
    assert.match(first.assigneeUserId, /^users:(staff-b|admin-a)$/);
    assert.equal(first.algorithmVersion, 'stable-hash-v1');
    assert.match(first.reason, /deterministic/i);
  });

  test('fails closed when no active staff or admin candidate exists', () => {
    assert.throws(
      () =>
        selectDeterministicAssignee('lead:unroutable', [
          {
            userId: 'users:customer',
            role: 'customer',
            membershipStatus: 'active',
            userStatus: 'active',
          },
        ]),
      /eligible staff or admin/i
    );
  });

  test('breaches visibly at the exact deadline but never after acknowledgement', () => {
    const assignment = {
      status: 'assigned',
      firstResponseDueAt: 10_000,
      escalationStatus: 'none',
    };

    assert.deepEqual(evaluateLeadSla(assignment, 9_999), {
      status: 'pending',
      breached: false,
      shouldEscalate: false,
      operatorLabel: 'First response due soon',
    });
    assert.deepEqual(evaluateLeadSla(assignment, 10_000), {
      status: 'breached',
      breached: true,
      shouldEscalate: true,
      operatorLabel: 'SLA breached — immediate follow-up required',
    });
    assert.deepEqual(
      evaluateLeadSla(
        {
          ...assignment,
          status: 'acknowledged',
          firstResponseAt: 9_500,
        },
        12_000
      ),
      {
        status: 'met',
        breached: false,
        shouldEscalate: false,
        operatorLabel: 'First response completed within SLA',
      }
    );
    assert.deepEqual(
      evaluateLeadSla(
        {
          ...assignment,
          status: 'acknowledged',
          firstResponseAt: 10_000,
          escalationStatus: 'resolved',
        },
        12_000
      ),
      {
        status: 'breached',
        breached: true,
        shouldEscalate: false,
        operatorLabel: 'First response completed after SLA breach',
      }
    );
    assert.deepEqual(
      evaluateLeadSla(
        {
          ...assignment,
          status: 'acknowledged',
          firstResponseAt: 10_001,
          escalationStatus: 'resolved',
        },
        12_000
      ),
      {
        status: 'breached',
        breached: true,
        shouldEscalate: false,
        operatorLabel: 'First response completed after SLA breach',
      }
    );
  });

  test('staff manage route renders the authorized SLA queue and breach label', () => {
    const managePage = read('src/app/(protected)/manage/page.tsx');

    assert.match(managePage, /api\.leadAssignments\.slaQueue/);
    assert.match(managePage, /First-response SLA/);
    assert.match(managePage, /operatorLabel/);
    assert.match(managePage, /role="status"/);
    assert.match(managePage, /setSelectedCompanyId/);
    assert.match(
      managePage,
      /<CrmOperator[\s\S]*key=\{activeCompany\?\.companyId \?\? 'loading'\}[\s\S]*companies=\{activeCompany \? \[activeCompany\] : companies\}/
    );
  });
});


