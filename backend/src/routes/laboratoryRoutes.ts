import { Router } from 'express';
import {
  createLaboratory,
  getLaboratories,
  deleteLaboratory
} from '../controllers/laboratoryController';

const router = Router();
router.post('/', createLaboratory);
router.get('/', getLaboratories);
router.delete('/:id', deleteLaboratory);

export default router;
