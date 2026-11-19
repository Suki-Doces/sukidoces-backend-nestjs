import { Module } from '@nestjs/common';
import { ChatWithAssistantUseCase } from '@application/use-cases/chat';
import { ChatController } from '@presentation/http/controllers';

@Module({
  controllers: [ChatController],
  providers: [ChatWithAssistantUseCase],
})
export class ChatModule {}
