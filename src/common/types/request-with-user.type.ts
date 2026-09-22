import { Request } from 'express';

export interface UsuarioPayload {
  id: number;
  email: string;
  role: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface RequestWithUsuario extends Request {
  usuario: UsuarioPayload;
}
