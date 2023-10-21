import {Types} from 'mongoose';
import {container} from 'tsyringe';

import {PermissionService} from '../../services/permissionService';
import {IRequest, IResponse} from '../types';
import {ForbiddenResult} from '../httpResponses';
import {convertStringToPermission} from '../../data/constants/permissions';

export function checkPermission(permissionString: string) {
  return async function (req: IRequest, res: IResponse, next) {
    const permission = convertStringToPermission(permissionString);

    const permissionService = container.resolve(PermissionService);
    const {result: permissions} = await permissionService.getPermissionOfRoles(
      req.user.roleIds as Types.ObjectId[],
    );

    for (let i = 0; i < permissions.length; i += 1) {
      if (
        permissions[i].resource === permission.resource &&
        permissions[i].action === permission.action &&
        (permissions[i].scope === permission.scope || permissions[i].scope === 'ALL')
      ) {
        return next();
      }
    }

    return res.send(
      ForbiddenResult({
        reason: 'NotEnoughPermission',
        message: 'Forbidden access',
      }),
    );
  };
}
