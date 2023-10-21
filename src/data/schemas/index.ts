import {ExtractProps} from 'ts-mongoose';

import {UserSchema} from './user';
import {RoleSchema} from './role';
import {PermissionSchema} from './permission';

export type User = ExtractProps<typeof UserSchema> & {
  roles?: Partial<Role>[];
};
export type Role = ExtractProps<typeof RoleSchema>;
export type Permission = ExtractProps<typeof PermissionSchema>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function modelDefs() {
  return [
    {name: 'User', schema: UserSchema},
    {name: 'Role', schema: RoleSchema},
    {name: 'Permission', schema: PermissionSchema},
  ];
}
