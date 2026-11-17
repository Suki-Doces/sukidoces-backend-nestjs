import { Injectable } from '@nestjs/common';
import { ContactMessage } from '../../../domain/entities';
import { UserRole } from '../../../domain/enums';
import { ContactMessageRepository } from '../../../domain/repositories';
import { ForbiddenError, InternalError } from '../../errors/application-errors';
import { Requester } from './create-contact-message.use-case';

@Injectable()
export class ListMyContactMessagesUseCase {
  constructor(private readonly messages: ContactMessageRepository) {}

  async execute(requester?: Requester): Promise<ContactMessage[]> {
    if (!requester || requester.role === UserRole.ADMIN) {
      throw new ForbiddenError('Access denied.');
    }

    try {
      return await this.messages.findByUser(requester.id);
    } catch {
      throw new InternalError('Error fetching message history.');
    }
  }
}
