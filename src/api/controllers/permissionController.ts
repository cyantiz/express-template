import {inject, injectable} from 'tsyringe';

import {IPermissionService} from '../../services/permissionService';
import {ServiceResponseStatus} from '../../services/types/serviceResponse';
import {ConflictResult, OkResult} from '../httpResponses';
import {IRequest, IResponse} from '../types';
import {PermissionFailure} from '../../enum';
import {convertPermissionToString} from '../../data/constants/permissions';

@injectable()
export class PermissionController {
  constructor(@inject('IPermissionService') private permissionService: IPermissionService) {
    this.createPermission = this.createPermission.bind(this);
    this.createPermissions = this.createPermissions.bind(this);
    this.getAllPermissionNames = this.getAllPermissionNames.bind(this);
    this.seedPermissions = this.seedPermissions.bind(this);
    this.getSelfPermissionNames = this.getSelfPermissionNames.bind(this);
  }

  public async createPermission(req: IRequest, res: IResponse): Promise<IResponse> {
    const {permission} = req.body;

    const {
      result: createPermissionResult,
      status,
      failure,
    } = await this.permissionService.createPermission(permission);

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case PermissionFailure.PermissionExisted:
          return res.send(
            ConflictResult({
              reason: PermissionFailure.PermissionExisted,
              message: 'Permission existed',
            }),
          );
      }
    }

    return res.send(OkResult(createPermissionResult));
  }

  public async createPermissions(req: IRequest, res: IResponse): Promise<IResponse> {
    const {permissions} = req.body as {
      permissions: string[];
    };

    const {result: createPermissionsResult} = await this.permissionService.createPermissions(
      permissions,
    );

    return res.send(OkResult(createPermissionsResult));
  }

  public async getAllPermissionNames(req: IRequest, res: IResponse): Promise<IResponse> {
    const {result: allPermissions} = await this.permissionService.getAllPermissions();

    const allPermissionNames = allPermissions.map(convertPermissionToString);

    return res.send(OkResult(allPermissionNames));
  }

  public async getSelfPermissionNames(req: IRequest, res: IResponse): Promise<IResponse> {
    const {permissions} = req;

    const permissionStrings = permissions.map(convertPermissionToString);

    return res.send(OkResult(permissionStrings));
  }

  public async seedPermissions(req: IRequest, res: IResponse): Promise<IResponse> {
    const {result: seedPermissionsResult} = await this.permissionService.seedPermissions();

    return res.send(OkResult(seedPermissionsResult));
  }
}
