export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  profilePhoto: string | null;
}

export class Admin {
  id: number;
  name: string;
  email: string;
  /** Password hash — never exposed (see toJSON). */
  password: string;
  profilePhoto: string | null;

  constructor(props?: Partial<Admin>) {
    if (props) Object.assign(this, props);
  }

  toProfile(): AdminProfile {
    return { id: this.id, name: this.name, email: this.email, profilePhoto: this.profilePhoto };
  }

  toJSON(): AdminProfile {
    return this.toProfile();
  }
}
