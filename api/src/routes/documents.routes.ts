import { Router } from 'express';

import { listStoredDocuments, uploadDocuments } from '../controllers/documents.controller';
import { config } from '../config';
import { upload } from '../middleware/upload-validation';

const router = Router();

router.get('/', listStoredDocuments);
router.post('/upload', upload.array('documents', config.maxFilesPerRequest), uploadDocuments);

export default router;
