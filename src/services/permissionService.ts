import {uniq} from 'lodash';
import {Types} from 'mongoose';
import {inject, injectable} from 'tsyringe';

import {IPermissionRepository} from '../data/repositories/permissionRepository';
import {IRoleRepository} from '../data/repositories/roleRepository';
import {Permission} from '../data/schemas';
import {PermissionFailure} from '../enum';
import {PERMISSION_WRAPPER, convertStringToPermission} from '../data/constants/permissions';

import {ServiceFailure, ServiceResponse, ServiceResponseStatus} from './types/serviceResponse';

export interface IPermissionService {
  createPermission(
    permissionData: Permission,
  ): Promise<ServiceResponse<Permission, ServiceFailure<PermissionFailure>>>;
  createPermissions(permissionStringList: string[]): Promise<ServiceResponse<Permission[]>>;
  getAllPermissions(): Promise<ServiceResponse<Permission[]>>;
  getPermissionOfARole(roleId: Types.ObjectId): Promise<ServiceResponse<Permission[]>>;
  getPermissionOfRoles(roleIds: Types.ObjectId[]): Promise<ServiceResponse<Permission[]>>;
  seedPermissions(): Promise<ServiceResponse<Permission[]>>;
}

@injectable()
export class PermissionService implements IPermissionService {
  constructor(
    @inject('IPermissionRepository') private permissionRepository: IPermissionRepository,
    @inject('IRoleRepository') private roleRepository: IRoleRepository,
  ) {}

  public async createPermission(
    permissionData: Permission,
  ): Promise<ServiceResponse<Permission, ServiceFailure<PermissionFailure>>> {
    const permissionExisted = await this.permissionRepository.checkPermissionExisting(
      permissionData,
    );

    if (permissionExisted) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: PermissionFailure.PermissionExisted},
      };
    }
    const createdPermission = await this.permissionRepository.create(permissionData);

    return {status: ServiceResponseStatus.Success, result: createdPermission};
  }

  public async createPermissions(
    permissionStringList: string[],
  ): Promise<ServiceResponse<Permission[]>> {
    const creatingPermissions = uniq(permissionStringList).map(
      convertStringToPermission,
    ) as Permission[];

    const existingPermissions = await this.permissionRepository.get();
    const notExistedPermissions: Permission[] = [];

    for (const permission of creatingPermissions) {
      const isExisted = existingPermissions.some((existingPermission) =>
        this.isSamePermission(existingPermission, permission),
      );

      if (!isExisted) {
        notExistedPermissions.push(permission);
      }
    }

    const permissions = await this.permissionRepository.createMany(notExistedPermissions);

    return {status: ServiceResponseStatus.Success, result: permissions};
  }

  public async getAllPermissions(): Promise<ServiceResponse<Permission[]>> {
    const permissions = await this.permissionRepository.getAllPermissions();

    return {status: ServiceResponseStatus.Success, result: permissions};
  }

  public async getPermissionOfARole(
    roleId: Types.ObjectId,
  ): Promise<ServiceResponse<Permission[]>> {
    const permissions = await this.roleRepository.getPermissionsOfARole(roleId);

    return {status: ServiceResponseStatus.Success, result: permissions};
  }

  public async getPermissionOfRoles(
    roleIds: Types.ObjectId[],
  ): Promise<ServiceResponse<Permission[]>> {
    const permissions = await this.roleRepository.getPermissionsOfRoles(roleIds);

    return {status: ServiceResponseStatus.Success, result: permissions};
  }

  public async seedPermissions(): Promise<ServiceResponse<Permission[]>> {
    const permissionForSeeding: Permission[] = [];

    for (const actionsOfResource of Object.values(PERMISSION_WRAPPER)) {
      for (const scopesOfAction of Object.values(actionsOfResource)) {
        for (const permission of Object.values(scopesOfAction)) {
          permissionForSeeding.push(convertStringToPermission(permission) as Permission);
        }
      }
    }

    const permissions = await this.permissionRepository.createMany(permissionForSeeding);

    return {status: ServiceResponseStatus.Success, result: permissions};
  }

  private isSamePermission(permission1: Permission, permission2: Permission) {
    return (
      permission1.action === permission2.action &&
      permission1.resource === permission2.resource &&
      permission1.scope === permission2.scope
    );
  }
}
