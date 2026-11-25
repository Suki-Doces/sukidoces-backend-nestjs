import type { User } from './user.entity';

export class ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  userId: number | null;
  answered: boolean;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
  user?: User | null;

  constructor(props?: Partial<ContactMessage>) {
    if (props) Object.assign(this, props);
  }

  /** Closes the message without a written reply. */
  markAsHandled(now: Date = new Date()): void {
    this.answered = true;
    this.answeredAt = now;
  }

  respond(answer: string, now: Date = new Date()): void {
    this.answered = true;
    this.answer = answer.trim();
    this.answeredAt = now;
  }
}
