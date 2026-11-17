import { Webhook } from '../entities';

export abstract class WebhookRepository {
  abstract findAll(): Promise<Webhook[]>;
  abstract findActive(): Promise<Webhook[]>;
  abstract findById(id: number): Promise<Webhook | null>;
  abstract create(data: { url: string; events: string }): Promise<Webhook>;
  abstract delete(id: number): Promise<void>;
}
