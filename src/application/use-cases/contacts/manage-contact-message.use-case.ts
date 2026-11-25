import { Injectable } from '@nestjs/common';
import { ContactMessage } from '@domain/entities';
import { ContactMessageRepository } from '@domain/repositories';
import { NotFoundError } from '@application/errors';

/** Admin marks a message as handled without writing a reply (e.g. answered by phone). */
@Injectable()
export class MarkContactMessageHandledUseCase {
  constructor(private readonly messages: ContactMessageRepository) {}

  async execute(id: number): Promise<ContactMessage> {
    const message = await this.messages.findById(id);
    if (!message) {
      throw new NotFoundError('Message not found.');
    }
    if (message.answered) {
      return message;
    }
    message.markAsHandled();
    return this.messages.save(message);
  }
}

@Injectable()
export class DeleteContactMessageUseCase {
  constructor(private readonly messages: ContactMessageRepository) {}

  async execute(id: number): Promise<void> {
    const message = await this.messages.findById(id);
    if (!message) {
      throw new NotFoundError('Message not found.');
    }
    await this.messages.deleteById(id);
  }
}
