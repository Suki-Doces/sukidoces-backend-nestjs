import { Injectable } from '@nestjs/common';
import { UserRole } from '@domain/enums';
import { AdminRepository, UserRepository } from '@domain/repositories';
import { UnauthorizedError } from '@application/errors';
import {
  AuthSettings,
  PasswordHasher,
  RefreshTokenStore,
  TokenPair,
  TokenService,
} from '@application/ports';
import { registerRefreshSession } from './register-refresh-session';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult extends TokenPair {
  user: {
    id: number;
    name: string;
    email: string;
    role: string | null;
    profilePhoto?: string | null;
  };
}

/**
 * Unified login: customers are looked up first, then administrators.
 * Used by both POST /user/login and POST /admin/login.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly admins: AdminRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenStore,
    private readonly authSettings: AuthSettings,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();

    const user = await this.users.findByEmail(email);
    if (user) {
      await this.assertPassword(input.password, user.password, (hash) =>
        this.users.updatePassword(user.id, hash),
      );
      if (this.authSettings.emailVerificationRequired && !user.emailVerified) {
        throw new UnauthorizedError('Email address is not verified');
      }
      const tokens = await this.tokens.issuePair({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      await registerRefreshSession(this.tokens, this.refreshTokens, tokens, {
        id: user.id,
        email: user.email,
        role: user.role,
      });
      return {
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto,
        },
      };
    }

    const admin = await this.admins.findByEmail(email);
    if (admin) {
      await this.assertPassword(input.password, admin.password, (hash) =>
        this.admins.updatePassword(admin.id, hash),
      );
      const tokens = await this.tokens.issuePair({
        id: admin.id,
        email: admin.email,
        role: UserRole.ADMIN,
      });
      await registerRefreshSession(this.tokens, this.refreshTokens, tokens, {
        id: admin.id,
        email: admin.email,
        role: UserRole.ADMIN,
      });
      return {
        ...tokens,
        user: { id: admin.id, name: admin.name, email: admin.email, role: UserRole.ADMIN },
      };
    }

    throw new UnauthorizedError('Invalid credentials');
  }

  private async assertPassword(
    plain: string,
    stored: string,
    rehash: (hash: string) => Promise<void>,
  ): Promise<void> {
    let matches = false;
    try {
      matches = await this.hasher.compare(plain, stored);
    } catch {
      // An unreadable hash remains a non-match and may be a legacy plain-text password.
    }

    // Legacy accounts stored plain-text passwords: accept once and upgrade to a hash.
    if (!matches && stored === plain) {
      await rehash(await this.hasher.hash(plain));
      return;
    }

    if (!matches) {
      throw new UnauthorizedError('Invalid credentials');
    }
  }
}
