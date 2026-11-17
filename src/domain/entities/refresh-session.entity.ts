export class RefreshSession {
  tokenHash: string;
  userId: number;
  role: string | null;
  expiresAt: Date;

  constructor(props?: Partial<RefreshSession>) {
    if (props) Object.assign(this, props);
  }
}
