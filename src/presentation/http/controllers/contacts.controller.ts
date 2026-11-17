import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TokenClaims } from '../../../application/ports/token-service';
import { AnswerContactMessageUseCase } from '../../../application/use-cases/contacts/answer-contact-message.use-case';
import { CreateContactMessageUseCase } from '../../../application/use-cases/contacts/create-contact-message.use-case';
import { ListContactMessagesUseCase } from '../../../application/use-cases/contacts/list-contact-messages.use-case';
import { ListMyContactMessagesUseCase } from '../../../application/use-cases/contacts/list-my-contact-messages.use-case';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AnswerContactMessageDto, CreateContactMessageDto } from '../dto/contact.dto';
import { AdminGuard } from '../guards/admin.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';
import { successResponse } from '../support/api-response';
import { presentContactMessage } from '../support/presenters';

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
    const created = await this.createMessage.execute({ ...dto, requester: user && { id: user.id, role: user.role } });
    return successResponse('Message received successfully. We will contact you soon.', created);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async mine(@CurrentUser() user: TokenClaims) {
    const messages = await this.listMyMessages.execute({ id: user.id, role: user.role });
    return successResponse('History loaded successfully', { messages: messages.map(presentContactMessage) });
  }
}

@ApiTags('contacts')
@Controller('admin/contatos')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminContactsController {
  constructor(
    private readonly listMessages: ListContactMessagesUseCase,
    private readonly answerMessage: AnswerContactMessageUseCase,
  ) {}

  @Get()
  async list() {
    const messages = await this.listMessages.execute();
    return successResponse('Messages loaded successfully', { messages: messages.map(presentContactMessage) });
  }

  @Put(':id/respond')
  async respond(@Param('id', ParseIntPipe) id: number, @Body() dto: AnswerContactMessageDto) {
    const message = await this.answerMessage.execute(id, dto.answer);
    return successResponse('Reply saved successfully.', { contato: presentContactMessage(message) });
  }
}
