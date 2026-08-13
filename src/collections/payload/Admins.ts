import type { CollectionConfig } from 'payload';

function isSuperAdmin(user: unknown): boolean {
  return Boolean(
    user &&
      typeof user === 'object' &&
      'role' in user &&
      (user as { role?: unknown }).role === 'super_admin',
  );
}

export const Admins: CollectionConfig = {
  slug: 'admins',
  auth: {
    tokenExpiration: 7200, // 2 hours
    cookies: {
      sameSite: 'Strict',
      secure: true,
    },
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  access: {
    // Public first-user creation is intentionally disabled; only an existing
    // super admin may administer staff identities.
    read: ({ req }) => req.user != null,
    create: ({ req }) => isSuperAdmin(req.user),
    update: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'admin',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Super Admin', value: 'super_admin' },
      ],
    },
  ],
};
