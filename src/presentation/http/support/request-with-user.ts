import { Request } from 'express';
import { TokenClaims } from '@application/ports';

export interface RequestWithUser extends Request {
  user?: TokenClaims;
}
