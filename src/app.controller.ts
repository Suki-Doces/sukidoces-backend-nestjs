import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  welcome(): string {
    return 'Bem-vindo à API da Suki Doces! Sistema operando 100% na nuvem.';
  }
}
