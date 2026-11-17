import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  welcome(): string {
    return 'Welcome to the Suki Doces API! System running 100% in the cloud.';
  }
}
