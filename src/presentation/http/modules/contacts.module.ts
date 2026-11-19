import { Module } from '@nestjs/common';
import {
  AnswerContactMessageUseCase,
  CreateContactMessageUseCase,
  ListContactMessagesUseCase,
  ListMyContactMessagesUseCase,
} from '@application/use-cases/contacts';

import { AdminContactsController, ContactsController } from '@presentation/http/controllers';

@Module({
  controllers: [ContactsController, AdminContactsController],
  providers: [
    CreateContactMessageUseCase,
    ListMyContactMessagesUseCase,
    ListContactMessagesUseCase,
    AnswerContactMessageUseCase,
  ],
})
export class ContactsModule {}
