# External Access and Approval Gates

Codex should complete all local, fixture, test-mode, migration-dry-run, and preview-safe work first.

## Access likely required later

- Convex development and production deployments
- Clerk development/production applications and webhook secrets
- Supabase export, storage, auth, and rollback access
- Payload database and S3 export access
- Directus URL/token if live data exists
- Stripe test and production credentials
- Resend configuration
- Cal.com API/webhooks
- Selected SMS provider
- Vercel environments and deployments
- Google Business Profile owner/manager access

## Separate approval is required for

- Production schema or data mutation
- Enabling production dual-write
- Switching the source of truth
- Sending real email or SMS sequences
- Creating live Stripe sessions, charges, refunds, or payouts
- Editing Google Business Profile
- Promoting a deployment to production
- DNS/domain changes
- Disabling or deleting Supabase, Payload, Directus, storage, or provider accounts
- Removing rollback exports or shortening retention

At each gate, present the exact target, action, expected effect, evidence, rollback command, and expected downtime. A broad instruction to “finish everything” does not authorize these actions.
