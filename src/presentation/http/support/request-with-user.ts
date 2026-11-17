import { Request } from 'express';
import { TokenClaims } from '../../../application/ports/token-service';

export interface RequestWithUser extends Request {
  user?: TokenClaims;
}
