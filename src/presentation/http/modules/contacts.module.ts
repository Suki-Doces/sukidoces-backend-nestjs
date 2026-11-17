import { Module } from '@nestjs/common';
import { AnswerContactMessageUseCase } from '../../../application/use-cases/contacts/answer-contact-message.use-case';
import { CreateContactMessageUseCase } from '../../../application/use-cases/contacts/create-contact-message.use-case';
import { ListContactMessagesUseCase } from '../../../application/use-cases/contacts/list-contact-messages.use-case';
import { ListMyContactMessagesUseCase } from '../../../application/use-cases/contacts/list-my-contact-messages.use-case';
import { AdminContactsController, ContactsController } from '../controllers/contacts.controller';

@Module({
  controllers: [ContactsController, AdminContactsController],
  providers: [CreateContactMessageUseCase, ListMyContactMessagesUseCase, ListContactMessagesUseCase, AnswerContactMessageUseCase],
})
export class ContactsModule {}
