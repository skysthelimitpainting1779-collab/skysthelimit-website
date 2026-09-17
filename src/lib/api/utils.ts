// Shared API response shape: success is always { ok: true, ...data },
// errors are always { error: message, ...extra }.
import { NextResponse } from 'next/server';

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function jsonError(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getSafeValue(obj: Record<string, unknown>, key: string): unknown {
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return undefined;
  }
  const descriptor = Object.getOwnPropertyDescriptor(obj, key);
  return descriptor ? descriptor.value : undefined;
}

export function buildLeadId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SKY-${stamp}-${random}`;
}

export function buildManyChatLeadId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SKY-MC-${stamp}-${random}`;
}

import { z } from 'zod';

const requiredFields = ['name', 'phone', 'email', 'city', 'market', 'timeline', 'contactMethod'];

export const leadSchema = z.object({
  name: z.string().min(1, "Missing required fields: name"),
  phone: z.string().min(1, "Missing required fields: phone"),
  email: z.string().regex(/^[^\s@]{1,254}@[^\s@]{1,254}\.[^\s@]{2,63}$/, "Enter a valid email address."),
  city: z.string().min(1, "Missing required fields: city"),
  market: z.string().min(1, "Missing required fields: market"),
  projectType: z.string().optional(),
  propertyType: z.string().optional(),
  timeline: z.string().min(1, "Missing required fields: timeline"),
  budget: z.string().optional(),
  contactMethod: z.string().min(1, "Missing required fields: contactMethod"),
  notes: z.string().optional(),
  website: z.string().max(0, "Spam check failed.").optional(),
  photosUrl: z.union([
    z.literal(''),
    z.string().refine(
      (photosUrl) => {
        if (photosUrl === '') return true;
        try {
          const url = new URL(photosUrl);
          return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
        } catch {
          return false;
        }
      },
      { message: "Enter a valid project photo link." }
    )
  ]).optional()
});

export function validate(payload: Record<string, unknown>): string {
  // Check honeypot directly first to match exact test behavior
  if (asText(payload.website)) {
    return 'Spam check failed.';
  }

  // Pre-process for validation (trim whitespace)
  const trimmed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    trimmed[key] = asText(getSafeValue(payload, key));
  }

  // Find missing required fields
  const missing = requiredFields.filter((field) => !trimmed[field]);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }

  // Run Zod validation for formats
  const result = leadSchema.safeParse(trimmed);
  if (!result.success) {
    return result.error.issues[0].message;
  }

  return '';
}

export function buildLeadHtml(payload: Record<string, unknown>, title = "New Sky's the Limit Painting lead"): string {
  const rows = Object.entries(payload)
    .filter(([key, value]) => key !== 'website' && asText(value).length > 0)
    .map(([key, value]) => '<tr><td style="padding:6px 10px;border:1px solid #ddd;font-weight:700;">' + escapeHtml(key) + '</td><td style="padding:6px 10px;border:1px solid #ddd;">' + escapeHtml(value) + '</td></tr>')
    .join('');

  return '<h1>' + title + '</h1><table style="border-collapse:collapse;">' + rows + '</table>';
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const cache = new Map<string, { count: number; lastReset: number }>();
  return function rateLimit(ip: string): boolean {
    const now = Date.now();
    const state = cache.get(ip);
    if (!state) {
      cache.set(ip, { count: 1, lastReset: now });
      return true;
    }
    if (now - state.lastReset > windowMs) {
      cache.set(ip, { count: 1, lastReset: now });
      return true;
    }
    if (state.count >= maxRequests) {
      return false;
    }
    state.count += 1;
    return true;
  };
}
