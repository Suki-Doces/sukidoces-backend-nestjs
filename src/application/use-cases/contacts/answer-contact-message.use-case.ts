import { Injectable } from '@nestjs/common';
import { ContactMessage } from '../../../domain/entities';
import { ContactMessageRepository } from '../../../domain/repositories';
import { InternalError, NotFoundError } from '../../errors/application-errors';

@Injectable()
export class AnswerContactMessageUseCase {
  constructor(private readonly messages: ContactMessageRepository) {}

  async execute(id: number, answer: string): Promise<ContactMessage> {
    const message = await this.messages.findById(id);
    if (!message) {
      throw new NotFoundError('Message not found.');
    }

    message.respond(answer);

    try {
      return await this.messages.save(message);
    } catch {
      throw new InternalError('Error saving the reply.');
    }
  }
}
