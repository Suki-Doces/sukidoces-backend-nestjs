import { Injectable } from '@nestjs/common';
import { UserRole } from '../../../domain/enums';
import { ContactMessageRepository } from '../../../domain/repositories';
import { InternalError } from '../../errors/application-errors';

export interface Requester {
  id: number;
  role: string | null;
}

export interface CreateContactMessageInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Present when the caller is authenticated. */
  requester?: Requester;
}

@Injectable()
export class CreateContactMessageUseCase {
  constructor(private readonly messages: ContactMessageRepository) {}

  async execute(input: CreateContactMessageInput): Promise<{ id: number }> {
    try {
      const { requester, ...data } = input;
      const created = await this.messages.create({
        ...data,
        // Admins sending a message are not linked to a customer account.
        userId: requester && requester.role !== UserRole.ADMIN ? requester.id : undefined,
      });
      return { id: created.id };
    } catch {
      throw new InternalError('Error saving the message. Please try again later.');
    }
  }
}
