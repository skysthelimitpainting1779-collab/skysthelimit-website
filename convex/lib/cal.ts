export const calApiVersion = '2026-05-01';
export const calWebhookPayloadVersion = '2021-10-20';
export const calWebhookContractVersion = 'skys-limit-cal-webhook-v1';
export const calReconciliationStatuses = [
  'upcoming',
  'recurring',
  'past',
  'cancelled',
  'unconfirmed',
] as const;

const calWebhookTriggers = new Set([
  'BOOKING_CREATED',
  'BOOKING_RESCHEDULED',
  'BOOKING_CANCELLED',
  'BOOKING_REQUESTED',
  'BOOKING_REJECTED',
]);
const calBookingStatuses = new Set<string>(calReconciliationStatuses);
const emailPattern = /^[^\s@]{1,254}@[^\s@]{1,254}\.[^\s@]{2,63}$/;
const rfc3339WithOffset =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

type JsonRecord = Record<string, unknown>;
type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type CalAppointmentStatus =
  | 'scheduled'
  | 'pending'
  | 'cancelled'
  | 'completed'
  | 'rescheduled';

export type CalReconciliationStatus =
  (typeof calReconciliationStatuses)[number];

export type CanonicalCalAppointment = {
  triggerEvent:
    | 'BOOKING_CREATED'
    | 'BOOKING_RESCHEDULED'
    | 'BOOKING_CANCELLED'
    | 'BOOKING_REQUESTED'
    | 'BOOKING_REJECTED'
    | 'RECONCILIATION';
  providerOccurredAt: number;
  providerOrganizationId: string;
  providerBookingUid: string;
  providerBookingId: string;
  providerEventTypeId: string;
  title: string;
  startsAt: number;
  endsAt: number;
  timeZone: string;
  status: CalAppointmentStatus;
  iCalUid?: string;
  providerSequence?: number;
  supersedesProviderBookingUid?: string;
  supersededByProviderBookingUid?: string;
  participantCount: number;
  participantTimeZones: string[];
};

export class CalContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalContractError';
  }
}

export class CalConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalConfigurationError';
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireString(
  value: unknown,
  name: string,
  maxLength = 500,
): string {
  if (typeof value !== 'string') {
    throw new CalContractError(`${name} is required.`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new CalContractError(`${name} is invalid.`);
  }
  return normalized;
}

function optionalString(
  value: unknown,
  name: string,
  maxLength = 500,
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requireString(value, name, maxLength);
}

function canonicalInteger(
  value: unknown,
  name: string,
): string {
  if (
    typeof value === 'number'
    && Number.isSafeInteger(value)
    && value > 0
  ) {
    return String(value);
  }
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value.trim())) {
    return value.trim();
  }
  throw new CalContractError(`${name} is required and must be a positive integer.`);
}

function parseTimestamp(value: unknown, name: string): number {
  const serialized = requireString(value, name, 100);
  const match = rfc3339WithOffset.exec(serialized);
  if (!match) {
    throw new CalContractError(
      `${name} must be RFC3339 with a Z or numeric UTC offset.`,
    );
  }
  const [
    year,
    month,
    day,
    hour,
    minute,
    second,
    offsetHour,
    offsetMinute,
  ] = [
    serialized.slice(0, 4),
    serialized.slice(5, 7),
    serialized.slice(8, 10),
    serialized.slice(11, 13),
    serialized.slice(14, 16),
    serialized.slice(17, 19),
    serialized.endsWith('Z') ? '0' : serialized.slice(-5, -3),
    serialized.endsWith('Z') ? '0' : serialized.slice(-2),
  ].map(Number);
  const leapYear =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];
  if (
    year < 1
    || month < 1
    || month > 12
    || day < 1
    || day > (daysInMonth ?? 0)
    || hour > 23
    || minute > 59
    || second > 59
    || offsetHour > 23
    || offsetMinute > 59
  ) {
    throw new CalContractError(`${name} is invalid.`);
  }
  const timestamp = Date.parse(serialized);
  if (!Number.isFinite(timestamp)) {
    throw new CalContractError(`${name} is invalid.`);
  }
  return timestamp;
}

function validateEmail(value: unknown): void {
  const emailAddress = requireString(value, 'Cal participant email', 254)
    .toLowerCase();
  if (!emailPattern.test(emailAddress)) {
    throw new CalContractError('Cal participant email is invalid.');
  }
}

export class CalProviderError extends CalContractError {
  readonly retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'CalProviderError';
    this.retryable = retryable;
  }
}

