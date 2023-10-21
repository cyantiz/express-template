import express from 'express';
import {container} from 'tsyringe';

import {PERMISSION_WRAPPER} from '../../data/constants/permissions';
import {wrapper} from '../../utils/routeWrapper';
import {PermissionController} from '../controllers/permissionController';
import {checkPermission} from '../middlewares/checkPermission';
import {JoiValidationSchema, joiValidator} from '../middlewares/joiMiddleware';

const router = express.Router();
const permissionController = container.resolve(PermissionController);

router.get(
  '/',
  checkPermission(PERMISSION_WRAPPER.PERMISSION.READ.ALL),
  wrapper(permissionController.getAllPermissionNames),
);
router.get(
  '/self',
  checkPermission(PERMISSION_WRAPPER.PERMISSION.READ.SELF),
  wrapper(permissionController.getSelfPermissionNames),
);

router.post(
  '/',
  checkPermission(PERMISSION_WRAPPER.PERMISSION.CREATE.ALL),
  joiValidator(JoiValidationSchema.permission, 'permission'),
  wrapper(permissionController.createPermission),
);
router.post(
  '/create-many',
  checkPermission(PERMISSION_WRAPPER.PERMISSION.CREATE.ALL),
  joiValidator(JoiValidationSchema.permissions, 'permissions'),
  wrapper(permissionController.createPermissions),
);

router.get('/seed', wrapper(permissionController.seedPermissions));

router.get('/seed', wrapper(permissionController.seedPermissions));

export default router;
