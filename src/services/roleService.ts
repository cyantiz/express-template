import {Types} from 'mongoose';
import {inject, injectable} from 'tsyringe';
import {map} from 'lodash';

import {IPermissionRepository} from '../data/repositories/permissionRepository';
import {IRoleRepository} from '../data/repositories/roleRepository';
import {Permission, Role} from '../data/schemas';
import {RoleFailure, PermissionFailure} from '../enum';
import {convertPermissionToString, permissionListToRecord} from '../data/constants/permissions';
import {IUserRepository} from '../data/repositories/userRepository';

import {ServiceFailure, ServiceResponse, ServiceResponseStatus} from './types/serviceResponse';
import {RoleWithPermissionNames} from './types/responseTypes';

export interface IRoleService {
  getRolesDetails(
    roleIds: Types.ObjectId[],
  ): Promise<ServiceResponse<Role[], ServiceFailure<RoleFailure>>>;

  create(dto: {
    role: RoleWithPermissionNames;
  }): Promise<ServiceResponse<Role, ServiceFailure<RoleFailure | PermissionFailure>>>;
  getAll(): Promise<ServiceResponse<RoleWithPermissionNames[], ServiceFailure<RoleFailure>>>;
  getById(
    roleId: string,
  ): Promise<ServiceResponse<RoleWithPermissionNames, ServiceFailure<RoleFailure>>>;
  updateRolePermissions(dto: {
    roleId: string;
    newData: RoleWithPermissionNames;
  }): Promise<ServiceResponse<Role, ServiceFailure<RoleFailure>>>;
  delete(roleId: string): Promise<ServiceResponse<Role, ServiceFailure<RoleFailure>>>;
  addPermissionToAllRole(permissionStringList: string[]): Promise<ServiceResponse<Role[]>>;
}

@injectable()
export class RoleService implements IRoleService {
  constructor(
    @inject('IRoleRepository') private roleRepository: IRoleRepository,
    @inject('IPermissionRepository') private permissionRepository: IPermissionRepository,
    @inject('IUserRepository') private userRepository: IUserRepository,
  ) {}

  public async getRolesDetails(
    roleIds: Types.ObjectId[],
  ): Promise<ServiceResponse<Role[], ServiceFailure<RoleFailure>>> {
    const roles = await this.roleRepository.getIn(roleIds.map((id) => id.toString()));

    if (!roles) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: RoleFailure.RoleNotFound},
      };
    }

    return {status: ServiceResponseStatus.Success, result: roles};
  }

  public async create(dto: {
    role: RoleWithPermissionNames;
  }): Promise<ServiceResponse<Role, ServiceFailure<RoleFailure | PermissionFailure>>> {
    const {role} = dto;

    if (await this.isRoleNameExisted(role.name))
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: RoleFailure.RoleWithThisNameAlreadyExist},
      };

    const allPermissions = await this.permissionRepository.getAllPermissions();
    const permissionRecords = permissionListToRecord(allPermissions);

    const permissions = role.permissions.map((permissionName) => permissionRecords[permissionName]);

    const hasNotFoundPermission = permissions.some((it) => it === undefined);

    if (hasNotFoundPermission) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: PermissionFailure.SomePermissionNotFound},
      };
    }

    const permissionIds = permissions.map((p) => p._id);

    const newRole = await this.roleRepository.create({
      name: role.name,
      permissions: permissionIds,
      accessLevel: 1,
    } as Role);

    return {
      status: ServiceResponseStatus.Success,
      result: newRole,
    };
  }

  public async getAll(): Promise<
    ServiceResponse<RoleWithPermissionNames[], ServiceFailure<RoleFailure>>
  > {
    const permissions = await this.roleRepository.getAllWithPermissions();

    const result: RoleWithPermissionNames[] = permissions.map((role) =>
      this.formatRolePermission(role),
    );

    return {status: ServiceResponseStatus.Success, result};
  }

  public async getById(
    roleId: string,
  ): Promise<ServiceResponse<RoleWithPermissionNames, ServiceFailure<RoleFailure>>> {
    const role = await this.roleRepository.getByIdWithPermissions(Types.ObjectId(roleId));

    if (!role)
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: RoleFailure.RoleNotFound},
      };

    return {
      status: ServiceResponseStatus.Success,
      result: this.formatRolePermission(role),
    };
  }

  public async updateRolePermissions(dto: {
    roleId: string;
    newData: RoleWithPermissionNames;
  }): Promise<ServiceResponse<Role, ServiceFailure<RoleFailure>>> {
    const {roleId, newData} = dto;

    const role = await this.roleRepository.getById(roleId);

    if (!role)
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: RoleFailure.RoleNotFound},
      };

    const updatingRole: Role = role;

    const allPermissions = await this.permissionRepository.getAllPermissions();
    const permissionRecords = permissionListToRecord(allPermissions);

    const permissions: Permission[] = newData.permissions.map(
      (permissionName) => permissionRecords[permissionName],
    );
    const permissionIds = permissions.map((p) => p._id);

    updatingRole.name = newData.name;
    updatingRole.permissions = permissionIds;

    const updateResult = await this.roleRepository.update(roleId, updatingRole);

    return {status: ServiceResponseStatus.Success, result: updateResult};
  }

  public async delete(roleId: string): Promise<ServiceResponse<Role, ServiceFailure<RoleFailure>>> {
    const deletingRole = await this.roleRepository.getById(roleId);

    if (!deletingRole)
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: RoleFailure.RoleNotFound},
      };

    const usersHavingThisRole = await this.userRepository.getUsersByRole(roleId);

    if (usersHavingThisRole.length > 0)
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: RoleFailure.AtLeastOneUserHavingThisRole},
      };

    const deleteResult = await this.roleRepository.delete(roleId);

    return {status: ServiceResponseStatus.Success, result: deleteResult};
  }

  private async isRoleNameExisted(name: string): Promise<boolean> {
    const role = await this.roleRepository.getByName(name);

    return !!role;
  }

  private formatRolePermission(role: Role): RoleWithPermissionNames {
    return {
      ...role,
      _id: role._id.toHexString(),
      permissions:
        map(role.permissions, (permission: Permission) => convertPermissionToString(permission)) ??
        [],
    };
  }

  public async addPermissionToAllRole(
    permissionStringList: string[],
  ): Promise<ServiceResponse<Role[]>> {
    const permissions = await this.permissionRepository.getByStringList(permissionStringList);

    const roles = await this.roleRepository.addPermissionsToAllRole(permissions);

    return {status: ServiceResponseStatus.Success, result: roles};
  }
}
