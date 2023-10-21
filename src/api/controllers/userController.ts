import {inject, injectable} from 'tsyringe';

import {
  ForbiddenResult,
  BadRequestResult,
  OkResult,
  ConflictResult,
  NoContentResult,
  NotFoundResult,
  UpdateSuccessMsg,
} from '../httpResponses';
import {IUserService} from '../../services/userService';
import {ServiceResponseStatus} from '../../services/types/serviceResponse';
import {IRequest, IResponse} from '../types';
import {IRoleService} from '../../services/roleService';
import {ChangePasswordFailure, CreateUserFailure, GetUserFailure, UnknownError} from '../../enum';
import {PERMISSION_WRAPPER} from '../../data/constants/permissions';
import {UpdateUserRoleFailure} from '../../enum/user';
import {User} from '../../data/schemas';
import {RBACFailure} from '../../enum/rbac';

import {IRBACService} from './../../services/rbacService';

@injectable()
export class UserController {
  constructor(
    @inject('IUserService') private userService: IUserService,
    @inject('IRoleService') private roleService: IRoleService,
    @inject('IRBACService') private rbacService: IRBACService,
  ) {
    this.createUser = this.createUser.bind(this);
    this.getUserDetails = this.getUserDetails.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getAllUserEmails = this.getAllUserEmails.bind(this);
    this.updateUserRoles = this.updateUserRoles.bind(this);
  }

  public async createUser(req: IRequest, res: IResponse): Promise<IResponse> {
    const {user} = req.body;

    const {
      result: createdUser,
      status: createUserStatus,
      failure: createUserFailure,
    } = await this.userService.createUser({
      email: user.email,
      roleIds: [user.roleId],
    } as User);

    if (createUserStatus === ServiceResponseStatus.Failed) {
      switch (createUserFailure.reason) {
        case CreateUserFailure.UserAlreadyExists:
          return res.send(
            ConflictResult({
              reason: CreateUserFailure.UserAlreadyExists,
              message: `User with email ${user.email} already exists`,
            }),
          );
        default:
          return res.send(
            BadRequestResult({
              reason: createUserFailure.reason,
              message: UnknownError,
            }),
          );
      }
    }

    return res.send(OkResult(createdUser));
  }

  public async getUserDetails(req: IRequest, res: IResponse): Promise<IResponse> {
    const id = req.params.id;

    const {result: user, status, failure} = await this.userService.getUser(id);

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case GetUserFailure.UserNotFound:
          return res.send(
            BadRequestResult({
              reason: GetUserFailure.UserNotFound,
              message: 'User Not Found',
            }),
          );
      }
    }

    return res.send(OkResult(user));
  }

  public async changePassword(req: IRequest, res: IResponse): Promise<IResponse> {
    const {email} = req.user;
    const {oldPassword, newPassword} = req.body.changePasswordData;

    const {status, failure} = await this.userService.changePassword(
      email,
      newPassword,
      oldPassword,
    );

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case ChangePasswordFailure.IncorrectPassword:
          return res.send(
            BadRequestResult({
              reason: failure.reason,
              message: 'Password is incorrect',
            }),
          );
      }
    }

    return res.send(NoContentResult());
  }

  public async getAllUsers(req: IRequest, res: IResponse): Promise<IResponse> {
    const userPermissions = req.permissions;

    const canReadAllUsers = this.rbacService.checkPermissions({
      userPermissions,
      requiredPermissions: [PERMISSION_WRAPPER.USER.READ.ALL],
    });

    if (!canReadAllUsers) {
      return res.send(
        ForbiddenResult({
          reason: RBACFailure.NotAllowedToTakeThisAction,
          message: 'You are not allowed to take this action',
        }),
      );
    }

    const users = await this.userService.getAllUsers();

    return res.send(OkResult(users));
  }

  public async getAllUserEmails(req: IRequest, res: IResponse): Promise<IResponse> {
    const {result: emails} = await this.userService.getAllUserEmails();

    return res.send(OkResult(emails));
  }

  public async updateUserRoles(req: IRequest, res: IResponse): Promise<IResponse> {
    const {updateUserRoles} = req.body as {
      updateUserRoles: {
        roleIds: string[];
      };
    };

    const {userId} = req.params;

    const {roleIds} = updateUserRoles;

    const {status, failure} = await this.userService.updateUserRoles({
      userId,
      roleIds,
    });

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case UpdateUserRoleFailure.UserNotFound:
          return res.send(
            NotFoundResult({
              reason: failure.reason,
              message: 'User not found',
            }),
          );
        case UpdateUserRoleFailure.RoleNotFound:
          return res.send(
            NotFoundResult({
              reason: failure.reason,
              message: 'One role in payload not found',
            }),
          );
      }
    }

    return res.send(OkResult(UpdateSuccessMsg));
  }
}
