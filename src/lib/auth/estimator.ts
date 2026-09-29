const defaultAdminEmails = ['skysthelimitpainting1779@gmail.com'];

function normalizedEmails(): string[] {
  const configured = process.env.ESTIMATOR_ADMIN_EMAILS
    ?.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configured && configured.length > 0 ? configured : defaultAdminEmails;
}

export function isEstimatorAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return normalizedEmails().includes(email.trim().toLowerCase());
}
