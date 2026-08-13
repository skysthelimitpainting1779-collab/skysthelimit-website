import { NextRequest, NextResponse } from 'next/server';
import {
  createRateLimiter,
  asText,
  escapeHtml,
  buildIdempotentLeadId,
  verifyRequiredWebhookSecret,
  validate,
} from '@/lib/api/utils';
import {
  persistCanonicalLead,
  executeLeadDeliveryEffect,
  type CanonicalLead,
} from '@/lib/leads/persistence';

const leadToEmail = process.env.LEAD_TO_EMAIL || 'skysthelimitpainting1779@gmail.com';

// Simple in-memory IP rate limiter
const rateLimit = createRateLimiter(5, 60 * 1000);

function deliveryKey(payload: Record<string, unknown>, effect: string) {
  return `${asText(payload.leadId)}:${effect}`;
}

function buildLeadHtml(payload: Record<string, unknown>): string {
  const rows = Object.entries(payload)
    .filter(([key, value]) => key !== 'website' && asText(value).length > 0)
    .map(([key, value]) => '<tr><td style="padding:6px 10px;border:1px solid #ddd;font-weight:700;">' + escapeHtml(key) + '</td><td style="padding:6px 10px;border:1px solid #ddd;">' + escapeHtml(value) + '</td></tr>')
    .join('');

  return '<h1>New Sky\'s the Limit Painting ManyChat Lead</h1><table style="border-collapse:collapse;">' + rows + '</table>';
}

async function sendWithResend(payload: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.LEAD_FROM_EMAIL || 'Sky Leads <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn("WARNING: RESEND_API_KEY is not set in the environment variables. ManyChat lead emails will not be sent!");
    return { configured: false };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': deliveryKey(payload, 'owner-email'),
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [leadToEmail],
      cc: process.env.LEAD_CC_EMAIL ? [process.env.LEAD_CC_EMAIL] : undefined,
      subject: `New ManyChat Lead - ${asText(payload.name)} - ${asText(payload.leadId)}`,
      html: buildLeadHtml(payload),
      reply_to: asText(payload.email),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed: ${response.status} ${body}`);
  }

  return { configured: true };
}

async function sendLeadWebhook(payload: Record<string, unknown>) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL;

  if (!webhookUrl) {
    return { configured: false };
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': deliveryKey(payload, 'custom-webhook'),
      ...(process.env.LEAD_WEBHOOK_SECRET ? { 'X-Sky-Lead-Secret': process.env.LEAD_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({
      event: 'sky.manychat.lead.created',
      lead: payload,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zapier webhook failed: ${response.status} ${body}`);
  }

  return { configured: true };
}

