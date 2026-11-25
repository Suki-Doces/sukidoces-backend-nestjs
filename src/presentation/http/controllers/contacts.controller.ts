import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TokenClaims } from '@application/ports';
import {
  AnswerContactMessageUseCase,
  CreateContactMessageUseCase,
  DeleteContactMessageUseCase,
  ListContactMessagesUseCase,
  ListMyContactMessagesUseCase,
  MarkContactMessageHandledUseCase,
} from '@application/use-cases/contacts';

import { CurrentUser } from '@presentation/http/decorators';
import { AnswerContactMessageDto, CreateContactMessageDto } from '@presentation/http/dto';
import { AdminGuard, JwtAuthGuard, OptionalAuthGuard } from '@presentation/http/guards';

import { successResponse, presentContactMessage } from '@presentation/http/support';

@ApiTags('contacts')
@Controller('contatos')
export class ContactsController {
  constructor(
    private readonly createMessage: CreateContactMessageUseCase,
    private readonly listMyMessages: ListMyContactMessagesUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(OptionalAuthGuard)
  async create(@Body() dto: CreateContactMessageDto, @CurrentUser() user?: TokenClaims) {
    const created = await this.createMessage.execute({
      ...dto,
      requester: user && { id: user.id, role: user.role },
    });
    return successResponse('Message received successfully. We will contact you soon.', created);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async mine(@CurrentUser() user: TokenClaims) {
    const messages = await this.listMyMessages.execute({ id: user.id, role: user.role });
    return successResponse('History loaded successfully', {
      messages: messages.map(presentContactMessage),
    });
  }
}

@ApiTags('contacts')
@Controller('admin/contatos')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminContactsController {
  constructor(
    private readonly listMessages: ListContactMessagesUseCase,
    private readonly answerMessage: AnswerContactMessageUseCase,
    private readonly markHandled: MarkContactMessageHandledUseCase,
    private readonly deleteMessage: DeleteContactMessageUseCase,
  ) {}

  @Get()
  async list() {
    const messages = await this.listMessages.execute();
    return successResponse('Messages loaded successfully', {
      messages: messages.map(presentContactMessage),
    });
  }

  @Put(':id/respond')
  async respond(@Param('id', ParseIntPipe) id: number, @Body() dto: AnswerContactMessageDto) {
    const message = await this.answerMessage.execute(id, dto.answer);
    return successResponse('Reply saved successfully.', {
      contato: presentContactMessage(message),
    });
  }

  @Put(':id/mark-read')
  async markRead(@Param('id', ParseIntPipe) id: number) {
    const message = await this.markHandled.execute(id);
    return successResponse('Message marked as handled.', {
      contato: presentContactMessage(message),
    });
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.deleteMessage.execute(id);
    return successResponse('Message deleted.');
  }
}