function normalizeTimeZone(value: unknown, name: string): string {
  const timeZone = requireString(value, name, 100);
  if (
    timeZone !== 'UTC'
    && (
      !/^[A-Za-z_]+(?:\/[A-Za-z0-9._+-]+)+$/.test(timeZone)
      || timeZone.includes('..')
    )
  ) {
    throw new CalContractError(`${name} must be a canonical IANA identifier.`);
  }
  try {
    const canonical = new Intl.DateTimeFormat(
      'en-US',
      { timeZone },
    ).resolvedOptions().timeZone;
    if (canonical !== timeZone) {
      throw new CalContractError(
        `${name} must be a canonical IANA identifier.`,
      );
    }
  } catch {
    throw new CalContractError(`${name} is invalid.`);
  }
  return timeZone;
}

function optionalSequence(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new CalContractError(
      'Cal provider sequence must be a non-negative safe integer.',
    );
  }
  return Number(value);
}

function normalizeParticipants(
  value: unknown,
): { participantCount: number; participantTimeZones: string[] } {
  if (!Array.isArray(value) || value.length > 100) {
    throw new CalContractError('Cal attendees must be a bounded array.');
  }
  const timeZones = new Set<string>();
  for (const participant of value) {
    if (!isRecord(participant)) {
      throw new CalContractError('Cal attendee is invalid.');
    }
    requireString(participant.name, 'Cal participant name', 200);
    validateEmail(participant.email ?? participant.displayEmail);
    timeZones.add(
      normalizeTimeZone(
        participant.timeZone,
        'Cal participant timezone',
      ),
    );
  }
  return {
    participantCount: value.length,
    participantTimeZones: [...timeZones].sort(),
  };
}

function webhookStatus(
  triggerEvent: string,
  providerStatus: unknown,
): CalAppointmentStatus {
  const normalizedProviderStatus =
    typeof providerStatus === 'string' ? providerStatus.trim().toUpperCase() : '';
  if (
    triggerEvent === 'BOOKING_CANCELLED'
    || triggerEvent === 'BOOKING_REJECTED'
    || normalizedProviderStatus === 'CANCELLED'
    || normalizedProviderStatus === 'REJECTED'
  ) {
    return 'cancelled';
  }
  if (
    triggerEvent === 'BOOKING_REQUESTED'
    || normalizedProviderStatus === 'PENDING'
  ) {
    return 'pending';
  }
  return 'scheduled';
}

function apiStatus(
  value: unknown,
  reconciliationStatus: CalReconciliationStatus,
): CalAppointmentStatus {
  const status = requireString(value, 'Cal booking status', 50).toLowerCase();
  if (status === 'cancelled' || status === 'rejected') return 'cancelled';
  if (status === 'pending' || status === 'unconfirmed') return 'pending';
  if (status === 'completed' || status === 'past') return 'completed';
  if (status === 'accepted' || status === 'upcoming' || status === 'recurring') {
    return reconciliationStatus === 'past' ? 'completed' : 'scheduled';
  }
  throw new CalContractError(`Unsupported Cal booking status: ${status}.`);
}

export function hasConfiguredCalWebhookSecret(
  value: string | undefined,
): value is string {
  return Boolean(
    value
    && /^[\x21-\x7E]{32,256}$/.test(value),
  );
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyCalWebhookSignature(
  secret: string | undefined,
  signature: string | null | undefined,
  rawBody: string,
): Promise<boolean> {
  if (
    !hasConfiguredCalWebhookSecret(secret)
    || typeof signature !== 'string'
    || !/^[a-fA-F0-9]{64}$/.test(signature)
  ) {
    return false;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(rawBody),
  );
  const expected = Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
  return constantTimeEqual(expected, signature.toLowerCase());
}

export function parseCalWebhookEnvelope(
  rawBody: string,
): CanonicalCalAppointment {
  let envelope: unknown;
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    throw new CalContractError('Cal webhook payload is not valid JSON.');
  }
  if (!isRecord(envelope) || !isRecord(envelope.payload)) {
    throw new CalContractError('Cal webhook envelope is invalid.');
  }
  const triggerEvent = requireString(
    envelope.triggerEvent,
    'Cal webhook trigger',
    100,
  );
  if (!calWebhookTriggers.has(triggerEvent)) {
    throw new CalContractError(`Unsupported Cal webhook trigger: ${triggerEvent}.`);
  }

  const payload = envelope.payload;
  const startsAt = parseTimestamp(payload.startTime, 'Cal appointment start');
  const endsAt = parseTimestamp(payload.endTime, 'Cal appointment end');
  if (endsAt <= startsAt) {
    throw new CalContractError('Cal appointment end must follow its start.');
  }
  if (!isRecord(payload.organizer)) {
    throw new CalContractError('Cal organizer is required.');
  }
  const participantSummary = normalizeParticipants(payload.attendees);
  const providerBookingUid = requireString(
    payload.uid,
    'Cal booking UID',
    200,
  );
  const iCalUid = optionalString(
    payload.iCalUID ?? payload.icsUid,
    'Cal iCal UID',
    500,
  );
  const supersedesProviderBookingUid = optionalString(
    payload.rescheduledFromUid ?? payload.rescheduleUid,
    'Cal superseded booking UID',
    200,
  );
  const providerSequence = optionalSequence(payload.iCalSequence);

  return {
    triggerEvent: triggerEvent as CanonicalCalAppointment['triggerEvent'],
    providerOccurredAt: parseTimestamp(
      envelope.createdAt,
      'Cal webhook createdAt',
    ),
    providerOrganizationId: canonicalInteger(
      payload.organizationId,
      'Cal organization ID',
    ),
    providerBookingUid,
    providerBookingId: canonicalInteger(
      payload.bookingId,
      'Cal booking ID',
    ),
    providerEventTypeId: canonicalInteger(
      payload.eventTypeId,
      'Cal event type ID',
    ),
    title: requireString(payload.title, 'Cal appointment title', 500),
    startsAt,
    endsAt,
    timeZone: normalizeTimeZone(
      payload.organizer.timeZone,
      'Cal organizer timezone',
    ),
    status: webhookStatus(triggerEvent, payload.status),
    ...(iCalUid ? { iCalUid } : {}),
    ...(providerSequence !== undefined
      ? { providerSequence }
      : {}),
    ...(supersedesProviderBookingUid
      ? { supersedesProviderBookingUid }
      : {}),
    ...participantSummary,
  };
}

