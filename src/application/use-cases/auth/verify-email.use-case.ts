import { Injectable } from '@nestjs/common';
import { UserRepository } from '@domain/repositories';
import { UnauthorizedError } from '@application/errors';
import { TokenService } from '@application/ports';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly users: UserRepository,
  ) {}

  async execute(token: string): Promise<void> {
    let claims: { id: number; type?: string };
    try {
      claims = await this.tokens.verifyEmailVerificationToken(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired verification link');
    }

    if (claims.type !== 'email-verification') {
      throw new UnauthorizedError('Provided token is not an email verification token');
    }

    await this.users.markEmailVerified(claims.id);
  }
}
