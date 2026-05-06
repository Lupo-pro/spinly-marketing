const ADMIN_EMAIL = 'corporate.lupo@gmail.com'

export function isAdminEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}
