import { createHash } from 'crypto';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { RefreshTokenStore } from '../../../application/ports';
import { RefreshSession } from '../../../domain/entities';

export class TypeOrmRefreshTokenStore extends RefreshTokenStore {
  constructor(private readonly sessions: Repository<RefreshSession>) {
    super();
  }

  async register(input: { token: string; userId: number; role: string | null; expiresAt: Date }): Promise<void> {
    await this.sessions.delete({ expiresAt: LessThanOrEqual(new Date()) });
    await this.sessions.save(
      this.sessions.create({
        tokenHash: this.hash(input.token),
        userId: input.userId,
        role: input.role,
        expiresAt: input.expiresAt,
      }),
    );
  }

  async consume(token: string): Promise<boolean> {
    const result = await this.sessions.delete({ tokenHash: this.hash(token), expiresAt: MoreThan(new Date()) });
    return !!result.affected;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
