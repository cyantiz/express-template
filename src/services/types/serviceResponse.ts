import {CommonAuthenticationFailure} from '../../api/types';
import {RBACFailure} from '../../enum/rbac';
import {ValidationResult} from '../validators/validator';

export interface ServiceResponse<TResult = any, TFailure extends ServiceFailure = any> {
  status: ServiceResponseStatus;
  validationResult?: ValidationResult;
  failure?: TFailure;
  result?: TResult;
}

export interface ServiceFailure<TReason = any> {
  reason: TReason | RBACFailure | CommonAuthenticationFailure;
  payload?: any;
}

export enum ServiceResponseStatus {
  Success = 'Success',
  Failed = 'Failed',
  ValidationFailed = 'ValidationFailed',
}