export function buildCalWebhookEventId(
  appointment: CanonicalCalAppointment,
): string {
  const providerVersion = appointment.providerSequence ?? 'none';
  return [
    'cal',
    encodeURIComponent(appointment.providerOrganizationId),
    encodeURIComponent(appointment.providerBookingUid),
    appointment.triggerEvent,
    String(appointment.providerOccurredAt),
    String(providerVersion),
  ].join(':');
}

export function resolveCalTenantCompanyId(
  configuration: string | undefined,
  providerOrganizationId: string,
): string {
  if (!configuration) {
    throw new CalConfigurationError('Cal tenant mapping is not configured.');
  }
  let mapping: unknown;
  try {
    mapping = JSON.parse(configuration);
  } catch {
    throw new CalConfigurationError('Cal tenant mapping configuration is invalid.');
  }
  if (!isRecord(mapping) || Object.getPrototypeOf(mapping) !== Object.prototype) {
    throw new CalConfigurationError('Cal tenant mapping configuration must be an object.');
  }
  for (const [organizationId, companyId] of Object.entries(mapping)) {
    if (!/^[1-9]\d*$/.test(organizationId)) {
      throw new CalConfigurationError('Cal tenant mapping contains an invalid organization ID.');
    }
    if (
      typeof companyId !== 'string'
      || !companyId.trim()
      || companyId.length > 200
    ) {
      throw new CalConfigurationError('Cal tenant mapping contains an invalid company ID.');
    }
  }
  const companyId = mapping[providerOrganizationId];
  if (typeof companyId !== 'string' || !companyId.trim()) {
    throw new CalConfigurationError(
      `Cal organization ${providerOrganizationId} is not mapped to a company.`,
    );
  }
  return companyId.trim();
}

export function listCalTenantMappings(
  configuration: string | undefined,
): Array<{ providerOrganizationId: string; companyId: string }> {
  if (!configuration) {
    throw new CalConfigurationError('Cal tenant mapping is not configured.');
  }
  let mapping: unknown;
  try {
    mapping = JSON.parse(configuration);
  } catch {
    throw new CalConfigurationError('Cal tenant mapping configuration is invalid.');
  }
  if (!isRecord(mapping) || Object.getPrototypeOf(mapping) !== Object.prototype) {
    throw new CalConfigurationError('Cal tenant mapping configuration must be an object.');
  }
  const providerOrganizationIds = Object.keys(mapping);
  if (providerOrganizationIds.length === 0 || providerOrganizationIds.length > 100) {
    throw new CalConfigurationError(
      'Cal tenant mapping must contain between 1 and 100 organizations.',
    );
  }
  return providerOrganizationIds.sort().map((providerOrganizationId) => ({
    providerOrganizationId: canonicalInteger(
      providerOrganizationId,
      'Cal organization ID',
    ),
    companyId: resolveCalTenantCompanyId(
      configuration,
      providerOrganizationId,
    ),
  }));
}

