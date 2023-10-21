import Joi from 'joi';

import {IRequest, IResponse} from '../types';
import {ValidationResult} from '../httpResponses';

export enum JoiSchema {
  changePasswordData = 'changePasswordData',
  createUser = 'createUser',
  permission = 'permission',
  permissions = 'permissions',
  role = 'role',
  updateUserRoles = 'updateUserRoles',
}

export function joiValidator(schema: any, param: string) {
  return async (req: IRequest, res: IResponse, next): Promise<IResponse> => {
    try {
      const body = req.body;

      await schema.validateAsync(body[param]);
      next();
    } catch (err) {
      return res.send(
        ValidationResult(
          err.details.map((x) => ({
            reason: 'BadRequest',
            message: x.message,
          })),
        ),
      );
    }
  };
}

export const JoiValidationSchema = {
  createUser: Joi.object({
    email: Joi.string().email().trim().required(),
    password: Joi.string().min(6).required(),
    roleId: Joi.string().required(),
  })
    .required()
    .options({abortEarly: false}),

  updateUserRoles: Joi.object({
    roleIds: Joi.array().items(Joi.string()).required(),
  })
    .required()
    .options({abortEarly: false}),

  changePasswordData: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().required(),
  })
    .required()
    .options({abortEarly: false}),

  role: Joi.object({
    _id: Joi.string().optional(),
    name: Joi.string().required(),
    permissions: Joi.array().items(Joi.string()).required(),
  })
    .required()
    .options({abortEarly: false}),

  permission: Joi.object()
    .keys({
      resource: Joi.string().required(),
      action: Joi.string().required(),
      scope: Joi.string().required(),
    })
    .options({abortEarly: false}),

  permissions: Joi.array().items(Joi.string()).options({abortEarly: false}),
};
