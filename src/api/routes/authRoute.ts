import express from 'express';
import {container} from 'tsyringe';

import {AuthController} from '../controllers/authController';

const router = express.Router();
const authController = container.resolve(AuthController);

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
