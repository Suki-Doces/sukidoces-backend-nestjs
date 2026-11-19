import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatWithAssistantUseCase } from '@application/use-cases/chat';
import { ChatMessageDto } from '@presentation/http/dto';
import { successResponse } from '@presentation/http/support';

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
