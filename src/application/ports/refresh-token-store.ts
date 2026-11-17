export abstract class RefreshTokenStore {
  abstract register(input: {
    token: string;
    userId: number;
    role: string | null;
    expiresAt: Date;
  }): Promise<void>;
  /** Atomically removes an active refresh token, preventing replay. */
  abstract consume(token: string): Promise<boolean>;
}
