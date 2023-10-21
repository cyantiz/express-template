import {uniq} from 'lodash';
import {Model, Types} from 'mongoose';
import {ExtractDoc} from 'ts-mongoose';
import {injectable} from 'tsyringe';

import {DbContext} from '../dbContext';
import {Permission, Role} from '../schemas';
import {RoleSchema} from '../schemas/role';

import {IBaseRepository, BaseRepository} from './baseRepository';

export type RoleDocument = ExtractDoc<typeof RoleSchema>;
export interface IRoleRepository extends IBaseRepository<Role, RoleDocument> {
  getByName(name: string): Promise<Role>;
  updatePermissions(roleName: string, permissions: Permission[]): Promise<Role>;
  getPermissionsOfARole(roleId: Types.ObjectId): Promise<Permission[]>;
  getPermissionsOfRoles(roleIds: Types.ObjectId[]): Promise<Permission[]>;
  getAllRoles(): Promise<Role[]>;
  getAllWithPermissions(): Promise<Role[]>;
  getByIdWithPermissions(roleId: Types.ObjectId): Promise<Role>;
  addPermissionsToAllRole(permissions: Permission[]): Promise<Role[]>;
}

@injectable()
export class RoleRepository extends BaseRepository<Role, RoleDocument> implements IRoleRepository {
  constructor(context: DbContext) {
    super(context);
  }

  protected get model(): Model<RoleDocument> {
    return this.context.model<RoleDocument>(nameof<Role>());
  }

  public async getByName(name: string): Promise<Role> {
    return await this.model.findOne({name}).lean().exec();
  }

  public async updatePermissions(roleName: string, permissions: Permission[]): Promise<Role> {
    return await this.model
      .findOneAndUpdate({name: roleName}, {permissions}, {new: true})
      .lean()
      .exec();
  }

  public async getPermissionsOfARole(roleId: Types.ObjectId): Promise<Permission[]> {
    const {permissions} = await this.model.findOne({_id: roleId}).populate('permissions');

    return permissions as Permission[];
  }

  public async getPermissionsOfRoles(roleIds: Types.ObjectId[]): Promise<Permission[]> {
    const roleObjectIds = roleIds.map((roleId) => new Types.ObjectId(roleId));
    const roles = await this.model
      .find({_id: {$in: roleObjectIds}})
      .populate('permissions')
      .lean()
      .exec();

    const permissions = roles.reduce((acc, role) => [...acc, ...role.permissions], []);

    return permissions as Permission[];
  }

  public async getAllRoles(): Promise<Role[]> {
    return await this.model.find().lean().exec();
  }

  public async getAllWithPermissions(): Promise<Role[]> {
    return await this.model.find({}).populate('permissions').lean().exec();
  }

  public async getByIdWithPermissions(roleId: Types.ObjectId): Promise<Role> {
    const mongooseFilter = {_id: roleId};

    return await this.model.findOne(mongooseFilter).populate('permissions').lean().exec();
  }

  public async addPermissionsToAllRole(permissions: Permission[]): Promise<Role[]> {
    const roles = await this.model.find().lean().exec();

    const rolesWithPermissions = roles.map((role) => {
      const rolePermissions = role.permissions.map((permission) => permission.toString());

      return {
        ...role,
        permissions: uniq([
          ...rolePermissions,
          ...permissions.map((permission) => permission._id.toHexString()),
        ]),
      };
    });

    const rolesWithPermissionsObjectIds = rolesWithPermissions.map((role) => ({
      ...role,
      permissions: role.permissions.map((permission) => new Types.ObjectId(permission)),
    }));

    const bulkUpdate = rolesWithPermissionsObjectIds.map((role) => ({
      updateOne: {
        filter: {_id: role._id},
        update: {$set: {permissions: role.permissions}},
      },
    }));

    await this.model.bulkWrite(bulkUpdate);

    return rolesWithPermissions;
  }
}
