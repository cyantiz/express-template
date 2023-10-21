import {inject, injectable} from 'tsyringe';
import Joi from 'joi';

import {
  OkResult,
  BadRequestResult,
  NotFoundResult,
  ValidationResult,
  ForbiddenResult,
} from '../httpResponses';
import {IAuthService} from '../../services/authService';
import {IRequest, IResponse} from '../types';
import {ServiceResponseStatus} from '../../services/types/serviceResponse';
import {AuthenticationFailure} from '../../enum';

@injectable()
export class AuthController {
  constructor(@inject('IAuthService') private authService: IAuthService) {
    this.login = this.login.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);

    this.resetPassword = this.resetPassword.bind(this);
  }

  public async login(req: IRequest, res: IResponse): Promise<IResponse> {
    const {email, password} = req.body;
    const {result: token, status, failure} = await this.authService.authenticate({email, password});

    if (status === ServiceResponseStatus.Failed) {
      switch (failure.reason) {
        case AuthenticationFailure.UserNotFound:
          res.send(
            NotFoundResult({
              reason: AuthenticationFailure.UserNotFound,
              message: `Email ${req.body.email} not found`,
            }),
          );

          return;
        case AuthenticationFailure.InvalidCredentials:
          res.send(
            BadRequestResult({
              reason: AuthenticationFailure.InvalidCredentials,
              message: `Invalid email or password`,
            }),
          );

          return;

        case AuthenticationFailure.LoginNotAllowed:
          res.send(
            BadRequestResult({
              reason: AuthenticationFailure.LoginNotAllowed,
              message: `Not allow login to system`,
            }),
          );

          return;
      }
    }

    return res.send(OkResult({token}));
  }

  public async forgotPassword(req: IRequest, res: IResponse): Promise<IResponse> {
    const {email} = req.body;

    if (!email) {
      return res.send(
        BadRequestResult({
          reason: AuthenticationFailure.BadRequest,
          message: 'Email is required',
        }),
      );
    }

    const result = await this.authService.sendResetPasswordEmail(email);

    switch (result.status) {
      case ServiceResponseStatus.Failed:
        res.send(
          BadRequestResult({
            reason: AuthenticationFailure.InvalidCredentials,
            message: 'Invalid Email',
          }),
        );
        break;
      case ServiceResponseStatus.Success:
        res.send(OkResult());
        break;
    }
  }

  // Need Rework
  public async resetPassword(req: IRequest, res: IResponse): Promise<IResponse> {
    const schema = Joi.object({
      password: Joi.string().required(),
      confirmPassword: Joi.string().required(),
      token: Joi.string().required(),
    }).options({abortEarly: false});

    try {
      await schema.validateAsync(req.body);
    } catch (err) {
      return res.send(
        ValidationResult(
          err.details.map((x) => ({
            reason: AuthenticationFailure.BadRequest,
            message: x.message,
          })),
        ),
      );
    }
    const {password, confirmPassword, token} = req.body;

    if (!password || !confirmPassword)
      return res.send(
        BadRequestResult({
          reason: AuthenticationFailure.BadRequest,
          message: 'Password is required',
        }),
      );

    const verifyTokenResult = await this.authService.verifyResetPasswordToken(token);

    switch (verifyTokenResult.status) {
      case ServiceResponseStatus.ValidationFailed:
        return res.send(
          ValidationResult(
            verifyTokenResult.validationResult.failures.map((x) => ({
              reason: AuthenticationFailure.BadRequest,
              message: x.message,
            })),
          ),
        );
      case ServiceResponseStatus.Failed:
        return res.send(
          ForbiddenResult({
            reason: AuthenticationFailure.InvalidToken,
            message: 'Invalid Signature of Token',
          }),
        );
    }

    const user = verifyTokenResult.result as {[key: string]: any};

    const result = await this.authService.resetPassword({
      email: user.email,
      password,
      confirmPassword,
    });

    switch (result.status) {
      case ServiceResponseStatus.Success:
        res.send(OkResult());
        break;
      case ServiceResponseStatus.Failed:
        switch (result.failure.reason) {
          case AuthenticationFailure.UserNotFound:
            res.send(
              BadRequestResult({
                reason: AuthenticationFailure.UserNotFound,
                message: `Email ${user.email} is not existed`,
              }),
            );
            break;
          case AuthenticationFailure.PasswordNotMatched:
            res.send(
              BadRequestResult({
                reason: AuthenticationFailure.PasswordNotMatched,
                message: 'Password and Confirm Password do not match',
              }),
            );
        }

        break;
    }
  }
}
