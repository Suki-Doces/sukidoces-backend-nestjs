import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatWithAssistantUseCase } from '../../../application/use-cases/chat/chat-with-assistant.use-case';
import { ChatMessageDto } from '../dto/chat.dto';
import { successResponse } from '../support/api-response';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatWithAssistant: ChatWithAssistantUseCase) {}

  @Post()
  async chat(@Body() dto: ChatMessageDto) {
    const response = await this.chatWithAssistant.execute(dto);
    return successResponse('Response generated successfully', { response });
  }
}
