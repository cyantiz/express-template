import {DependencyContainer} from 'tsyringe';

import {AuthService, IAuthService} from './authService';
import {IPermissionService, PermissionService} from './permissionService';
import {IRoleService, RoleService} from './roleService';
import {IFileService, FileService} from './fileService';
import {UserService, IUserService} from './userService';
import {MailValidator} from './validators/mailValidator';
import {IRBACService, RBACService} from './rbacService';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function install(container: DependencyContainer) {
  container
    .register<IAuthService>('IAuthService', {
      useClass: AuthService,
    })
    .register<IUserService>('IUserService', {
      useClass: UserService,
    })
    .register<IFileService>('IFileService', {
      useClass: FileService,
    })
    .register<IRoleService>('IRoleService', {
      useClass: RoleService,
    })
    .register<IPermissionService>('IPermissionService', {
      useClass: PermissionService,
    })
    .register<MailValidator>('MailValidator', {
      useClass: MailValidator,
    })
    .register<IRBACService>('IRBACService', {
      useClass: RBACService,
    });
}
