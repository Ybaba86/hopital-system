import { Router } from 'express';
import {
  createPharmacy,
  getPharmacies,
  deletePharmacy
} from '../controllers/pharmacyController';

const router = Router();
router.post('/', createPharmacy);
router.get('/', getPharmacies);
router.delete('/:id', deletePharmacy);

export default router;
