import {Model} from 'mongoose';
import {ExtractDoc} from 'ts-mongoose';
import {injectable} from 'tsyringe';

import {DbContext} from '../dbContext';
import {Permission} from '../schemas';
import {PermissionSchema} from '../schemas/permission';

import {IBaseRepository, BaseRepository} from './baseRepository';

export type PermissionDocument = ExtractDoc<typeof PermissionSchema>;

export interface IPermissionRepository extends IBaseRepository<Permission, PermissionDocument> {
  getPermission(data: Partial<Permission>): Promise<Permission>;
  getAllPermissions(): Promise<Permission[]>;
  checkPermissionExisting(data: Partial<Permission>): Promise<boolean>;
  getByStringList(permissionStringList: string[]): Promise<Permission[]>;
}

@injectable()
export class PermissionRepository
  extends BaseRepository<Permission, PermissionDocument>
  implements IPermissionRepository {
  constructor(context: DbContext) {
    super(context);
  }

  protected get model(): Model<PermissionDocument> {
    return this.context.model<PermissionDocument>(nameof<Permission>());
  }

  public async getPermission(data: Partial<Permission>): Promise<Permission> {
    return await this.model
      .findOne({action: data.action, scope: data.scope, resource: data.resource})
      .lean()
      .exec();
  }

  public async getAllPermissions(): Promise<Permission[]> {
    return await this.model.find();
  }

  public async checkPermissionExisting(data: Partial<Permission>): Promise<boolean> {
    const permission = await this.getPermission(data);

    if (permission) return true;

    return false;
  }

  public async getByStringList(permissionStringList: string[]): Promise<Permission[]> {
    return await this.model
      .find({
        $or: permissionStringList.map((permissionString) => {
          const [action, scope, resource] = permissionString.split('.');

          return {action, scope, resource};
        }),
      })
      .lean()
      .exec();
  }
}
