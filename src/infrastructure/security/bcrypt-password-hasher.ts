import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '@application/ports';

@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  private readonly rounds: number;

  constructor(config: ConfigService) {
    super();
    this.rounds = Number(config.get('BCRYPT_SALT_ROUNDS')) || 12;
  }

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.rounds);
  }

  compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
