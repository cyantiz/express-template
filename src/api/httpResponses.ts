import {ValidationFailure} from '../services/validators/validator';

export interface ResponseResult {
  statusCode: number;
  message?: string[];
  payload?: any;
  failures?: ResponseFailure[];
}

interface ResponseFailure {
  reason?: string;
  message?: string;
  placeholders?: string[];
}

export const OkResult = (payload?: any): ResponseResult => ({
  statusCode: 200,
  payload,
});

export const NoContentResult = (): ResponseResult => ({
  statusCode: 204,
});

export const BadRequestResult = (
  failures: ResponseFailure | ResponseFailure[] | string,
): ResponseResult => ({
  statusCode: 400,
  failures:
    typeof failures === 'string'
      ? [
          {
            message: failures,
          },
        ]
      : Array.isArray(failures)
      ? failures
      : [failures],
});

export const ForbiddenResult = (
  failures: ResponseFailure | ResponseFailure[] | string,
): ResponseResult => ({
  statusCode: 403,
  failures:
    typeof failures === 'string'
      ? [
          {
            message: failures,
          },
        ]
      : Array.isArray(failures)
      ? failures
      : [failures],
});

export const NotFoundResult = (
  failures: ResponseFailure | ResponseFailure[] | string,
): ResponseResult => ({
  statusCode: 404,
  failures:
    typeof failures === 'string'
      ? [
          {
            message: failures,
          },
        ]
      : Array.isArray(failures)
      ? failures
      : [failures],
});
export const ConflictResult = (
  failures: ResponseFailure | ResponseFailure[] | string,
): ResponseResult => ({
  statusCode: 409,
  failures:
    typeof failures === 'string'
      ? [
          {
            message: failures,
          },
        ]
      : Array.isArray(failures)
      ? failures
      : [failures],
});

export const ServerErrorResult = (
  failures: ResponseFailure | ResponseFailure[] | string,
): ResponseResult => ({
  statusCode: 500,
  failures:
    typeof failures === 'string'
      ? [
          {
            message: failures,
          },
        ]
      : Array.isArray(failures)
      ? failures
      : [failures],
});

export const ValidationResult = (failures: ValidationFailure[]): ResponseResult => ({
  statusCode: 400,
  failures: failures.map((x) => ({
    reason: x.reason,
    message: x.message,
  })),
});

export const UpdateSuccessMsg = {
  message: 'Update successful',
};

export const CreateSuccessMsg = {
  message: 'Create successful',
};

export const DeleteSuccessMsg = {
  message: 'Delete successful',
};
