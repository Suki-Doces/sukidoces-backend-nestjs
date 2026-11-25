import { Module } from '@nestjs/common';
import {
  AnswerContactMessageUseCase,
  CreateContactMessageUseCase,
  DeleteContactMessageUseCase,
  ListContactMessagesUseCase,
  ListMyContactMessagesUseCase,
  MarkContactMessageHandledUseCase,
} from '@application/use-cases/contacts';

import { AdminContactsController, ContactsController } from '@presentation/http/controllers';

@Module({
  controllers: [ContactsController, AdminContactsController],
  providers: [
    CreateContactMessageUseCase,
    ListMyContactMessagesUseCase,
    ListContactMessagesUseCase,
    AnswerContactMessageUseCase,
    MarkContactMessageHandledUseCase,
    DeleteContactMessageUseCase,
  ],
})
export class ContactsModule {}
