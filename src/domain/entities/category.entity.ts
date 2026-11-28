export class Category {
  id!: number;
  name!: string;
  description!: string | null;

  constructor(props?: Partial<Category>) {
    if (props) Object.assign(this, props);
  }
}
