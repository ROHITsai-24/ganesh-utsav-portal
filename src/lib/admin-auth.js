// Shared admin authorization for API routes, matching the existing
// `x-admin-email` header convention used across /api/admin/*.

export const ADMIN_AUTH_ERRORS = {
  adminEmailRequired: 'Admin email required',
  unauthorized: 'Unauthorized'
}

/**
 * @returns {{ adminEmail: string } | { error: string, status: number }}
 */
export const verifyAdminAuth = (request) => {
  const adminEmail = request.headers.get('x-admin-email') || ''

  if (!adminEmail) {
    return { error: ADMIN_AUTH_ERRORS.adminEmailRequired, status: 400 }
  }

  const expectedAdminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!expectedAdminEmail || adminEmail.toLowerCase() !== expectedAdminEmail.toLowerCase()) {
    return { error: ADMIN_AUTH_ERRORS.unauthorized, status: 403 }
  }

  return { adminEmail }
}
