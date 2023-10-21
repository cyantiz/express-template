import {Role} from './../../data/schemas/index';
export type ReturnedUser = {
  _id?: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  gender: string;
  nationality: string;
  address: string;
  phoneNumber: string;
  skype: string;
  position: string;
  employmentDate: string;
  grade: number;
  description: string;
  avatarUrl?: string;
};

export interface RoleWithPermissionNames extends Omit<Role, '_id' | 'permissions'> {
  _id: string;
  name: string;
  permissions: string[];
}
