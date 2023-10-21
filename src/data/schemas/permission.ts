import {createSchema, Type} from 'ts-mongoose';

export const PermissionSchema = createSchema(
  {
    resource: Type.string({required: true}),
    action: Type.string({required: true}),
    scope: Type.string({required: true}),
  },
  {timestamps: true, strict: false, strictQuery: true},
);
