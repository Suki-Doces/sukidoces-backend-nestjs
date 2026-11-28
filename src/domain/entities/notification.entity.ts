import type { User } from './user.entity';
import type { Admin } from './admin.entity';

export class Notification {
  id!: number;
  userId!: number | null;
  adminId!: number | null;
  title!: string;
  message!: string;
  type!: string;
  isRead!: boolean;
  createdAt!: Date;
  user?: User;
  admin?: Admin;

  constructor(props?: Partial<Notification>) {
    if (props) Object.assign(this, props);
  }
}
