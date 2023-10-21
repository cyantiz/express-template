import express from 'express';
import {container} from 'tsyringe';

import {PERMISSION_WRAPPER} from '../../data/constants/permissions';
import {UserController} from '../controllers/userController';
import {checkPermission} from '../middlewares/checkPermission';
import {JoiSchema, JoiValidationSchema, joiValidator} from '../middlewares/joiMiddleware';

import {wrapper} from './../../utils/routeWrapper';

const router = express.Router();
const userController = container.resolve(UserController);

router.get('/emails', wrapper(userController.getAllUserEmails));
router.post(
  '/',
  checkPermission(PERMISSION_WRAPPER.USER.CREATE.ALL),
  joiValidator(JoiValidationSchema.createUser, JoiSchema.createUser),
  wrapper(userController.createUser),
);

router.get('/:id', wrapper(userController.getUserDetails));
router.get('/', wrapper(userController.getAllUsers));

router.patch(
  '/password',
  checkPermission(PERMISSION_WRAPPER.USER.UPDATE.SELF),
  joiValidator(JoiValidationSchema.changePasswordData, JoiSchema.changePasswordData),
  wrapper(userController.changePassword),
);

router.patch(
  '/:userId/roles',
  checkPermission(PERMISSION_WRAPPER.ROLE.UPDATE.ALL),
  joiValidator(JoiValidationSchema.updateUserRoles, JoiSchema.updateUserRoles),
  wrapper(userController.updateUserRoles),
);

export default router;
