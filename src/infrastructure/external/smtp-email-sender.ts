import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppLogger, EmailSender } from '@application/ports';

/** Without SMTP credentials the e-mail is only logged, so local development works out of the box. */
@Injectable()
export class SmtpEmailSender extends EmailSender implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing): e-mails will only be logged.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT'),
      auth: { user, pass },
    });
    this.logger.log('SMTP e-mail transport configured.');
  }

  async sendVerificationEmail(to: string, verificationToken: string): Promise<void> {
    const subject = 'Confirm your e-mail - Suki Doces';
    const verifyUrl = `${this.config.get('FRONTEND_URL') || 'http://localhost:4200'}/verificar-email?token=${verificationToken}`;
    const html = `<p>Welcome to Suki Doces! Confirm your e-mail by clicking <a href="${verifyUrl}">here</a>.</p>`;

    if (!this.transporter) {
      this.logger.log(`[SIMULATED E-MAIL] To: ${to} | Subject: ${subject} | Link: ${verifyUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM') || 'no-reply@sukidoces.com',
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send verification e-mail to ${to}`, error);
    }
  }
}
