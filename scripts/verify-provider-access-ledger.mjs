#!/usr/bin/env node
import Ajv2020 from 'ajv/dist/2020.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const expectedProviderIds = [
  'calcom',
  'clerk',
  'convex',
  'directus',
  'github',
  'google-business-profile',
  'payload',
  'resend',
  'sms',
  'stripe',
  'supabase',
  'turso',
  'vercel',
];
const expectedProgramId = 'stl-post-g20-sequential-tdd-v1';

const secretValuePatterns = [
  /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+/,
  /whsec_[A-Za-z0-9]+/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bglpat-[A-Za-z0-9_-]{20,}\b/,
  /\bnpm_[A-Za-z0-9]{20,}\b/,
  /\bbearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i,
  /(?:postgres(?:ql)?|libsql):\/\/[^/\s:@]+:[^@\s]+@/i,
  /[A-Za-z]:[\\/]Users[\\/]/,
];
const readOnlyPermissionTokens = new Set([
  'data',
  'inspect',
  'list',
  'metadata',
  'partial',
  'present',
  'read',
  'status',
  'unverified',
  'verified',
  'verify',
  'view',
]);

function normalizedKey(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();
}

function hasSensitiveKey(value) {
  const normalized = normalizedKey(value);
  return (
    normalized !== 'secret_material_stored' &&
    /(^|_)(?:token|password|passphrase|credential|secret|private_key|api_key|signing_secret|client_secret|authorization)(_|$)/.test(
      normalized,
    )
  );
}

function containsBasicAuthCredential(value) {
  const matches = value.matchAll(
    /\bbasic\s+([A-Za-z0-9+/]+={0,2})(?=$|[\s.,;])/gi,
  );
  for (const [, encoded] of matches) {
    if (encoded.length % 4 !== 0) continue;
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const roundTrip = Buffer.from(decoded, 'utf8')
      .toString('base64')
      .replace(/=+$/, '');
    if (
      roundTrip === encoded.replace(/=+$/, '') &&
      /^[\x20-\x7e]+:[\x20-\x7e]*$/.test(decoded)
    ) {
      return true;
    }
  }
  return false;
}

function inspectSecretMaterial(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectSecretMaterial(item, `${path}[${index}]`, errors),
    );
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      const nestedPath = path ? `${path}.${key}` : key;
      if (hasSensitiveKey(key)) {
        errors.push(`${nestedPath} is a forbidden credential field`);
      }
      inspectSecretMaterial(nested, nestedPath, errors);
    }
    return;
  }
  if (typeof value !== 'string') return;
  if (
    secretValuePatterns.some((pattern) => pattern.test(value)) ||
    containsBasicAuthCredential(value)
  ) {
    errors.push(`${path} contains credential-shaped or machine-specific data`);
  }
}

const schema = JSON.parse(
  readFileSync(
    new URL(
      '../.agents/governance/provider-access-ledger.schema.json',
      import.meta.url,
    ),
    'utf8',
  ),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat('date-time', {
  type: 'string',
  validate(value) {
    return (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
      !Number.isNaN(Date.parse(value))
    );
  },
});
const validateSchema = ajv.compile(schema);

function schemaErrors(ledger) {
  if (validateSchema(ledger)) return [];
  return validateSchema.errors.map(({ instancePath, message }) => {
    const path = instancePath || '$';
    return `${path} ${message}`;
  });
}

function inspectProductionAuthorization(provider, path, errors) {
  if (Array.isArray(provider.environments)) {
    provider.environments.forEach((environment, index) => {
      const rawName = String(environment?.name || '');
      const normalizedName = rawName.trim().toLowerCase();
      if (rawName !== normalizedName || !/^[a-z][a-z0-9-]*$/.test(rawName)) {
        errors.push(
          `${path}.environments[${index}] environment name must be canonical`,
        );
      }
      if (
        /^(?:prod|production|live)$/i.test(normalizedName) &&
        environment?.verificationStatus !== 'blocked'
      ) {
        errors.push(
          `${path}.environments[${index}] production access must be blocked`,
        );
      }
    });
  }

  if (Array.isArray(provider.permissions)) {
    provider.permissions.forEach((permission, index) => {
      const normalized = String(permission).toLowerCase();
      const tokens = normalized.split(/[:_-]+/).filter(Boolean);
      const isProductionScoped = tokens.some(
        (token) => token === 'production' || token === 'live',
      );
      const capabilityTokens = tokens.filter(
        (token) => token !== 'production' && token !== 'live',
      );
      const isReadOnly =
        capabilityTokens.length > 0 &&
        capabilityTokens.every((token) => readOnlyPermissionTokens.has(token));
      const isExplicitlyBlocked =
        tokens.at(-1) === 'blocked' &&
        !tokens.slice(0, -1).some((token) => token === 'not');
      if (isProductionScoped && !isReadOnly && !isExplicitlyBlocked) {
        errors.push(
          `${path}.permissions[${index}] production mutation must be blocked`,
        );
      }
    });
  }
}

export function validateProviderAccessLedger(ledger) {
  const errors = schemaErrors(ledger);
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) {
    inspectSecretMaterial(ledger, '', errors);
    return errors;
  }
  if (!Array.isArray(ledger.providers)) {
    inspectSecretMaterial(ledger, '', errors);
    return errors;
  }
  if (ledger.programId !== expectedProgramId) {
    errors.push(`programId must be ${expectedProgramId}`);
  }

  const providerIds = ledger.providers.map((provider) => provider?.providerId);
  if (JSON.stringify(providerIds) !== JSON.stringify(expectedProviderIds)) {
    errors.push('providers must contain the canonical sorted provider set');
  }
  if (new Set(providerIds).size !== providerIds.length) {
    errors.push('providerId values must be unique');
  }

  ledger.providers.forEach((provider, index) => {
    const path = `providers[${index}]`;
    if (!provider || typeof provider !== 'object' || Array.isArray(provider)) {
      return;
    }
    inspectProductionAuthorization(provider, path, errors);
  });

  inspectSecretMaterial(ledger, '', errors);
  return errors;
}

function main() {
  const path = resolve(
    process.argv[2] || '.agents/governance/provider-access-ledger.json',
  );
  let ledger;
  try {
    ledger = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.error('[Provider Access Ledger] unable to read or parse ledger');
    process.exitCode = 1;
    return;
  }
  const errors = validateProviderAccessLedger(ledger);
  if (errors.length) {
    console.error(
      JSON.stringify({ ok: false, path, errors }, null, 2),
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `[Provider Access Ledger] OK: ${ledger.providers.length} providers; Production mutation blocked`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main();
}
