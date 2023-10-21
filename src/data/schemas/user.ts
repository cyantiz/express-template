import {createSchema, Type} from 'ts-mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

import {RoleSchema} from './role';

export const UserSchema = createSchema(
  {
    email: Type.string({
      required: true,
      unique: true,
      match: [/^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please fill a valid email address'],
    }),
    password: Type.string({required: true}),
    roleIds: Type.array().of(Type.ref(Type.objectId()).to('Role', RoleSchema)),
    activatedUser: Type.boolean({required: true}),
    firstName: Type.string({required: true}),
    lastName: Type.string({required: true}),
    avatarUrl: Type.string({required: true}),
  },
  {timestamps: true},
).plugin(aggregatePaginate);

UserSchema.virtual('roles', {
  ref: 'Role',
  localField: '_id',
  foreignField: 'roleIds',
});
UserSchema.set('toJSON', {virtuals: true});
