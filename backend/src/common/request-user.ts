import { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  organizationId: string;
  role: string;
};

export type RequestWithUser = Request & { user: AuthenticatedUser };