function normalizeCalApiBooking(
  value: unknown,
  providerOrganizationId: string,
  reconciliationStatus: CalReconciliationStatus,
): CanonicalCalAppointment {
  if (!isRecord(value)) {
    throw new CalContractError('Cal booking response item is invalid.');
  }
  const hosts = Array.isArray(value.hosts) ? value.hosts : [];
  const host = hosts[0];
  if (!isRecord(host)) {
    throw new CalContractError('Cal booking host is required.');
  }
  const startsAt = parseTimestamp(value.start, 'Cal booking start');
  const endsAt = parseTimestamp(value.end, 'Cal booking end');
  if (endsAt <= startsAt) {
    throw new CalContractError('Cal booking end must follow its start.');
  }
  const iCalUid = optionalString(
    value.icsUid ?? value.iCalUID,
    'Cal iCal UID',
    500,
  );
  const supersedesProviderBookingUid = optionalString(
    value.rescheduledFromUid,
    'Cal rescheduled-from UID',
    200,
  );
  const supersededByProviderBookingUid = optionalString(
    value.rescheduledToUid,
    'Cal rescheduled-to UID',
    200,
  );

  const participantSummary = normalizeParticipants(value.attendees ?? []);
  return {
    triggerEvent: 'RECONCILIATION',
    providerOccurredAt: parseTimestamp(
      value.updatedAt ?? value.createdAt,
      'Cal booking updatedAt',
    ),
    providerOrganizationId,
    providerBookingUid: requireString(value.uid, 'Cal booking UID', 200),
    providerBookingId: canonicalInteger(value.id, 'Cal booking ID'),
    providerEventTypeId: canonicalInteger(
      value.eventTypeId,
      'Cal event type ID',
    ),
    title: requireString(value.title, 'Cal appointment title', 500),
    startsAt,
    endsAt,
    timeZone: normalizeTimeZone(host.timeZone, 'Cal host timezone'),
    status: supersededByProviderBookingUid
      ? 'rescheduled'
      : apiStatus(value.status, reconciliationStatus),
    ...(iCalUid ? { iCalUid } : {}),
    ...(supersedesProviderBookingUid
      ? { supersedesProviderBookingUid }
      : {}),
    ...(supersededByProviderBookingUid
      ? { supersededByProviderBookingUid }
      : {}),
    ...participantSummary,
  };
}

export async function fetchCalOrganizationBookings(options: {
  apiKey: string | undefined;
  organizationId: string;
  status: CalReconciliationStatus;
  cursor?: string;
  fetchImpl?: FetchLike;
}): Promise<{
  appointments: CanonicalCalAppointment[];
  hasMore: boolean;
  nextCursor?: string;
}> {
  if (
    typeof options.apiKey !== 'string'
    || !/^cal_[A-Za-z0-9_-]{8,}$/.test(options.apiKey)
  ) {
    throw new CalConfigurationError('Cal API authentication is not configured.');
  }
  const providerOrganizationId = canonicalInteger(
    options.organizationId,
    'Cal organization ID',
  );
  if (!calBookingStatuses.has(options.status)) {
    throw new CalContractError(`Unsupported Cal booking filter: ${options.status}.`);
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = new URL(
    `https://api.cal.com/v2/organizations/${encodeURIComponent(providerOrganizationId)}/bookings`,
  );
  url.searchParams.set('status', options.status);
  url.searchParams.set('limit', '100');
  if (options.cursor) {
    url.searchParams.set(
      'cursor',
      requireString(options.cursor, 'Cal pagination cursor', 2_000),
    );
  }

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'cal-api-version': calApiVersion,
        Accept: 'application/json',
      },
    });
  } catch {
    throw new CalProviderError(
      'Cal booking reconciliation request failed.',
      true,
    );
  }
  if (!response.ok) {
    throw new CalProviderError(
      `Cal booking reconciliation failed with HTTP ${response.status}.`,
      response.status === 429 || response.status >= 500,
    );
  }

  const body: unknown = await response.json();
  if (
    !isRecord(body)
    || body.status !== 'success'
    || !Array.isArray(body.data)
    || body.data.length > 100
    || !isRecord(body.pagination)
    || typeof body.pagination.hasMore !== 'boolean'
  ) {
    throw new CalContractError('Cal booking reconciliation response is invalid.');
  }
  const appointments = body.data.map((booking) =>
    normalizeCalApiBooking(
      booking,
      providerOrganizationId,
      options.status,
    ));
  if (!body.pagination.hasMore) {
    if (
      body.pagination.nextCursor !== null
      && body.pagination.nextCursor !== undefined
    ) {
      throw new CalContractError('Cal pagination ended with a stray cursor.');
    }
    return { appointments, hasMore: false };
  }
  const nextCursor = requireString(
    body.pagination.nextCursor,
    'Cal pagination cursor',
    2_000,
  );
  if (nextCursor === options.cursor) {
    throw new CalContractError('Cal pagination cursor repeated.');
  }
  return { appointments, hasMore: true, nextCursor };
}
