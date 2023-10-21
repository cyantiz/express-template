import express from 'express';
import {container} from 'tsyringe';

import {wrapper} from '../../utils/routeWrapper';
import {FileController} from '../controllers/fileController';

const router = express.Router();
const fileController = container.resolve(FileController);

router.get('/upload-info', wrapper(fileController.getUploadInfo));
router.delete('/', wrapper(fileController.deleteFiles));

export default router;
