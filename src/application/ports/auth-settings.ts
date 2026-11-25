/**
 * Authentication policy that varies per environment.
 * `emailVerificationRequired = false` lets new customer accounts sign in right away
 * (useful when no SMTP server is configured, e.g. local development of the web and mobile apps).
 */
export abstract class AuthSettings {
  abstract readonly emailVerificationRequired: boolean;
}
