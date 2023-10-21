import {Permission} from '../schemas';

// Schema is a resource itself, moreover, you can create resource that outside of the schema, e.g: PASSWORD, EMAIL, USER_PROFILE, etc...
const RESOURCES = ['USER', 'ROLE', 'PERMISSION'];
const SCOPE = ['ALL', 'PUBLIC', 'SELF'];
const ACTION = [
  'READ',
  'UPDATE',
  'CREATE',
  'CANCEL',
  'SOFT_DELETE',
  'HARD_DELETE',
  'RESTORE',
  'PUBLISH',
];

const PERMISSION_WRAPPER: PermissionWrapper = {
  USER: undefined,
  ROLE: undefined,
  PERMISSION: undefined,
};

type Resource = 'USER' | 'ROLE' | 'PERMISSION';

type Action =
  | 'READ'
  | 'UPDATE'
  | 'CREATE'
  | 'CANCEL'
  | 'SOFT_DELETE'
  | 'HARD_DELETE'
  | 'RESTORE'
  | 'PUBLISH';

type Scope = 'SELF' | 'PUBLIC' | 'ALL';

type PermissionForScope = {
  [key in Scope]: string;
};

type ActionForResource = {
  [key in Action]: PermissionForScope;
};

type PermissionWrapper = {
  [key in Resource]: ActionForResource;
};

for (const resource of RESOURCES) {
  PERMISSION_WRAPPER[resource] = {} as ActionForResource;
  for (const action of ACTION) {
    PERMISSION_WRAPPER[resource][action] = {} as PermissionForScope;
    for (const scope of SCOPE) {
      PERMISSION_WRAPPER[resource][action][scope] = `${action}.${scope}.${resource}`;
    }
  }
}

export function convertPermissionToString(permission: Permission): string {
  return `${permission.action}.${permission.scope}.${permission.resource}`;
}

export function permissionListToRecord(permissions: Permission[]): Record<string, Permission> {
  const result: Record<string, Permission> = {};

  for (const permission of permissions) {
    result[convertPermissionToString(permission)] = permission;
  }

  return result;
}

export function hasPermission(
  authPermissions: Permission[],
  inputPermissions: Permission[],
): boolean {
  for (const inputPermission of inputPermissions) {
    const inputPermissionString = convertPermissionToString(inputPermission);

    const isExist = authPermissions.some((permission) => {
      const permissionString = convertPermissionToString(permission);

      return permissionString === inputPermissionString;
    });

    if (!isExist) {
      return false;
    }
  }

  return true;
}

export function convertStringToPermission(value: string): Partial<Permission> {
  const [action, scope, resource] = value.split('.');

  return {
    action,
    resource,
    scope,
  };
}

export {PERMISSION_WRAPPER};
