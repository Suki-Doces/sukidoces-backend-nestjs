export class Webhook {
  id!: number;
  url!: string;
  /** Comma-separated list of subscribed event names. */
  events!: string;
  active!: boolean;
  createdAt!: Date;

  constructor(props?: Partial<Webhook>) {
    if (props) Object.assign(this, props);
  }

  subscribesTo(eventName: string): boolean {
    return this.events.split(',').includes(eventName);
  }
}
