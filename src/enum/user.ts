export enum CreateUserFailure {
  UserAlreadyExists = 'UserAlreadyExists',
}

export enum GetUserFailure {
  UserNotFound = 'UserNotFound',
}

export enum GetEmailInformationFailure {
  UserNotFound = 'UserNotFound',
}

export enum ChangePasswordFailure {
  IncorrectPassword = 'IncorrectPassword',
}

export enum UpdateUserRoleFailure {
  UserNotFound = 'UserNotFound',
  RoleNotFound = 'RoleNotFound',
}
