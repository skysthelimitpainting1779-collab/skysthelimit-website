import type { GenericId } from 'convex/values';
import type { MutationCtx, QueryCtx } from '../_generated/server';

export type MembershipRole = 'customer' | 'staff' | 'admin';

export type CanonicalUser = {
  _id: GenericId<'users'>;
  clerkSubject: string;
  status: 'active' | 'disabled';
};

export type Company = {
  _id: GenericId<'companies'>;
  name: string;
  status: 'active' | 'archived';
};

export type Membership = {
  _id: GenericId<'memberships'>;
  userId: GenericId<'users'>;
  companyId: GenericId<'companies'>;
  role: MembershipRole;
  status: 'active' | 'disabled' | 'revoked';
};

type Project = {
  _id: GenericId<'projects'>;
  companyId: GenericId<'companies'>;
  status: 'active' | 'complete' | 'archived';
};

type ResourceGrant = {
  _id: GenericId<'resourceGrants'>;
  userId: GenericId<'users'>;
  companyId: GenericId<'companies'>;
  resourceType: 'project' | 'property';
  resourceId: string;
  status: 'active' | 'revoked';
  permissions: string[];
};

type ClerkSessionIdentity = {
  subject?: string;
  /** Clerk's JWT fva claim: [firstFactorAgeMinutes, secondFactorAgeMinutes]. */
  fva?: readonly [number, number] | readonly number[];
};

export type AuthorizationContext = {
  auth: { getUserIdentity(): Promise<ClerkSessionIdentity | null> };
  db: QueryCtx['db'] | MutationCtx['db'];
};

export type CompanyAccess = { user: CanonicalUser; membership: Membership; company: Company };

export class AuthorizationError extends Error {
  constructor(message = 'Access denied.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

function requireSubject(identity: ClerkSessionIdentity | null): string {
  const subject = identity?.subject?.trim();
  if (!subject) throw new AuthorizationError('Authentication is required.');
  return subject;
}

function requireCurrentSessionMfa(identity: ClerkSessionIdentity | null, maxAgeMinutes = 10): void {
  const secondFactorAge = identity?.fva?.[1];
  if (typeof secondFactorAge !== 'number' || secondFactorAge < 0 || secondFactorAge > maxAgeMinutes) {
    throw new AuthorizationError('MFA is required for privileged staff access.');
  }
}

/** Maps the Clerk JWT subject to an enabled canonical user; email is never read. */
async function requireActiveUserForIdentity(
  ctx: AuthorizationContext,
  identity: ClerkSessionIdentity | null,
): Promise<CanonicalUser> {
  const subject = requireSubject(identity);
  const user = (await ctx.db
    .query('users')
    .withIndex('by_clerkSubject', (query) => query.eq('clerkSubject', subject))
    .unique()) as CanonicalUser | null;
  if (!user) throw new AuthorizationError('No canonical user is provisioned for this identity.');
  if (user.status !== 'active') throw new AuthorizationError('This user is disabled.');
  if (user.clerkSubject !== subject) throw new AuthorizationError('Canonical identity mismatch.');
  return user;
}

export async function requireActiveUser(ctx: AuthorizationContext): Promise<CanonicalUser> {
  return requireActiveUserForIdentity(ctx, await ctx.auth.getUserIdentity());
}

export async function requireCompanyMembership(
  ctx: AuthorizationContext,
  options: { companyId: GenericId<'companies'>; roles?: readonly MembershipRole[]; mfaMaxAgeMinutes?: number },
): Promise<CompanyAccess> {
  const identity = await ctx.auth.getUserIdentity();
  const user = await requireActiveUserForIdentity(ctx, identity);
  const company = (await ctx.db.get(options.companyId)) as Company | null;
  if (!company || company.status !== 'active') throw new AuthorizationError('Company access is denied.');
  const membership = (await ctx.db
    .query('memberships')
    .withIndex('by_user_company', (query) => query.eq('userId', user._id).eq('companyId', company._id))
    .unique()) as Membership | null;
  if (!membership || membership.status !== 'active') throw new AuthorizationError('No active company membership grants access.');
  if (options.roles && !options.roles.includes(membership.role)) throw new AuthorizationError('Company role does not grant access.');
  if (membership.role === 'staff' || membership.role === 'admin') {
    requireCurrentSessionMfa(identity, options.mfaMaxAgeMinutes);
  }
  return { user, membership, company };
}

/** Project access requires an active tenant, project, and project-specific grant. */
export async function requireProjectGrant(
  ctx: AuthorizationContext,
  options: { projectId: GenericId<'projects'>; permission: string },
): Promise<CompanyAccess & { project: Project; grant: ResourceGrant }> {
  const project = (await ctx.db.get(options.projectId)) as Project | null;
  if (!project || project.status !== 'active') throw new AuthorizationError('Project access is denied.');
  const access = await requireCompanyMembership(ctx, { companyId: project.companyId });
  const grant = (await ctx.db
    .query('resourceGrants')
    .withIndex('by_user_resource', (query) => query.eq('userId', access.user._id).eq('resourceType', 'project').eq('resourceId', project._id))
    .unique()) as ResourceGrant | null;
  if (!grant || grant.status !== 'active' || grant.companyId !== project.companyId || !grant.permissions.includes(options.permission)) {
    throw new AuthorizationError('No matching project grant exists.');
  }
  return { ...access, project, grant };
}
