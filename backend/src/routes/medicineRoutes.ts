import { Router } from 'express';
import {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicineController';

import { authPharmacy } from '../middleware/authPharmacy';

const router = Router();
router.post('/', authPharmacy, createMedicine);
router.get('/', authPharmacy, getMedicines);
router.get('/:id', authPharmacy, getMedicineById);
router.put('/:id', authPharmacy, updateMedicine);
router.delete('/:id', authPharmacy, deleteMedicine);


export default router;