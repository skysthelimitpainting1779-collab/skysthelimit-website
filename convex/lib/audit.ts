import type { CompanyAccess } from './authz';

type AuditDatabase = { insert(table: 'auditFacts', value: Record<string, unknown>): Promise<string> };
export type AuditContext = { db: AuditDatabase };

export type AuditFactInput = {
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: number;
  requestId?: string;
  metadata?: unknown;
};

/** Appends an audit fact bound to the actor and company already authorized by authz. */
export async function appendAuditFact(
  ctx: AuditContext,
  access: CompanyAccess,
  fact: AuditFactInput,
): Promise<string> {
  return ctx.db.insert('auditFacts', {
    ...fact,
    companyId: access.company._id,
    actorUserId: access.user._id,
    actorClerkSubject: access.user.clerkSubject,
  });
}
