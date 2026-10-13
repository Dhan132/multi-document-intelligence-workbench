import { Router } from 'express';

import { analyzeDocuments } from '../controllers/analysis.controller';

const router = Router();

router.post('/analyze', analyzeDocuments);

export default router;
