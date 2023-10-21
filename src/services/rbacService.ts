import {inject, injectable} from 'tsyringe';

import {IPermissionRepository} from '../data/repositories/permissionRepository';
import {IRoleRepository} from '../data/repositories/roleRepository';
import {IUserRepository} from '../data/repositories/userRepository';
import {convertPermissionToString} from '../data/constants/permissions';

import {Permission} from './../data/schemas/index';

export interface IRBACService {
  checkPermissions(params: {
    userPermissions?: Permission[];
    requiredPermissions: string[];
  }): boolean;
}

@injectable()
export class RBACService implements IRBACService {
  constructor(
    @inject('IRoleRepository') private roleRepository: IRoleRepository,
    @inject('IPermissionRepository') private permissionRepository: IPermissionRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
  ) {}

  public checkPermissions(params: {
    userPermissions?: Permission[];
    requiredPermissions: string[];
  }): boolean {
    const {userPermissions, requiredPermissions} = params;

    if (!userPermissions || !userPermissions?.length) {
      return false;
    }

    const userPermissionNames = userPermissions.map(convertPermissionToString);

    return requiredPermissions.every((requiredPermissionString) =>
      userPermissionNames.includes(requiredPermissionString),
    );
  }
}
