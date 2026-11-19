import { Injectable } from '@nestjs/common';
import { ContactMessage } from '@domain/entities';
import { ContactMessageRepository } from '@domain/repositories';
import { InternalError } from '@application/errors';

@Injectable()
export class ListContactMessagesUseCase {
  constructor(private readonly messages: ContactMessageRepository) {}

  async execute(): Promise<ContactMessage[]> {
    try {
      return await this.messages.findAll();
    } catch {
      throw new InternalError('Error fetching messages.');
    }
  }
}
