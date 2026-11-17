export class FeatureFlag {
  key: string;
  enabled: boolean;
  updatedAt: Date;

  constructor(props?: Partial<FeatureFlag>) {
    if (props) Object.assign(this, props);
  }
}
