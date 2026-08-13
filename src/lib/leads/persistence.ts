import { createClient } from '@supabase/supabase-js';
import { asText } from '@/lib/api/utils';

export interface CanonicalLead extends Record<string, unknown> {
  leadId: string;
}

function getLeadStore() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Canonical lead persistence is not configured.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toLeadRow(lead: CanonicalLead) {
  const privateFileIds = Array.isArray(lead.photoFileIds)
    ? lead.photoFileIds.filter((value): value is string => typeof value === 'string').join(',')
    : '';
  return {
    lead_id: lead.leadId,
    source: asText(lead.source) || 'website',
    name: asText(lead.name),
    phone: asText(lead.phone),
    email: asText(lead.email),
    city: asText(lead.city),
    project_address: asText(lead.projectAddress || lead.project_address),
    market: asText(lead.market),
    project_type: asText(lead.projectType || lead.project_type),
    property_type: asText(lead.propertyType || lead.property_type),
    timeline: asText(lead.timeline),
    budget: asText(lead.budget),
    contact_method: asText(lead.contactMethod || lead.contact_method),
    notes: asText(lead.notes),
    utm_source: asText(lead.utm_source || lead.utmSource),
    utm_medium: asText(lead.utm_medium || lead.utmMedium),
    utm_campaign: asText(lead.utm_campaign || lead.utmCampaign),
    page: asText(lead.page),
    status: 'new',
    photos_url: privateFileIds || asText(lead.photosUrl || lead.photos_url),
  };
}

export async function persistCanonicalLead(
  lead: CanonicalLead,
): Promise<{ duplicate: boolean }> {
  const store = getLeadStore();
  const { data, error } = await store
    .from('leads')
    .upsert(toLeadRow(lead), {
      onConflict: 'lead_id',
      ignoreDuplicates: true,
    })
    .select('lead_id');

  if (error) {
    throw new Error(`Canonical lead persistence failed: ${error.message}`);
  }

  return { duplicate: !data?.length };
}

export async function recordLeadDelivery(
  leadId: string,
  eventType: string,
  provider: string,
  status: 'pending' | 'success' | 'failed' | 'skipped',
  message?: string,
): Promise<void> {
  const store = getLeadStore();
  const { error } = await store.from('lead_events').insert({
    lead_id: leadId,
    event_type: eventType,
    provider,
    status,
    message: message || null,
  });
  if (error) {
    console.error('Lead delivery evidence could not be recorded:', error.message);
  }
}

export async function claimLeadDelivery(leadId: string, effect: string): Promise<boolean> {
  const store = getLeadStore();
  const { data, error } = await store.rpc('claim_lead_delivery', {
    p_lead_id: leadId,
    p_effect: effect,
  });
  if (error) {
    throw new Error(`Lead delivery claim failed: ${error.message}`);
  }
  return data === true;
}

export async function settleLeadDelivery(
  leadId: string,
  effect: string,
  status: 'success' | 'failed',
  message: string,
): Promise<void> {
  const store = getLeadStore();
  const { error } = await store
    .from('lead_delivery_outbox')
    .update({
      status: status === 'success' ? 'delivered' : 'failed',
      last_error: status === 'failed' ? message : null,
      updated_at: new Date().toISOString(),
    })
    .eq('lead_id', leadId)
    .eq('effect', effect)
    .eq('status', 'processing');
  if (error) {
    throw new Error(`Lead reconciliation update failed: ${error.message}`);
  }
}

export async function executeLeadDeliveryEffect(
  leadId: string,
  effect: string,
  provider: string,
  operation: () => Promise<{ configured: boolean }>,
): Promise<{ claimed: boolean; configured: boolean }> {
  const claimed = await claimLeadDelivery(leadId, effect);
  if (!claimed) return { claimed: false, configured: false };

  try {
    const result = await operation();
    const status = result.configured ? 'success' : 'failed';
    const message = result.configured
      ? 'Provider accepted delivery.'
      : 'Provider is not configured.';
    try {
      await settleLeadDelivery(leadId, effect, status, message);
    } catch (settlementError) {
      console.error(
        `Lead delivery settlement failed for ${effect}; stale claim remains recoverable:`,
        settlementError,
      );
    }
    await recordLeadDelivery(
      leadId,
      effect,
      provider,
      result.configured ? 'success' : 'skipped',
      message,
    );
    return { claimed: true, configured: result.configured };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      await settleLeadDelivery(leadId, effect, 'failed', message);
    } catch (settlementError) {
      console.error(
        `Lead delivery failure settlement failed for ${effect}; stale claim remains recoverable:`,
        settlementError,
      );
    }
    await recordLeadDelivery(leadId, effect, provider, 'failed', message);
    throw error;
  }
}

export async function listPendingLeadDeliveries(limit = 100) {
  const store = getLeadStore();
  const { data, error } = await store
    .from('lead_delivery_outbox')
    .select('lead_id,effect,status,attempts,locked_at,updated_at,last_error')
    .in('status', ['processing', 'failed'])
    .order('updated_at', { ascending: true })
    .limit(Math.min(Math.max(limit, 1), 500));
  if (error) {
    throw new Error(`Lead reconciliation query failed: ${error.message}`);
  }
  return data || [];
}
