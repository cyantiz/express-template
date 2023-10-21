import {inject, injectable} from 'tsyringe';

import {IRoleService} from '../../services/roleService';
import {ServiceResponseStatus} from '../../services/types/serviceResponse';
import {NotFoundResult, OkResult} from '../httpResponses';
import {IRequest, IResponse} from '../types';
import {RoleFailure, PermissionFailure} from '../../enum';
import {RoleWithPermissionNames} from '../../services/types/responseTypes';

@injectable()
export class RoleController {
  constructor(@inject('IRoleService') private roleService: IRoleService) {
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.updateRolePermissions = this.updateRolePermissions.bind(this);
    this.delete = this.delete.bind(this);
    this.addPermissionToAllRole = this.addPermissionToAllRole.bind(this);
  }

  public async create(req: IRequest, res: IResponse): Promise<IResponse> {
    const {role} = req.body as {
      role: RoleWithPermissionNames;
    };

    const {result, status, failure} = await this.roleService.create({
      role,
    });

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case RoleFailure.RoleWithThisNameAlreadyExist:
          return res.send(
            NotFoundResult({
              reason: RoleFailure.RoleWithThisNameAlreadyExist,
              message: 'Role with this name already exist',
            }),
          );
        case PermissionFailure.PermissionNotFound:
          return res.send(
            NotFoundResult({
              reason: PermissionFailure.PermissionNotFound,
              message: 'Some permission in list not found',
            }),
          );
      }
    }

    return res.send(OkResult(result));
  }

  public async getAll(req: IRequest, res: IResponse): Promise<IResponse> {
    const {result} = await this.roleService.getAll();

    return res.send(OkResult(result));
  }

  public async getById(req: IRequest, res: IResponse): Promise<IResponse> {
    const {roleId} = req.params;

    const {result} = await this.roleService.getById(roleId);

    return res.send(OkResult(result));
  }

  public async updateRolePermissions(req: IRequest, res: IResponse): Promise<IResponse> {
    const {roleId} = req.params;
    const {role} = req.body as {
      role: RoleWithPermissionNames;
    };

    const {result, status, failure} = await this.roleService.updateRolePermissions({
      roleId,
      newData: role,
    });

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case RoleFailure.SomeRoleInListNotFound:
          return res.send(
            NotFoundResult({
              reason: RoleFailure.SomeRoleInListNotFound,
              message: 'Some Role In List Not Found',
            }),
          );
        case RoleFailure.RoleNotFound:
          return res.send(
            NotFoundResult({
              reason: RoleFailure.RoleNotFound,
              message: 'Role Not Found',
            }),
          );
        case RoleFailure.BadRequest:
          return res.send(
            NotFoundResult({
              reason: RoleFailure.BadRequest,
              message: 'Bad Request',
            }),
          );
      }
    }

    return res.send(OkResult(result));
  }

  public async delete(req: IRequest, res: IResponse): Promise<IResponse> {
    const {roleId} = req.params;

    const {result, status, failure} = await this.roleService.delete(roleId);

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case RoleFailure.RoleNotFound:
          return res.send(
            NotFoundResult({
              reason: RoleFailure.RoleNotFound,
              message: 'Role Not Found',
            }),
          );
      }
    }

    return res.send(OkResult(result));
  }

  public async addPermissionToAllRole(req: IRequest, res: IResponse): Promise<IResponse> {
    const {permissions} = req.body as {
      permissions: string[];
    };

    const {result: addPermissionToAllRoleResult} = await this.roleService.addPermissionToAllRole(
      permissions,
    );

    return res.send(OkResult(addPermissionToAllRoleResult));
  }
}
