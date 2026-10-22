import { Router } from 'express';
import {
  createSaleFromPrescription,
  getSales,
  getSaleById,
  getPrescriptionByQrCode,
  cancelSale,
  getPatientSales,
  getReportByInterval
} from '../controllers/saleController';

import { authPharmacy } from '../middleware/authPharmacy';

const router = Router();
router.post('/', authPharmacy, createSaleFromPrescription);
router.get('/', authPharmacy, getSales);
router.get('/:id', authPharmacy, getSaleById);
router.get('/prescription/qr/:qrCode', getPrescriptionByQrCode);
router.put('/:id/cancel', authPharmacy, cancelSale);
router.get('/patient/:patientId', authPharmacy, getPatientSales);
router.get('/report/interval', authPharmacy, getReportByInterval);

export default router;