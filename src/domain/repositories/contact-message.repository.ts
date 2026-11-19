import { ContactMessage } from '@domain/entities';

export abstract class ContactMessageRepository {
  abstract create(data: Partial<ContactMessage>): Promise<ContactMessage>;
  abstract findByUser(userId: number): Promise<ContactMessage[]>;
  abstract findAll(): Promise<ContactMessage[]>;
  abstract findById(id: number): Promise<ContactMessage | null>;
  abstract save(message: ContactMessage): Promise<ContactMessage>;
}
