export enum RoleFailure {
  RoleNotFound = 'RoleNotFound',
  BadRequest = 'BadRequest',
  SomeRoleInListNotFound = 'SomeRoleInListNotFound',
  RoleWithThisNameAlreadyExist = 'RoleWithThisNameAlreadyExist',
  AtLeastOneUserHavingThisRole = 'AtLeastOneUserHavingThisRole',
}

export enum Role {
  SuperAdmin = 'SuperAdmin',
  NormalUser = 'NormalUser',
}
