type CronEnvironment = {
  CRON_SECRET?: string;
  CONVEX_SITE_URL?: string;
  CAL_RECONCILIATION_SECRET?: string;
};

type CronOptions = {
  env?: CronEnvironment;
  fetchImpl?: typeof fetch;
  now?: () => number;
  delay?: (milliseconds: number) => Promise<void>;
  requestTimeoutMs?: number;
};

function configuredSecret(value: string | undefined): value is string {
  return Boolean(value && /^[\x21-\x7E]{32,256}$/.test(value));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function reconciliationUrl(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const baseUrl = new URL(value);
    if (baseUrl.protocol !== 'https:') return null;
    return new URL('/cal/reconciliation', baseUrl);
  } catch {
    return null;
  }
}

function cronRunId(now: number): string {
  return `cal-cron:${new Date(now).toISOString().slice(0, 16)}Z`;
}

const defaultDelay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function boundedRequestTimeout(value: number | undefined): number {
  if (
    value === undefined
    || !Number.isInteger(value)
    || value < 1
    || value > 30_000
  ) {
    return 8_000;
  }
  return value;
}

export async function handleCalReconciliationCron(
  request: Request,
  options: CronOptions = {},
): Promise<Response> {
  const environment = options.env ?? process.env;
  const cronSecret = environment.CRON_SECRET;
  const reconciliationSecret = environment.CAL_RECONCILIATION_SECRET;
  const endpoint = reconciliationUrl(environment.CONVEX_SITE_URL);
  if (
    !configuredSecret(cronSecret)
    || !configuredSecret(reconciliationSecret)
    || !endpoint
  ) {
    return new Response('Cron reconciliation is not configured', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const authorization = request.headers.get('authorization') ?? '';
  if (!constantTimeEqual(authorization, `Bearer ${cronSecret}`)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const delay = options.delay ?? defaultDelay;
  const runId = cronRunId((options.now ?? Date.now)());
  const requestTimeoutMs = boundedRequestTimeout(options.requestTimeoutMs);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ops-secret': reconciliationSecret,
        },
        body: JSON.stringify({ runId }),
        cache: 'no-store',
        signal: controller.signal,
      });
      if (response.status === 202) {
        return Response.json(
          { accepted: true, runId },
          {
            status: 202,
            headers: { 'Cache-Control': 'no-store' },
          },
        );
      }
      const retryable =
        response.status === 408
        || response.status === 429
        || response.status >= 500;
      if (!retryable || attempt === 3) break;
    } catch {
      if (attempt === 3) break;
    } finally {
      clearTimeout(timeout);
    }
    await delay(250 * (2 ** (attempt - 1)));
  }

  return new Response('Unable to enqueue reconciliation', {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