async function sendToHubspot(payload: Record<string, unknown>) {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  const formId = process.env.HUBSPOT_FORM_ID;
  const portalId = '246259637';

  if (!formId) {
    if (!accessToken) {
      return { configured: false };
    }
  }

  const details = [
    `Market: ${asText(payload.market)}`,
    `Project Type: ${asText(payload.projectType)}`,
    `Property Type: ${asText(payload.propertyType)}`,
    `Timeline: ${asText(payload.timeline)}`,
    `Budget Range: ${asText(payload.budget)}`,
    `Preferred Contact: ${asText(payload.contactMethod)}`,
    payload.projectAddress ? `Project Address: ${asText(payload.projectAddress)}` : '',
    payload.notes ? `Notes:\n${asText(payload.notes)}` : '',
  ].filter(Boolean).join('\n');

  if (accessToken) {
    const email = asText(payload.email);
    let contactId = '';

    // Search for existing contact by email to prevent duplicates
    if (email) {
      try {
        const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{
                propertyName: 'email',
                operator: 'EQ',
                value: email,
              }],
            }],
          }),
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json() as any;
          if (searchData.results && searchData.results.length > 0) {
            contactId = searchData.results[0].id;
          }
        }
      } catch (err) {
        console.error('HubSpot contact search failed:', err);
      }
    }

    const nameParts = asText(payload.name).split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';

    const properties = {
      firstname,
      lastname,
      email,
      phone: asText(payload.phone),
      city: asText(payload.city),
      message: details,
    };

    let response;
    if (contactId) {
      // Update existing contact
      response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': deliveryKey(payload, 'hubspot-contact'),
        },
        body: JSON.stringify({ properties }),
      });
    } else {
      // Create new contact
      response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': deliveryKey(payload, 'hubspot-contact'),
        },
        body: JSON.stringify({ properties }),
      });
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HubSpot CRM API failed: ${response.status} ${body}`);
    }

    return { configured: true };
  } else {
    // Fallback to legacy HubSpot forms API to support formId configurations and E2E tests
    const fields = [
      { name: 'firstname', value: asText(payload.name) },
      { name: 'email', value: asText(payload.email) },
      { name: 'phone', value: asText(payload.phone) },
      { name: 'city', value: asText(payload.city) },
    ];

    fields.push({ name: 'message', value: details });

    const context = {
      pageUri: 'https://www.facebook.com/1049772024897008',
      pageName: 'ManyChat Facebook Chatbot Integration',
    };

    const response = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': deliveryKey(payload, 'hubspot-form'),
      },
      body: JSON.stringify({
        fields,
        context,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HubSpot Forms API failed: ${response.status} ${body}`);
    }

    return { configured: true };
  }
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip)) {
    console.warn(`ManyChat rate limit exceeded for IP: ${ip}`);
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const authentication = verifyRequiredWebhookSecret(
    process.env.MANYCHAT_WEBHOOK_SECRET,
    req.headers.get('x-manychat-secret') || '',
  );
  if (!authentication.ok) {
    return NextResponse.json(
      { error: authentication.error },
      { status: authentication.status },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  // Parse and extract custom fields sent by ManyChat webhook
  const customFields = body.custom_fields || {};
  
  const name = asText(body.name || `${body.first_name || ''} ${body.last_name || ''}`.trim()) || 'ManyChat Lead';
  const phone = asText(body.phone || customFields.phone || customFields.Phone || '');
  const email = asText(body.email || customFields.email || customFields.Email || '');
  const city = asText(customFields.City || customFields.city || body.city || 'Twin Cities');
  const projectAddress = asText(customFields["Project Address"] || customFields.address || customFields.Address || '');
  const projectType = asText(customFields["Project Type"] || customFields.project_type || 'Interior');
  const propertyType = asText(customFields["Property Type"] || customFields.property_type || 'Single-family home');
  const timeline = asText(customFields.Timeline || customFields.timeline || 'ASAP');
  const budget = asText(customFields.Budget || customFields.budget || 'Not sure yet');
  const contactMethod = asText(customFields["Preferred Contact"] || customFields.contact_method || 'Text');
  const notes = asText(customFields.Notes || customFields.notes || 'Submitted via ManyChat FB/IG Chatbot');

  const idempotencyKey =
    asText(req.headers.get('idempotency-key')) ||
    asText(body.subscriber_id || body.id) ||
    JSON.stringify(body);
  const lead: CanonicalLead = {
    source: 'ManyChat',
    name,
    phone,
    email,
    city,
    projectAddress,
    market: 'Residential',
    projectType,
    propertyType,
    timeline,
    budget,
    contactMethod,
    notes,
    leadId: buildIdempotentLeadId('manychat', idempotencyKey),
    submittedAt: new Date().toISOString(),
  };

  if (!lead.phone && !lead.email) {
    return NextResponse.json({ error: 'ManyChat lead must have either a phone number or email address.' }, { status: 400 });
  }

  const validationError = validate(lead);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await persistCanonicalLead(lead);
  } catch (error) {
    console.error('ManyChat lead persistence failed:', error);
    return NextResponse.json(
      { error: 'Lead persistence is temporarily unavailable.' },
      { status: 503 },
    );
  }

  try {
    const delivery = await Promise.allSettled([
      executeLeadDeliveryEffect(lead.leadId, 'email_notify', 'resend', () =>
        sendWithResend(lead),
      ),
      executeLeadDeliveryEffect(lead.leadId, 'webhook', 'custom', () =>
        sendLeadWebhook(lead),
      ),
      executeLeadDeliveryEffect(lead.leadId, 'crm', 'hubspot', () =>
        sendToHubspot(lead),
      ),
    ]);
    const anyClaimed = delivery.some(
      (result) => result.status === 'fulfilled' && result.value.claimed,
    );
    if (!anyClaimed) {
      return NextResponse.json(
        { ok: true, leadId: lead.leadId, duplicate: true, queued: false },
        { status: 200 },
      );
    }
    const configured = delivery.some((result) => result.status === 'fulfilled' && result.value.configured);
    const failed = delivery.find((result) => result.status === 'rejected');

    if (failed) {
      console.error('ManyChat lead delivery failure detail:', failed.reason);
    }

    if (!configured) {
      console.error('ManyChat lead delivery error: Lead delivery is not configured yet.');
      return NextResponse.json(
        { ok: true, leadId: lead.leadId, queued: true },
        { status: 202 },
      );
    }
    return NextResponse.json(
      { ok: true, leadId: lead.leadId, queued: Boolean(failed) },
      { status: failed ? 202 : 201 },
    );
  } catch (error) {
    console.error('ManyChat lead delivery failed with error:', error);
    return NextResponse.json({ error: 'ManyChat lead delivery failed.', fallback: 'email' }, { status: 500 });
  }
}
