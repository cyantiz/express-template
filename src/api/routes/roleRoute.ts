import express from 'express';
import {container} from 'tsyringe';

import {PERMISSION_WRAPPER} from '../../data/constants/permissions';
import {wrapper} from '../../utils/routeWrapper';
import {RoleController} from '../controllers/roleController';
import {checkPermission} from '../middlewares/checkPermission';
import {JoiValidationSchema, joiValidator} from '../middlewares/joiMiddleware';

const router = express.Router();
const roleController = container.resolve(RoleController);

router.get('/', checkPermission(PERMISSION_WRAPPER.ROLE.READ.ALL), roleController.getAll);
router.get('/:roleId', checkPermission(PERMISSION_WRAPPER.ROLE.READ.ALL), roleController.getById);

router.post(
  '/',
  checkPermission(PERMISSION_WRAPPER.ROLE.CREATE.ALL),
  joiValidator(JoiValidationSchema.role, 'role'),
  wrapper(roleController.create),
);

router.patch(
  '/add-permission-to-all-role',
  checkPermission(PERMISSION_WRAPPER.ROLE.UPDATE.ALL),
  joiValidator(JoiValidationSchema.permissions, 'permissions'),
  wrapper(roleController.addPermissionToAllRole),
);

router.patch(
  '/:roleId',
  checkPermission(PERMISSION_WRAPPER.ROLE.UPDATE.ALL),
  joiValidator(JoiValidationSchema.role, 'role'),
  wrapper(roleController.updateRolePermissions),
);

router.delete(
  '/:roleId',
  checkPermission(PERMISSION_WRAPPER.ROLE.HARD_DELETE.ALL),
  wrapper(roleController.delete),
);

export default router;
