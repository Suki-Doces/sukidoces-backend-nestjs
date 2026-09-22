import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: any;
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    configService = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService, { provide: ConfigService, useValue: configService }],
    }).compile();

    service = module.get<EmailService>(EmailService);
    logSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();
  });

  it('deve cair no fallback de log quando SMTP não está configurado (não deve lançar erro)', async () => {
    service.onModuleInit();

    await expect(
      service.sendVerificationEmail('teste@email.com', 'token-fake'),
    ).resolves.toBeUndefined();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('EMAIL SIMULADO'));
  });
});
