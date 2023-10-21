import {createSchema, Type} from 'ts-mongoose';

import {PermissionSchema} from './permission';

export const RoleSchema = createSchema(
  {
    name: Type.string({required: true}),
    accessLevel: Type.number({required: true}),
    permissions: Type.array().of(Type.ref(Type.objectId()).to('Permission', PermissionSchema)),
  },
  {timestamps: true, strict: false, strictQuery: true},
);
