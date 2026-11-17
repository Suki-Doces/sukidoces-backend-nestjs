export abstract class EmailSender {
  abstract sendVerificationEmail(to: string, verificationToken: string): Promise<void>;
}
