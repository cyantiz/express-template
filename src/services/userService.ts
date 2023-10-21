import bcrypt from 'bcrypt';
import {injectable, inject} from 'tsyringe';

import {ChangePasswordFailure, CreateUserFailure, GetUserFailure} from '../enum';
import {IUserRepository} from '../data/repositories/userRepository';
import {hashPassword} from '../utils/password';
import {Transaction} from '../data/transaction';
import {User} from '../data/schemas';
import {ICloudStorage} from '../infrastructure/cloudStorage';
import config from '../config';
import {UpdateUserRoleFailure} from '../enum/user';
import {IRoleRepository} from '../data/repositories/roleRepository';

import {ServiceFailure, ServiceResponse, ServiceResponseStatus} from './types/serviceResponse';
import {IRBACService} from './rbacService';

export interface IUserService {
  createUser(user: User): Promise<ServiceResponse<User, ServiceFailure<CreateUserFailure>>>;
  getUser(id: string): Promise<ServiceResponse<User, ServiceFailure<GetUserFailure>>>;
  getAllUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<ServiceResponse<User, ServiceFailure<GetUserFailure>>>;
  changePassword(
    email: string,
    newPassword: string,
    oldPassword: string,
  ): Promise<ServiceResponse<ServiceFailure<ChangePasswordFailure>>>;
  getAllUserEmails(): Promise<ServiceResponse<{email: string}[]>>;
  updateUserRoles(payload: {
    userId: string;
    roleIds: string[];
  }): Promise<ServiceResponse<User, ServiceFailure<UpdateUserRoleFailure>>>;
}
@injectable()
export class UserService implements IUserService {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('ICloudStorage')
    private cloudStorage: ICloudStorage,
    @inject('IRBACService')
    private rbacService: IRBACService,
    @inject('IRoleRepository') private roleRepository: IRoleRepository,
  ) {}

  public async createUser(
    userData: User,
  ): Promise<ServiceResponse<User, ServiceFailure<CreateUserFailure>>> {
    const transactionResult = await Transaction.begin(
      async (
        transaction: Transaction,
      ): Promise<ServiceResponse<User, ServiceFailure<CreateUserFailure>>> => {
        try {
          const hashedPassword = await hashPassword(userData.password);
          const user = {...userData, activatedUser: true, password: hashedPassword};

          const userExisted = await this.userRepository.getUserByEmail(user.email);

          if (userExisted) {
            return {
              status: ServiceResponseStatus.Failed,
              failure: {reason: CreateUserFailure.UserAlreadyExists},
            };
          }

          const createdUser = await this.userRepository.create(user, {transaction});

          createdUser.password = userData.password; // replace hash with the original, to return to client

          await transaction.commit();

          return {status: ServiceResponseStatus.Success, result: createdUser};
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      },
    );

    return transactionResult;
  }

  public async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.get();

    return users;
  }

  public async getUser(id: string): Promise<ServiceResponse<User, ServiceFailure<GetUserFailure>>> {
    const user = await this.userRepository.getById(id);

    if (!user) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: GetUserFailure.UserNotFound},
      };
    }

    return {
      status: ServiceResponseStatus.Success,
      result: user,
    };
  }

  public async getUserByEmail(
    email: string,
  ): Promise<ServiceResponse<User, ServiceFailure<GetUserFailure>>> {
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: GetUserFailure.UserNotFound},
      };
    }

    return {
      status: ServiceResponseStatus.Success,
      result: user,
    };
  }

  public async changePassword(
    email: string,
    newPassword: string,
    oldPassword: string,
  ): Promise<ServiceResponse<ServiceFailure<ChangePasswordFailure>>> {
    const user = await this.userRepository.getUserByEmail(email);
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatched) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: ChangePasswordFailure.IncorrectPassword},
      };
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.userRepository.changePassword(email, hashedPassword);

    return {
      status: ServiceResponseStatus.Success,
    };
  }

  public async getAllUserEmails(): Promise<ServiceResponse<{email: string}[]>> {
    const testingEmails = config.testingAccountEmails;

    let emails = await this.userRepository.getAllUserEmails();

    emails = emails.filter((item) => !testingEmails.includes(item.email));

    return {
      status: ServiceResponseStatus.Success,
      result: emails,
    };
  }

  public async updateUserRoles(payload: {
    userId: string;
    roleIds: string[];
  }): Promise<ServiceResponse<User, ServiceFailure<UpdateUserRoleFailure>>> {
    const {userId, roleIds: inputRoleIds} = payload;

    const user = await this.userRepository.getById(userId);
    const allRoles = await this.roleRepository.getAllRoles();
    const allRoleIds = allRoles.map((role) => role._id.toString());

    const everyInputRoleIdIsValid = inputRoleIds.every((inputRoleId) =>
      allRoleIds.includes(inputRoleId),
    );

    if (!everyInputRoleIdIsValid) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: UpdateUserRoleFailure.RoleNotFound},
      };
    }

    if (!user) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: UpdateUserRoleFailure.UserNotFound},
      };
    }

    const userWithNewRoles = await this.userRepository.updateUserRoles(userId, inputRoleIds);

    return {
      status: ServiceResponseStatus.Success,
      result: userWithNewRoles,
    };
  }
}
