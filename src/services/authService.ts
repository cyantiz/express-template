import {map} from 'lodash';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import {injectable, inject} from 'tsyringe';
import jwt from 'jsonwebtoken';

import {IUserRepository} from '../data/repositories/userRepository';
import {Transaction} from '../data/transaction';
import {User} from '../data/schemas';
import config from '../config';
import {hashPassword} from '../utils/password';
import {IUserMailerSender} from '../infrastructure/mailer';
import {IRoleRepository} from '../data/repositories/roleRepository';
import {ICloudStorage} from '../infrastructure/cloudStorage';
import {AuthenticationFailure} from '../enum';
import {convertPermissionToString} from '../data/constants/permissions';

import {ServiceFailure, ServiceResponse, ServiceResponseStatus} from './types/serviceResponse';
import {AuthUserInformation} from './DTO';
import {IPermissionRepository} from './../data/repositories/permissionRepository';

interface IVerifyTokenResult {
  user: {
    id: string;
    email: string;
  };
}

export interface IAuthService {
  getUser(email: string): Promise<User>;
  authenticate(loginData: {
    email: string;
    password: string;
  }): Promise<ServiceResponse<string, ServiceFailure<AuthenticationFailure>>>;
  sendResetPasswordEmail(
    email: string,
  ): Promise<ServiceResponse<ServiceFailure<AuthenticationFailure>>>;
  verifyResetPasswordToken(
    token: string,
  ): Promise<ServiceResponse<IVerifyTokenResult, ServiceFailure<AuthenticationFailure>>>;
  resetPassword(resetPasswordData: {
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<ServiceResponse<any, ServiceFailure<AuthenticationFailure>>>;
}

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject('IRoleRepository') private roleRepository: IRoleRepository,
    @inject('IUserRepository')
    private userRepository: IUserRepository,
    @inject('IUserMailerSender') private userMailerReceiver: IUserMailerSender,
    @inject('ICloudStorage') private cloudStorage: ICloudStorage,
    @inject('IPermissionRepository') private permissionRepository: IPermissionRepository,
  ) {}

  public async resetPassword(resetPasswordData: {
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<ServiceResponse<any, ServiceFailure<AuthenticationFailure>>> {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    }).options({abortEarly: false});

    try {
      await schema.validateAsync(resetPasswordData);
    } catch (err) {
      return {
        status: ServiceResponseStatus.ValidationFailed,
        validationResult: {
          valid: false,
          failures: err.details,
        },
      };
    }
    const user = await this.userRepository.getUserByEmail(resetPasswordData.email);

    if (!user) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {
          reason: AuthenticationFailure.UserNotFound,
        },
      };
    }
    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {
          reason: AuthenticationFailure.PasswordNotMatched,
        },
      };
    }
    const hashedPassword = await hashPassword(resetPasswordData.password);

    const transactionResult = await Transaction.begin(
      async (
        transaction: Transaction,
      ): Promise<ServiceResponse<any, ServiceFailure<AuthenticationFailure>>> => {
        try {
          await this.userRepository.update(user._id.toString(), {password: hashedPassword});
          await transaction.commit();

          return {status: ServiceResponseStatus.Success};
        } catch (err) {
          await transaction.rollback();
          throw err;
        }
      },
    );

    return transactionResult;
  }

  public async getUser(email: string): Promise<User> {
    return await this.userRepository.getUserByEmail(email);
  }

  public async authenticate(loginData: {
    email: string;
    password: string;
  }): Promise<ServiceResponse<string, ServiceFailure<AuthenticationFailure>>> {
    const user = await this.userRepository.getUserByEmail(loginData.email);

    if (!user) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: AuthenticationFailure.UserNotFound},
      };
    }
    if (!user.activatedUser) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: AuthenticationFailure.LoginNotAllowed},
      };
    }
    const roles = await this.roleRepository.getIn(map(user.roleIds, (roleId) => roleId.toString()));

    const permissionIds =
      roles
        ?.flatMap((role) => role.permissions ?? [])
        ?.map((permission) => permission?.toString()) ?? [];
    const permissions = await this.permissionRepository.getIn(permissionIds);

    const match = await bcrypt.compare(loginData.password, user.password);

    if (!match) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: AuthenticationFailure.InvalidCredentials},
      };
    }

    const tokenData = {
      id: user._id.toHexString(),
      email: user.email,
      roles: map(roles, (role) => role.name),
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: this.cloudStorage.getPublicImageUrls([user.avatarUrl])[0],
      permissions: permissions.map((permission) => convertPermissionToString(permission)),
    };

    const token = this.generateToken(tokenData);

    return {
      status: ServiceResponseStatus.Success,
      result: token,
    };
  }

  public async verifyResetPasswordToken(
    token: string,
  ): Promise<ServiceResponse<IVerifyTokenResult, ServiceFailure<AuthenticationFailure>>> {
    try {
      const secret = config.secretKeyResetPassword;

      const result = await jwt.verify(token, secret);

      return {
        status: ServiceResponseStatus.Success,
        result: (result as any).user,
      };
    } catch (err) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {
          reason: AuthenticationFailure.InvalidToken,
        },
      };
    }
  }

  public async sendResetPasswordEmail(
    email: string,
  ): Promise<ServiceResponse<ServiceFailure<AuthenticationFailure>>> {
    const user = await this.userRepository.getUserByEmail(email);

    if (!user) {
      return {
        status: ServiceResponseStatus.Failed,
        failure: {reason: AuthenticationFailure.UserNotFound},
      };
    }

    const roles = await this.roleRepository.getIn(map(user.roleIds, (roleId) => roleId.toString()));
    const permissionIds =
      roles
        ?.flatMap((role) => role.permissions ?? [])
        ?.map((permission) => permission?.toString()) ?? [];

    const permissions = await this.permissionRepository.getIn(permissionIds);

    const resetPasswordToken = {
      id: user._id.toHexString(),
      email: user.email,
      roles: roles.map((role) => role.name),
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      permissions: map(permissions, convertPermissionToString),
    };

    const secret = config.secretKeyResetPassword;
    const token = this.generateToken(resetPasswordToken, secret, '30m');

    try {
      await this.userMailerReceiver.receiveOnResetPassword(user.email, token);
    } catch (err) {
      return {
        status: ServiceResponseStatus.Failed,
      };
    }

    return {
      status: ServiceResponseStatus.Success,
    };
  }

  private generateToken(
    user: AuthUserInformation,
    privateKey: string = config.jwt.privateKey,
    expiresIn: string = config.jwt.tokenLifeTime,
  ) {
    return jwt.sign(
      {
        user: {id: user.id, email: user.email},
        roles: user.roles,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        permissions: user.permissions,
      },
      privateKey,
      {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        expiresIn: expiresIn,
      },
    );
  }
}
