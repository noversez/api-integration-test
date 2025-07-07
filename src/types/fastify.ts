import { FastifyRequest } from 'fastify';

export interface JwtUserPayload {
  id: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JwtUserPayload;
}
