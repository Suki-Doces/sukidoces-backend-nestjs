import { Module } from '@nestjs/common';
import { ChatWithAssistantUseCase } from '../../../application/use-cases/chat/chat-with-assistant.use-case';
import { ChatController } from '../controllers/chat.controller';

@Module({
  controllers: [ChatController],
  providers: [ChatWithAssistantUseCase],
})
export class ChatModule {}
