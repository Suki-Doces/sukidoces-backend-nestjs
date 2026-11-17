import { Injectable } from '@nestjs/common';
import { UserRole } from '../../../domain/enums';
import { UserRegisteredEvent } from '../../../domain/events/domain-events';
import { UserRepository } from '../../../domain/repositories';
import { BadRequestError } from '../../errors/application-errors';
import { EmailSender, EventPublisher, PasswordHasher, RefreshTokenStore, TokenPair, TokenService } from '../../ports';
import { registerRefreshSession } from './register-refresh-session';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterUserResult extends TokenPair {
  user: { id: number; name: string; email: string; role: string | null; createdAt: Date; profilePhoto: string | null };
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
    private readonly events: EventPublisher,
    private readonly emailSender: EmailSender,
    private readonly refreshTokens: RefreshTokenStore,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const email = input.email.trim().toLowerCase();

    if (await this.users.findByEmail(email)) {
      throw new BadRequestError('Email already registered');
    }

    const user = await this.users.create({
      name: input.name.trim(),
      email,
      password: await this.hasher.hash(input.password),
      phone: input.phone,
      role: UserRole.CUSTOMER,
      active: true,
    });

    this.events.publish(new UserRegisteredEvent(user.name));

    const verificationToken = await this.tokens.signEmailVerificationToken(user.id);
    void this.emailSender.sendVerificationEmail(user.email, verificationToken);

    const tokens = await this.tokens.issuePair({ id: user.id, email: user.email, role: user.role });
    await registerRefreshSession(this.tokens, this.refreshTokens, tokens, { id: user.id, email: user.email, role: user.role });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        profilePhoto: user.profilePhoto,
      },
    };
  }
}
