import {Request, Response} from 'express';

import {Permission, Role, User} from '../../data/schemas';

export type Gender = {
  gender: string;
};
export interface IRequest extends Request {
  token: any;
  user: User;
  roles: Role[];
  permissions: Permission[];
}
export type IResponse = Response;
