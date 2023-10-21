import {injectable} from 'tsyringe';
import mongoose from 'mongoose';
import {ExtractDoc} from 'ts-mongoose';
import {ObjectID} from 'mongodb';
import {map} from 'lodash';

import {DbContext} from '../dbContext';
import {User} from '../schemas';
import {UserSchema} from '../schemas/user';
import {Transaction} from '../transaction';

import {BaseRepository, IBaseRepository} from './baseRepository';

export type UserDocument = ExtractDoc<typeof UserSchema>;
export interface IUserRepository
  extends IBaseRepository<User, UserDocument, mongoose.AggregatePaginateModel<UserDocument>> {
  getUserByEmail(email: string): Promise<User>;
  updateAccountStatus(id: string, activatedUser: boolean, transaction?: Transaction): Promise<User>;
  changePassword(email: string, newPassword: string): Promise<User>;
  getAllUserEmails(): Promise<{email: string}[]>;
  getUsersByRole(roleId: string): Promise<User[]>;
  updateUserRoles(userId: string, roleIds: string[]): Promise<User>;
}
@injectable()
export class UserRepository
  extends BaseRepository<User, UserDocument, mongoose.AggregatePaginateModel<UserDocument>>
  implements IUserRepository {
  constructor(context: DbContext) {
    super(context);
  }

  protected get model(): mongoose.AggregatePaginateModel<UserDocument> {
    return this.context.model<UserDocument>(
      nameof<User>(),
    ) as mongoose.AggregatePaginateModel<UserDocument>;
  }

  public async getUserByEmail(email: string): Promise<User> {
    const user = await this.model
      .aggregate([
        {
          $match: {
            email: email,
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'roleIds',
            foreignField: '_id',
            as: 'roles',
          },
        },
        {
          $unwind: {
            path: '$roles',
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .exec();

    return user[0];
  }

  public async updateAccountStatus(
    id: string,
    activatedUser: boolean,
    transaction?: Transaction,
  ): Promise<User> {
    const session = transaction && transaction.session;

    return this.model.findByIdAndUpdate(id, {activatedUser}, {new: true, session});
  }

  public async changePassword(email: string, newPassword: string): Promise<User> {
    return this.model.findOneAndUpdate({email}, {password: newPassword});
  }

  public async getAllUserEmails(): Promise<{email: string}[]> {
    return this.model.find({}, {email: 1, _id: 0}).lean().exec();
  }

  public async getUsersByRole(roleId: string): Promise<User[]> {
    return this.model
      .find({
        roleIds: {
          $elemMatch: {
            $eq: new ObjectID(roleId),
          },
        },
      })
      .lean()
      .exec();
  }

  public async updateUserRoles(userId: string, roleIds: string[]): Promise<User> {
    return await this.model.updateOne(
      {
        _id: new ObjectID(userId),
      },
      {
        roleIds: map(roleIds, (roleId) => new ObjectID(roleId)),
      },
    );
  }
}
