import {Types} from 'mongoose';
import {container} from 'tsyringe';

import {AuthenticationFailure, RoleFailure} from '../../enum';
import {RoleService} from '../../services/roleService';
import {ServiceResponseStatus} from '../../services/types/serviceResponse';
import {NotFoundResult} from '../httpResponses';
import {IRequest, IResponse} from '../types';
import {PermissionRepository} from '../../data/repositories/permissionRepository';

import {UserService} from './../../services/userService';

export default async (req: IRequest, res: IResponse, next): Promise<IResponse> => {
  const userService = container.resolve(UserService);
  const roleService = container.resolve(RoleService);
  const permissionRepository = container.resolve(PermissionRepository);
  const decodedUser = req.token.user;
  const user = (await userService.getUser(decodedUser.id)).result;

  console.log(res);

  if (!user) {
    return res.send(
      NotFoundResult({
        reason: AuthenticationFailure.UserNotFound,
        message: `User not found`,
      }),
    );
  }

  const {result: roles, failure, status: getRoleDetailsStatus} = await roleService.getRolesDetails(
    user.roleIds as Types.ObjectId[],
  );

  const permissionIds =
    roles?.flatMap((role) => role?.permissions ?? [])?.map((p) => p.toString()) ?? [];

  const permissions = await permissionRepository.getIn(permissionIds);

  if (getRoleDetailsStatus === ServiceResponseStatus.Failed) {
    switch (failure.reason) {
      case RoleFailure.RoleNotFound:
        return res.send(
          NotFoundResult({
            reason: RoleFailure.RoleNotFound,
            message: `Role not found`,
          }),
        );
    }
  }

  if (getRoleDetailsStatus === ServiceResponseStatus.Failed) {
    switch (failure.reason) {
      case RoleFailure.RoleNotFound:
        return res.send(
          NotFoundResult({
            reason: RoleFailure.RoleNotFound,
            message: `Role not found`,
          }),
        );
    }
  }

  req.user = user;
  req.roles = roles;
  req.permissions = permissions;

  return next();
};
