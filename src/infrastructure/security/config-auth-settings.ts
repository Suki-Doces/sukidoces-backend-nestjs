import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthSettings } from '@application/ports';

/** Reads EMAIL_VERIFICATION_REQUIRED (default: true). */
@Injectable()
export class ConfigAuthSettings extends AuthSettings {
  readonly emailVerificationRequired: boolean;

  constructor(config: ConfigService) {
    super();
    const raw = config.get<string | boolean>('EMAIL_VERIFICATION_REQUIRED');
    this.emailVerificationRequired = !(raw === false || String(raw).toLowerCase() === 'false');
  }
}
