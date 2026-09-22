import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP não configurado (SMTP_HOST/SMTP_USER/SMTP_PASS ausentes) — e-mails serão apenas logados no console.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
    this.configured = true;
    this.logger.log('Transporte de e-mail (SMTP) configurado.');
  }

  async sendVerificationEmail(to: string, verificationToken: string) {
    const subject = 'Confirme seu e-mail — Suki Doces';
    const verifyUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:4200'}/verificar-email?token=${verificationToken}`;
    const html = `<p>Bem-vindo(a) à Suki Doces! Confirme seu e-mail clicando <a href="${verifyUrl}">aqui</a>.</p>`;

    if (!this.configured || !this.transporter) {
      this.logger.log(`[EMAIL SIMULADO] Para: ${to} | Assunto: ${subject} | Link: ${verifyUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || 'no-reply@sukidoces.com',
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Erro ao enviar e-mail de verificação para ${to}: ${error.message}`);
    }
  }
}
