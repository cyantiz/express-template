import {DependencyContainer} from 'tsyringe';

import {DbContext} from './dbContext';
import {IPermissionRepository, PermissionRepository} from './repositories/permissionRepository';
import {IRoleRepository, RoleRepository} from './repositories/roleRepository';
import {UserRepository, IUserRepository} from './repositories/userRepository';

export async function install(container: DependencyContainer) {
  container
    .registerSingleton<DbContext>(DbContext)
    .register<IUserRepository>('IUserRepository', {
      useClass: UserRepository,
    })
    .register<IRoleRepository>('IRoleRepository', {
      useClass: RoleRepository,
    })
    .register<IPermissionRepository>('IPermissionRepository', {
      useClass: PermissionRepository,
    });
}
